import { ParsedAbi, Interface, GetMethod, InternalMessage } from './abi_parser';
import { Address, TupleItem, beginCell, TupleReader, Cell } from '@ton/core';
import { Blockchain } from '@ton/sandbox';
import { expect } from '@jest/globals';

/**
 * Creates a TonAbi instance from ABI object
 * @param abiObject ABI object
 */
export function createTonAbiFromObject(abiObject: ParsedAbi): TonAbi {
  return new TonAbi(abiObject);
}

/**
 * Creates a TonAbi instance from JSON string
 * @param jsonString JSON string with ABI
 */
export function createTonAbiFromJson(jsonString: string): TonAbi {
  try {
    const abiObject = JSON.parse(jsonString) as ParsedAbi;
    return createTonAbiFromObject(abiObject);
  } catch (error) {
    console.error('Error parsing ABI JSON string:', error);
    throw error;
  }
}

/**
 * Base class for all ABI entities
 */
export abstract class AbiEntity {
  protected _data: any;

  constructor(data: any) {
    this._data = data;
  }

  public get rawData(): any {
    return this._data;
  }
}

/**
 * Class for method parameters
 */
export class MethodParameter {
  private _category: string;
  private _name: string;
  private _type: string | null;

  constructor(category: string, name: string, type: string | null) {
    this._category = category;
    this._name = name;
    this._type = type;
  }

  public get category(): string {
    return this._category;
  }

  public get name(): string {
    return this._name;
  }

  public get type(): string | null {
    return this._type;
  }

  /**
   * Get TypeScript type for this parameter
   */
  public getTsType(): string {
    if (!this._type) return 'any';

    switch (this._type) {
      case 'bool': return 'boolean';
      case 'int257': 
      case 'uint64':
      case 'uint256':
      case 'uint16':
      case 'uint32': return 'bigint';
      case 'msgaddress': return 'Address | null';
      case 'text': return 'string';
      case 'any': return 'any';
      case 'FullContent': return 'any'; // Can be replaced with a more specific type
      default:
        if (this._type.includes('Maybe')) return 'any | null';
        if (this._type.includes('Either')) return 'any';
        if (this._type.includes('Cell')) return 'Cell'; // Assuming Cell type exists
        return 'any';
    }
  }

  /**
   * Get TypeScript parameter string for function signature
   */
  public toTsParam(): string {
    return `${this._name}: ${this.getTsType()}`;
  }
}

/**
 * Class for internal message parameters
 */
export class MessageParameter {
  private _name: string;
  private _type: string;

  constructor(name: string, type: string) {
    this._name = name;
    this._type = type;
  }

  public get name(): string {
    return this._name;
  }

  public get type(): string {
    return this._type;
  }

  /**
   * Get TypeScript type for this parameter
   */
  public getTsType(): string {
    // Handle simple types first
    switch (this._type) {
      case 'uint64': return 'bigint';
      case 'uint256': return 'bigint';
      case 'uint16': return 'bigint';
      case 'uint32': return 'bigint';
      case 'Bool': return 'boolean';
      case 'MsgAddress': return 'Address';
    }
    
    // Check for complex types using startsWith to handle types with spaces
    if (this._type.startsWith('(Maybe')) return 'Cell | null';
    if (this._type.startsWith('(Either')) return 'Cell';
    if (this._type.startsWith('(VarUInteger')) return 'bigint';
    if (this._type.includes('Cell')) return 'Cell';
    
    // Default fallback
    return 'any';
  }

  /**
   * Get TypeScript parameter string for function signature
   */
  public toTsParam(): string {
    return `${this._name}: ${this.getTsType()}`;
  }
}

/**
 * Class for working with ABI interfaces
 */
export class AbiInterface extends AbiEntity {
  constructor(data: Interface) {
    super(data);
  }

  public get name(): string {
    return this._data.name;
  }

  public get inherits(): string | null {
    return this._data.inherits;
  }

  public get codeHash(): string | null {
    return this._data.code_hash;
  }

  public get getMethodsRefs(): string[] {
    return this._data.get_methods_ref;
  }

  public get messagesInRefs(): string[] {
    return this._data.messages_in_ref;
  }

  public get messagesOutRefs(): string[] {
    return this._data.messages_out_ref;
  }

  /**
   * Get TypeScript interface string
   */
  public toTsInterface(abi: TonAbi): string {
    // Check if this interface inherits from another interface
    let inheritedInterface = '';
    if (this.inherits) {
      const parentName = abi.normalizeInterfaceName(this.inherits);
      inheritedInterface = ` extends I${parentName}`;
    }
    
    let result = `export interface I${this.normalizeInterfaceName(this.name)}${inheritedInterface} {\n`;
    
    // Add methods
    for (const methodRef of this.getMethodsRefs) {
      const method = abi.findGetMethod(methodRef);
      if (method) {
        result += `  /**\n`;
        result += `   * ${method.name}\n`;
        result += `   */\n`;
        
        // Generate parameter list from inputs
        const paramsList = method.inputs.map(p => p.toTsParam()).join(', ');
        
        // Generate return type
        const returnType = this.getReturnType(method);
        
        result += `  ${method.name}(${paramsList}): Promise<${returnType}>;\n\n`;
      } else {
        // Log warning about missing method
        console.warn(`Warning: Method ${methodRef} referenced in interface ${this.name} was not found in ABI definition`);
      }
    }
    
    // Add incoming messages
    for (const msgRef of this.messagesInRefs) {
      const msg = abi.findInternalMessage(msgRef);
      if (msg) {
        result += `  /**\n`;
        result += `   * Send ${msg.name} message\n`;
        result += `   */\n`;
        
        // Generate parameter list from message params
        const paramsList = msg.params ? msg.params.map(p => p.toTsParam()).join(', ') : '';
        
        result += `  send${this.capitalize(msg.name)}(${paramsList}): Promise<SendMessageResult>;\n\n`;
      } else {
        // Log warning about missing message
        console.warn(`Warning: Message ${msgRef} referenced in interface ${this.name} was not found in ABI definition`);
      }
    }
    
    result += `}\n`;
    return result;
  }

  private normalizeInterfaceName(name: string): string {
    return name.split('_').map(this.capitalize).join('');
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getReturnType(method: AbiGetMethod): string {
    if (method.outputs.length === 0) {
      return 'void';
    } else if (method.outputs.length === 1) {
      return method.outputs[0].getTsType();
    } else {
      return `{${method.outputs.map(p => `${p.name}: ${p.getTsType()}`).join(', ')}}`;
    }
  }
}

/**
 * Class for working with ABI get-methods
 */
export class AbiGetMethod extends AbiEntity {
  private _inputs: MethodParameter[] = [];
  private _outputs: MethodParameter[] = [];

  constructor(data: GetMethod) {
    super(data);
    
    // Parse input parameters
    if (data.inputs) {
      for (const input of data.inputs) {
        this._inputs.push(new MethodParameter(
          input.param_category,
          input.name,
          input.type
        ));
      }
    }
    
    // Parse output parameters
    if (data.outputs) {
      for (const output of data.outputs) {
        this._outputs.push(new MethodParameter(
          output.param_category,
          output.name,
          output.type
        ));
      }
    }
  }

  public get name(): string {
    return this._data.name;
  }

  public get inputs(): MethodParameter[] {
    return this._inputs;
  }

  public get outputs(): MethodParameter[] {
    return this._outputs;
  }

  /**
   * Generates TypeScript code for calling get-method using @ton/sandbox
   */
  public generateTsMethodCall(): string {
    const methodName = this.name;
    
    // Generate method parameters
    const methodParams = this.inputs.length > 0 
      ? ', ' + this.inputs.map(p => `${p.name}: ${p.getTsType()}`).join(', ') 
      : '';
    
    let result = `async ${methodName}(contractAddress: Address${methodParams}) {\n`;
    result += `  // Call get-method via Blockchain from @ton/sandbox\n`;
    result += `  const result = await this.blockchain.runGetMethod(\n`;
    result += `    contractAddress,\n`;
    result += `    '${methodName}',\n`;
    
    // Method parameters
    if (this.inputs.length > 0) {
      result += `    [\n`;
      for (const input of this.inputs) {
        result += this.generateTupleItemConversion(input);
      }
      result += `    ] as TupleItem[]\n`;
    } else {
      result += `    [] as TupleItem[]\n`;
    }
    
    result += `  );\n\n`;
    
    // Process results using TupleReader instead of parseStackItem
    if (this.outputs.length > 0) {
      result += `  // Use TupleReader to process the result\n`;
      result += `  const reader = new TupleReader(result.stack);\n`;
      
      if (this.outputs.length === 1) {
        const output = this.outputs[0];
        result += `  // Return the result\n`;
        
        switch (output.getTsType()) {
          case 'bigint':
            result += `  return reader.readBigNumber();\n`;
            break;
          case 'boolean':
            result += `  return reader.readBoolean();\n`;
            break;
          case 'string':
            result += `  return reader.readString();\n`;
            break;
          default:
            if (output.type === 'msgaddress') {
              result += `  return reader.readAddressOpt();\n`;
            } else {
              result += `  return reader.readRemainingTuple();\n`;
            }
        }
      } else {
        result += `  // Read and return all parameters\n`;
        result += `  return {\n`;
        for (const output of this.outputs) {
          result += `    ${output.name}: `;
          
          switch (output.getTsType()) {
            case 'bigint':
              result += `reader.readBigNumber(),\n`;
              break;
            case 'boolean':
              result += `reader.readBoolean(),\n`;
              break;
            case 'string':
              result += `reader.readString(),\n`;
              break;
            default:
              if (output.type === 'msgaddress') {
                result += `reader.readAddressOpt(),\n`;
              } else {
                result += `reader.readRemainingTuple(),\n`;
              }
          }
        }
        result += `  };\n`;
      }
    }
    
    result += `}\n`;
    
    return result;
  }

  /**
   * Generates code for converting parameter to TupleItem
   */
  private generateTupleItemConversion(param: MethodParameter): string {
    let result = '';
    switch (param.type) {
      case 'bool':
        result = `      { type: 'boolean', value: ${param.name} }, // boolean\n`;
        break;
      case 'int257': 
      case 'uint64':
      case 'uint256':
      case 'uint16':
      case 'uint32':
        result = `      { type: 'int', value: ${param.name} }, // bigint\n`;
        break;
      case 'msgaddress':
        result = `      { type: 'address', value: ${param.name} }, // address string\n`;
        break;
      case 'text':
        result = `      { type: 'text', value: ${param.name} }, // string\n`;
        break;
      default:
        if (param.type && param.type.includes('Cell')) {
          result = `      { type: 'cell', value: ${param.name} }, // cell\n`;
        } else {
          // Fallback for other types
          result = `      // Convert parameter ${param.name} to appropriate TupleItem based on type '${param.type}'\n`;
          result = `      { type: 'any', value: ${param.name} },\n`;
        }
    }
    return result;
  }
}

/**
 * Class for working with ABI internal messages
 */
export class AbiInternalMessage extends AbiEntity {
  private _params: MessageParameter[] = [];

  constructor(data: InternalMessage) {
    super(data);
    
    // Parse message parameters
    if (data.params) {
      for (const param of data.params) {
        // Use the full parameter type without modification
        this._params.push(new MessageParameter(
          param.name,
          param.type
        ));
      }
    }
  }

  public get name(): string {
    return this._data.xml_name;
  }

  public get definitionName(): string {
    return this._data.definition_name || '';
  }

  public get opcode(): string {
    return this._data.opcode || '';
  }

  public get params(): MessageParameter[] {
    return this._params;
  }

  public get returnType(): string {
    return this._data.return_type || '';
  }

  /**
   * Generates TypeScript code for creating and sending internal message
   */
  public generateTsMessageSender(): string {
    const methodName = `send${this.capitalizeFirstLetter(this.name)}`;
    const methodParams = this.params.map(p => p.toTsParam()).join(', ');
    
    let result = `async ${methodName}(from: Address, to: Address${this.params.length > 0 ? ', ' + methodParams : ''}) {\n`;
    result += `  // Create external message\n`;
    result += `  const message = beginCell()\n`;
    result += `    .storeUint(0x${this.opcode.replace('0x', '')}, 32) // op\n`;
    
    for (const param of this.params) {
      result += this.getStoreCodeForParam(param);
    }
    
    result += `    .endCell();\n\n`;
    result += `  // Send message via Blockchain\n`;
    result += `  const sendResult = await this.blockchain.sendMessage({\n`;
    result += `    from: undefined, // not needed for external messages\n`;
    result += `    to: this.address,\n`;
    result += `    value: 0n, // default no value\n`;
    result += `    bounce: true,\n`;
    result += `    body: message\n`;
    result += `  });\n`;
    result += `  \n`;
    result += `  // Check result\n`;
    result += `  expect(sendResult.transactions).toHaveLength(2); // Should have two transactions\n`;
    result += `  return sendResult;\n`;
    result += `}\n`;
    
    return result;
  }

  /**
   * Generates code for storing parameter in cell
   */
  private getStoreCodeForParam(param: MessageParameter): string {
    // Check for complex types first
    if (param.type.startsWith('(Maybe')) {
      return `    .storeMaybeRef(${param.name}) // ${param.name}: ${param.type}\n`;
    }
    
    if (param.type.startsWith('(VarUInteger')) {
      // Extract size from VarUInteger if available
      const matches = param.type.match(/\(VarUInteger\s+(\d+)\)/);
      const bits = matches && matches[1] ? matches[1] : '16';
      return `    .storeVarUint(${param.name}, ${bits}) // ${param.name}: ${param.type}\n`;
    }
    
    if (param.type.startsWith('(Either')) {
      return `    .storeRef(${param.name}) // ${param.name}: ${param.type}\n`;
    }
    
    // Simple types
    switch (param.type) {
      case 'uint64':
        return `    .storeUint(${param.name}, 64) // ${param.name}: uint64\n`;
      case 'uint256':
        return `    .storeUint(${param.name}, 256) // ${param.name}: uint256\n`;
      case 'uint16':
        return `    .storeUint(${param.name}, 16) // ${param.name}: uint16\n`;
      case 'uint32':
        return `    .storeUint(${param.name}, 32) // ${param.name}: uint32\n`;
      case 'Bool':
        return `    .storeBool(${param.name}) // ${param.name}: Bool\n`;
      case 'MsgAddress':
        return `    .storeAddress(${param.name}) // ${param.name}: MsgAddress\n`;
      case '^Cell':
        return `    .storeRef(${param.name}) // ${param.name}: Cell reference\n`;
      default:
        return `    // TODO: Implement proper serialization for ${param.name} with type ${param.type}\n` +
               `    .storeRef(typeof ${param.name} === 'object' && ${param.name} !== null ? ${param.name} : beginCell().endCell()) // Fallback for unknown type\n`;
    }
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Main class for working with ABI data
 */
export class TonAbi {
  private _interfaces: AbiInterface[] = [];
  private _getMethods: AbiGetMethod[] = [];
  private _internalMessages: AbiInternalMessage[] = [];

  constructor(abiData: ParsedAbi) {
    // Create interface objects
    for (const interfaceData of abiData.interfaces) {
      this._interfaces.push(new AbiInterface(interfaceData));
    }
    
    // Load get-methods
    if (abiData.get_methods) {
      for (const method of abiData.get_methods) {
        this._getMethods.push(new AbiGetMethod(method));
      }
    }
    
    // Load internal messages
    if (abiData.internal_messages) {
      for (const msg of abiData.internal_messages) {
        this._internalMessages.push(new AbiInternalMessage(msg));
      }
    }
  }

  public get interfaces(): AbiInterface[] {
    return this._interfaces;
  }

  public get getMethods(): AbiGetMethod[] {
    return this._getMethods;
  }

  public get internalMessages(): AbiInternalMessage[] {
    return this._internalMessages;
  }

  /**
   * Find interface by name
   */
  public findInterface(name: string): AbiInterface | undefined {
    return this._interfaces.find(i => i.name === name);
  }

  /**
   * Find get-method by name
   */
  public findGetMethod(name: string): AbiGetMethod | undefined {
    return this._getMethods.find(m => m.name === name);
  }

  /**
   * Find internal message by name
   */
  public findInternalMessage(name: string): AbiInternalMessage | undefined {
    return this._internalMessages.find(m => m.name === name);
  }

  /**
   * Normalize interface name
   */
  public normalizeInterfaceName(name: string): string {
    return name.split('_').map(this.capitalize).join('');
  }
  
  /**
   * Capitalize first letter of string
   */
  public capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Capitalize first letter of each word
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate TypeScript code for all interfaces
   */
  public generateAllInterfaces(): string {
    let result = '';
    
    // Add imports
    result += `// Automatically generated TypeScript interfaces for TON ABI\n\n`;
    result += `// Required imports\n`;
    result += `import { Address, TupleItem, beginCell, TupleReader, Cell } from '@ton/core';\n`;
    result += `import { Blockchain, SendMessageResult } from '@ton/sandbox';\n\n`;
    
    // Add interfaces
    for (const iface of this._interfaces) {
      result += iface.toTsInterface(this);
      result += '\n';
    }
    
    return result;
  }

  /**
   * Generate TypeScript class for working with specific interface
   */
  public generateClassForInterface(interfaceName: string): string {
    const iface = this.findInterface(interfaceName);
    if (!iface) {
      throw new Error(`Interface ${interfaceName} not found`);
    }
    
    const className = this.normalizeInterfaceName(iface.name);
    const interfaceName2 = `I${className}`;
    
    let result = '';
    
    // Add imports without @jest/globals
    result += `// Automatically generated TypeScript class for interface ${iface.name}\n\n`;
    result += `import { Address, TupleItem, beginCell, Cell, ExternalAddress, TupleReader } from '@ton/core';\n`;
    result += `import { Blockchain, SendMessageResult } from '@ton/sandbox';\n`;
    result += `import { ${interfaceName2} } from './interfaces';\n`;
    result += `import { expect } from '@jest/globals';\n\n`;
    
    // Start class
    result += `export class ${className} implements ${interfaceName2} {\n`;
    result += `  private blockchain: Blockchain;\n`;
    result += `  private address: Address;\n\n`;
    
    // Constructor
    result += `  constructor(blockchain: Blockchain, address: Address) {\n`;
    result += `    this.blockchain = blockchain;\n`;
    result += `    this.address = address;\n`;
    result += `  }\n\n`;
    
    // Get all interfaces to implement (including parent interfaces through inheritance)
    const interfacesToImplement = this.collectInheritedInterfaces(iface);
    
    // Add methods for all interfaces
    for (const currentIface of interfacesToImplement) {
      for (const methodRef of currentIface.getMethodsRefs) {
        const method = this.findGetMethod(methodRef);
        if (method) {
          result += `  ${this.generateClassMethodWithStoredAddress(method, interfaceName2)}\n`;
        }
      }
    
      // Add message sending methods for all interfaces
      for (const msgRef of currentIface.messagesInRefs) {
        const msg = this.findInternalMessage(msgRef);
        if (msg) {
          result += `  ${this.generateMessageSenderWithStoredAddress(msg)}\n`;
        }
      }
    }
    
    // Add test methods for each get-method in all interfaces
    for (const currentIface of interfacesToImplement) {
      for (const methodRef of currentIface.getMethodsRefs) {
        const method = this.findGetMethod(methodRef);
        if (method) {
          result += this.generateTestMethodWithStoredAddress(method);
        }
      }
      
      // Add test methods for message sending methods
      for (const msgRef of currentIface.messagesInRefs) {
        const msg = this.findInternalMessage(msgRef);
        if (msg) {
          result += this.generateTestMethodForInternalMessage(msg);
        }
      }
    }
    
    result += `}\n`;
    
    return result;
  }

  /**
   * Collect all interfaces that are inherited by the given interface
   * Returns an array that includes the interface itself and all parent interfaces
   */
  private collectInheritedInterfaces(iface: AbiInterface): AbiInterface[] {
    const result: AbiInterface[] = [iface];
    
    // Recursively add parent interfaces
    if (iface.inherits) {
      const parentIface = this.findInterface(iface.inherits);
      if (parentIface) {
        result.push(...this.collectInheritedInterfaces(parentIface));
      } else {
        console.warn(`Warning: Parent interface ${iface.inherits} for ${iface.name} not found in ABI definition`);
      }
    }
    
    return result;
  }

  /**
   * Generate class method that uses address from class property
   */
  private generateClassMethodWithStoredAddress(method: AbiGetMethod, interfaceName: string): string {
    const methodName = method.name;
    
    // Generate method parameters without the address parameter
    const methodParams = method.inputs.length > 0 
      ? method.inputs.map(p => `${p.name}: ${p.getTsType()}`).join(', ') 
      : '';
    
    // Define return type for method
    let returnType = 'any';
    if (method.outputs.length === 1) {
      const output = method.outputs[0];
      if (output.type === 'msgaddress') {
        returnType = 'Address | null';
      } else {
        returnType = output.getTsType();
      }
    } else if (method.outputs.length > 1) {
      returnType = '{' + method.outputs.map(o => {
        if (o.type === 'msgaddress') {
          return `${o.name}: Address | null`;
        } else {
          return `${o.name}: ${o.getTsType()}`;
        }
      }).join(', ') + '}';
    }
    
    let result = `async ${methodName}(${methodParams}): Promise<${returnType}> {\n`;
    
    // Wrap entire call block in try-catch to catch errors at the earliest stage
    result += `  try {\n`;
    result += `  // Call get-method via Blockchain from @ton/sandbox\n`;
    result += `  const result = await this.blockchain.runGetMethod(\n`;
    result += `    this.address,\n`;
    result += `    '${methodName}',\n`;
    
    // Method parameters
    if (method.inputs.length > 0) {
      result += `    [\n`;
      for (const input of method.inputs) {
        // Use method from AbiGetMethod class
        const tsType = input.getTsType();
        switch (tsType) {
          case 'boolean':
            result += `      { type: 'boolean', value: ${input.name} }, // boolean\n`;
            break;
          case 'bigint':
            result += `      { type: 'int', value: ${input.name} }, // bigint\n`;
            break;
          case 'string':
            if (input.type === 'msgaddress') {
              result += `      { type: 'address', value: ${input.name} }, // address string\n`;
            } else {
              result += `      { type: 'text', value: ${input.name} }, // string\n`;
            }
            break;
          default:
            if (input.type && input.type.includes('Cell')) {
              result += `      { type: 'cell', value: ${input.name} }, // cell\n`;
            } else {
              // Fallback for other types
              result += `      // Convert parameter ${input.name} to appropriate TupleItem based on type '${input.type}'\n`;
              result += `      { type: 'any', value: ${input.name} },\n`;
            }
        }
      }
      result += `    ] as TupleItem[]\n`;
    } else {
      result += `    [] as TupleItem[]\n`;
    }
    
    result += `  );\n\n`;
    
    // Use TupleReader to process result, as in Tact
    result += `  // Use TupleReader to process the result, as in Tact\n`;
    result += `  const reader = new TupleReader(result.stack);\n`;
    
    // Process results using TupleReader
    if (method.outputs.length === 0) {
      result += `  // Method doesn't return any values\n`;
      result += `  return undefined as any;\n`;
    } else if (method.outputs.length === 1) {
      const output = method.outputs[0];
      
      // Special handling for addresses
      if (output.type === 'msgaddress') {
        result += `  // Try to read as optional address\n`;
        result += `  const address = reader.readAddressOpt();\n`;
        result += `  console.log('${methodName.replace('get_', '')} address:', address ? address.toString() : 'null');\n`;
        result += `  return address;\n`;
      } else {
        // For other data types
        result += `  // Read value from stack\n`;
        switch (output.getTsType()) {
          case 'bigint':
            result += `  return reader.readBigNumber();\n`;
            break;
          case 'boolean':
            result += `  return reader.readBoolean();\n`;
            break;
          case 'string':
            result += `  return reader.readString();\n`;
            break;
          default:
            if (output.type && output.type.includes('Cell')) {
              result += `  return reader.readCell();\n`;
            } else {
              result += `  return reader.readCell();\n`;
            }
        }
      }
    } else {
      // For multiple output parameters (object)
      result += `  // Read multiple values from stack\n`;
      result += `  return {\n`;
      for (const output of method.outputs) {
        if (output.type === 'msgaddress') {
          result += `    ${output.name}: reader.readAddressOpt(),\n`;
        } else {
          switch (output.getTsType()) {
            case 'bigint':
              result += `    ${output.name}: reader.readBigNumber(),\n`;
              break;
            case 'boolean':
              result += `    ${output.name}: reader.readBoolean(),\n`;
              break;
            case 'string':
              result += `    ${output.name}: reader.readString(),\n`;
              break;
            default:
              if (output.type && output.type.includes('Cell')) {
                result += `    ${output.name}: reader.readCell(),\n`;
              } else {
                result += `    ${output.name}: reader.readCell(),\n`;
              }
          }
        }
      }
      result += `  };\n`;
    }
    
    // Catch block for error handling
    result += `  } catch (error) {\n`;
    result += `    // Analyze error type\n`;
    result += `    if (error && typeof error === 'object' && 'exitCode' in error) {\n`;
    result += `      const exitCode = (error as { exitCode: number }).exitCode;\n`;
    result += `      const errorMessage = (error as { message?: string }).message || '';\n`;
    result += `      \n`;
    result += `      // Enhanced error messages for different TVM codes\n`;
    result += `      switch (exitCode) {\n`;
    result += `        case 11:\n`;
    result += `          throw new Error(\`ERROR: Method '${methodName}' does not exist in contract at address \${this.address}.\\nIs it correct that this contract implements interface '${interfaceName}'?\`);\n`;
    result += `        case 4:\n`;
    result += `          throw new Error(\`ERROR: Invalid arguments for method '${methodName}'.\`);\n`;
    result += `        case 2:\n`;
    result += `          throw new Error(\`ERROR: Contract at address \${this.address} is not responding.\`);\n`;
    result += `        default:\n`;
    result += `          throw new Error(\`ERROR: Method '${methodName}' returned error code \${exitCode}. The contract might not implement the expected interface. Details: \${errorMessage}\`);\n`;
    result += `      }\n`;
    result += `    }\n`;
    result += `    \n`;
    result += `    // If error is not TVM-related, throw with enhanced information\n`;
    result += `    const errorMessage = (error as { message?: string }).message || 'Unknown error';\n`;
    result += `    throw new Error(\`Error executing method '${methodName}': \${errorMessage}\`);\n`;
    result += `  }\n`;
    
    result += `}\n`;
    
    return result;
  }

  /**
   * Generate test method for get-method
   */
  private generateTestMethodWithStoredAddress(method: AbiGetMethod): string {
    const methodName = method.name;
    
    // Generate method parameters without the address
    const methodParams = method.inputs.length > 0 
      ? method.inputs.map(p => `${p.name}: ${p.getTsType()}`).join(', ') 
      : '';
    
    let result = `  /**\n`;
    result += `   * Test method for ${methodName}\n`;
    result += `   */\n`;
    result += `  async test${this.capitalizeFirstLetter(methodName)}(${methodParams}): Promise<void> {\n`;
    
    // Call method and save result for verification
    if (method.inputs.length > 0) {
      result += `    const result = await this.${methodName}(${method.inputs.map(p => p.name).join(', ')});\n`;
    } else {
      result += `    const result = await this.${methodName}();\n`;
    }
    
    // Add return value type checks using expect
    if (method.outputs.length === 0) {
      result += `    // Method should not return a value\n`;
      result += `    expect(result).toBeUndefined();\n`;
    } else if (method.outputs.length === 1) {
      // For single output parameter
      const output = method.outputs[0];
      
      // Special handling for addresses
      if (output.type === 'msgaddress') {
        result += `    // Check return value type\n`;
        result += `    if (result !== null) {\n`;
        result += `      expect(result).toBeInstanceOf(Address);\n`;
        result += `      \n`;
        result += `      // Check address format\n`;
        result += `      const addrStr = result.toString();\n`;
        result += `      expect(addrStr.startsWith('EQ') || addrStr.startsWith('UQ')).toBeTruthy();\n`;
        result += `    }\n`;
      } else {
        const expectedType = this.getExpectedTypeForTest(output.getTsType());
        result += `    // Check return value type\n`;
        if (expectedType === 'bigint') {
          result += `    expect(typeof result).toBe('bigint');\n`;
        } else if (expectedType === 'boolean') {
          result += `    expect(typeof result).toBe('boolean');\n`;
        } else if (expectedType === 'string') {
          result += `    expect(typeof result).toBe('string');\n`;
        } else {
          result += `    // Type '${expectedType}' - check\n`;
          result += `    expect(result).not.toBeUndefined();\n`;
        }
      }
    } else {
      // For multiple output parameters (object)
      result += `    // Check return object structure\n`;
      result += `    expect(result).toBeDefined();\n`;
      result += `    expect(typeof result).toBe('object');\n`;
      result += `    expect(result).not.toBeNull();\n`;
      
      // Check each field
      for (const output of method.outputs) {
        // Special handling for addresses
        if (output.type === 'msgaddress') {
          result += `    // Check field ${output.name}\n`;
          result += `    if (result.${output.name} !== null) {\n`;
          result += `      expect(result.${output.name}).toBeInstanceOf(Address);\n`;
          result += `      \n`;
          result += `      // Check address format\n`;
          result += `      const addrStr = result.${output.name}.toString();\n`;
          result += `      expect(addrStr.startsWith('EQ') || addrStr.startsWith('UQ')).toBeTruthy();\n`;
          result += `    }\n`;
        } else {
          const expectedType = this.getExpectedTypeForTest(output.getTsType());
          result += `    // Check field ${output.name}\n`;
          
          if (expectedType === 'bigint') {
            result += `    expect(typeof result.${output.name}).toBe('bigint');\n`;
          } else if (expectedType === 'boolean') {
            result += `    expect(typeof result.${output.name}).toBe('boolean');\n`;
          } else if (expectedType === 'string') {
            result += `    expect(typeof result.${output.name}).toBe('string');\n`;
          } else {
            result += `    // Type '${expectedType}' - check field exists\n`;
            result += `    expect(result.${output.name}).toBeDefined();\n`;
          }
        }
      }
    }
    
    result += `  }\n\n`;
    
    return result;
  }

  /**
   * Generate test method for internal message send-method
   */
  private generateTestMethodForInternalMessage(msg: AbiInternalMessage): string {
    const methodName = `send${this.capitalizeFirstLetter(msg.name)}`;
    const testMethodName = `test${methodName}`;
    
    // Generate method parameters
    const methodParams = msg.params.map(p => `${p.name}: ${p.getTsType()}`).join(', ');
    
    let result = `  /**\n`;
    result += `   * Test method for ${methodName}\n`;
    result += `   */\n`;
    result += `  async ${testMethodName}(${methodParams}): Promise<void> {\n`;
    result += `    try {\n`;
    
    // Call the send method with provided parameters
    result += `      // Call the send method and check result\n`;
    if (msg.params.length > 0) {
      result += `      const result = await this.${methodName}(${msg.params.map(p => p.name).join(', ')});\n`;
    } else {
      result += `      const result = await this.${methodName}();\n`;
    }
    
    // Basic verification that the result is not undefined
    result += `      // Verify the basic structure of the result\n`;
    result += `      expect(result).toBeDefined();\n`;
    
    // Check if transactions are present
    result += `      // Check if transactions are present in the result\n`;
    result += `      expect(result.transactions).toBeDefined();\n`;
    result += `      expect(Array.isArray(result.transactions)).toBe(true);\n`;
    
    // Close try block and add catch block
    result += `    } catch (error) {\n`;
    result += `      // If test fails, provide helpful error message\n`;
    result += `      const errorMessage = (error as { message?: string }).message || 'Unknown error';\n`;
    result += `      throw new Error(\`Error testing ${methodName}: \${errorMessage}\`);\n`;
    result += `    }\n`;
    result += `  }\n\n`;
    
    return result;
  }
  
  /**
   * Get expected type for error messages
   */
  private getExpectedTypeForTest(tsType: string): string {
    switch (tsType) {
      case 'boolean':
        return 'boolean';
      case 'bigint':
        return 'bigint';
      case 'string':
        return 'string';
      case 'any':
        return 'any';
      case 'any | null':
        return 'any or null';
      default:
        return tsType;
    }
  }

  /**
   * Generate method for sending message using address from class
   */
  private generateMessageSenderWithStoredAddress(msg: AbiInternalMessage): string {
    const methodName = `send${this.capitalizeFirstLetter(msg.name)}`;
    // Parameters without from and to, as address will be from class
    const methodParams = msg.params.map(p => p.toTsParam()).join(', ');
    
    let result = `async ${methodName}(${methodParams}): Promise<SendMessageResult> {\n`;
    result += `  // Create external message\n`;
    result += `  const message = beginCell()\n`;
    result += `    .storeUint(0x${msg.opcode.replace('0x', '')}, 32) // op\n`;
    
    for (const param of msg.params) {
      // Check for complex types first
      if (param.type.startsWith('(Maybe')) {
        result += `    .storeMaybeRef(${param.name}) // ${param.name}: ${param.type}\n`;
        continue;
      }
      
      if (param.type.startsWith('(VarUInteger')) {
        // Extract size from VarUInteger if available
        const matches = param.type.match(/\(VarUInteger\s+(\d+)\)/);
        const bits = matches && matches[1] ? matches[1] : '16';
        result += `    .storeVarUint(${param.name}, ${bits}) // ${param.name}: ${param.type}\n`;
        continue;
      }
      
      if (param.type.startsWith('(Either')) {
        result += `    .storeRef(${param.name}) // ${param.name}: ${param.type}\n`;
        continue;
      }
      
      // Generate serialization code for each parameter type
      switch (param.type) {
        case 'uint64':
          result += `    .storeUint(${param.name}, 64) // ${param.name}: uint64\n`;
          break;
        case 'uint256':
          result += `    .storeUint(${param.name}, 256) // ${param.name}: uint256\n`;
          break;
        case 'uint16':
          result += `    .storeUint(${param.name}, 16) // ${param.name}: uint16\n`;
          break;
        case 'uint32':
          result += `    .storeUint(${param.name}, 32) // ${param.name}: uint32\n`;
          break;
        case 'Bool':
          result += `    .storeBool(${param.name}) // ${param.name}: Bool\n`;
          break;
        case 'MsgAddress':
          // Ensure address is passed correctly
          result += `    .storeAddress(typeof ${param.name} === 'string' ? Address.parse(${param.name}) : ${param.name}) // ${param.name}: MsgAddress\n`;
          break;
        case '^Cell':
          result += `    .storeRef(${param.name}) // ${param.name}: Cell reference\n`;
          break;
        default:
          result += `    // TODO: Implement proper serialization for ${param.name} with type ${param.type}\n`;
          result += `    .storeRef(typeof ${param.name} === 'object' && ${param.name} !== null ? ${param.name} : beginCell().endCell()) // Fallback for unknown type\n`;
      }
    }
    
    result += `    .endCell();\n\n`;
    result += `  // Send external message via blockchain\n`;
    result += `  return await this.blockchain.sendMessage(message);\n`;
    result += `}\n`;
    
    return result;
  }

  /**
   * Generate a TEPs (TON Enhancement Proposals) utility class 
   * that dynamically discovers and works with all generated wrappers
   * @param outputDir Directory where generated wrappers are located
   * @returns String containing the TEPs class code
   */
  public generateTEPsClass(outputDir: string = 'generated'): string {
    // Get all interfaces in the ABI
    const interfaces = this._interfaces.map(iface => iface.name);
    
    let result = '';
    
    // Add header
    result += `// Automatically generated TEPs (TON Enhancement Proposals) utility class\n\n`;
    result += `import { Address, TupleItem, beginCell, Cell } from '@ton/core';\n`;
    result += `import { Blockchain } from '@ton/sandbox';\n\n`;
    
    // Start class
    result += `/**\n * TEPs - TON Enhancement Proposals standards utility class\n * This class provides methods to check if contracts implement specific standards\n */\n`;
    result += `export class TEPs {\n`;
    
    // For each interface, generate a method to check if a contract implements it
    const generatedMethods = new Set<string>();
    
    for (const iface of interfaces) {
      const className = this.normalizeInterfaceName(iface);
      const methodName = `Is${className}Standard`;
      
      // Find get method names for this interface
      const ifaceObj = this.findInterface(iface);
      if (!ifaceObj) continue;
      
      // Get a list of all get methods to check
      const getMethods = ifaceObj.getMethodsRefs.map(ref => this.findGetMethod(ref))
        .filter(method => method !== undefined)
        .map(method => method!.name);
      
      // Get a list of all message methods to check
      const messageMethods = ifaceObj.messagesInRefs.map(ref => this.findInternalMessage(ref))
        .filter(message => message !== undefined)
        .map(message => message!);
      
      // Skip if no methods at all
      if (getMethods.length === 0 && messageMethods.length === 0) continue;
      
      result += `  /**\n   * Check if a contract implements the ${className} standard\n   * @param blockchain Blockchain instance to use for queries\n   * @param address Address of the contract to check\n   * @returns Promise<boolean> True if the contract implements the standard\n   */\n`;
      result += `  public static async ${methodName}(blockchain: Blockchain, address: Address): Promise<boolean> {\n`;
      result += `    try {\n`;
      result += `      // Try to dynamically import the ${className} class\n`;
      result += `      const { ${className} } = await import('./${outputDir}/${iface}');\n`;
      result += `      const instance = new ${className}(blockchain, address);\n`;
      
      // Test all get methods for this interface
      if (getMethods.length > 0) {
        result += `      \n      // Test all required get-methods for this interface\n`;
        for (const testMethod of getMethods) {
          // For methods that need parameters, provide default test values
          const method = this.findGetMethod(testMethod);
          if (method && method.inputs.length > 0) {
            result += `      await instance.test${this.capitalizeFirstLetter(testMethod)}(${this.generateDefaultTestValues(method.inputs)});\n`;
          } else {
            result += `      await instance.test${this.capitalizeFirstLetter(testMethod)}();\n`;
          }
        }
      }
      
      // Add testing for send methods
      if (messageMethods.length > 0) {
        result += `      \n      // Test all required send-methods for this interface\n`;
        result += `      try {\n`;
        for (const message of messageMethods) {
          const methodName = `send${this.capitalizeFirstLetter(message.name)}`;
          const testMethodName = `test${methodName}`;
          
          if (message.params && message.params.length > 0) {
            // For methods that need parameters, provide default test values
            result += `        // Test send method: ${methodName}\n`;
            result += `        try {\n`;
            result += `          await instance.${testMethodName}(${this.generateDefaultTestValuesForMessage(message.params)});\n`;
            result += `        } catch (sendError: any) {\n`;
            result += `          console.log(\`Note: Send method ${methodName} test failed, but this is expected during standard detection: \${sendError?.message || 'Unknown error'}\`);\n`;
            result += `          // Continue with next test - send method failures are expected during detection\n`;
            result += `        }\n`;
          } else {
            result += `        // Test send method: ${methodName}\n`;
            result += `        try {\n`;
            result += `          await instance.${testMethodName}();\n`;
            result += `        } catch (sendError: any) {\n`;
            result += `          console.log(\`Note: Send method ${methodName} test failed, but this is expected during standard detection: \${sendError?.message || 'Unknown error'}\`);\n`;
            result += `          // Continue with next test - send method failures are expected during detection\n`;
            result += `        }\n`;
          }
        }
        result += `      } catch (error) {\n`;
        result += `        // If there's an error with send methods, log but continue\n`;
        result += `        console.log('Note: Some send method tests failed but get-methods passed, standard detection continues');\n`;
        result += `      }\n`;
      }
      
      result += `      return true;\n`;
      result += `    } catch (error) {\n`;
      result += `      // If there's an error, the contract doesn't implement this standard\n`;
      result += `      return false;\n`;
      result += `    }\n`;
      result += `  }\n\n`;
      
      // Create a factory method for this interface
      result += `  /**\n   * Create ${className} wrapper if supported\n   * @param blockchain Blockchain instance to use for queries\n   * @param address Address of the contract to check\n   * @returns Promise with the ${className} wrapper or null if not supported\n   */\n`;
      result += `  public static async Create${className}(blockchain: Blockchain, address: Address) {\n`;
      result += `    try {\n`;
      result += `      // Check if the contract implements the standard\n`;
      result += `      const isSupported = await this.${methodName}(blockchain, address);\n`;
      result += `      if (!isSupported) return null;\n`;
      result += `      \n`;
      result += `      // Create and return the wrapper\n`;
      result += `      const { ${className} } = await import('./${outputDir}/${iface}');\n`;
      result += `      return new ${className}(blockchain, address);\n`;
      result += `    } catch (error) {\n`;
      result += `      return null;\n`;
      result += `    }\n`;
      result += `  }\n\n`;
      
      // Record that we've generated methods for this interface
      generatedMethods.add(className);
    }
    
    // Special handling for NftItemSimple which might not have its own get methods but inherits from NftItem
    if (!generatedMethods.has('NftItemSimple') && interfaces.includes('nft_item_simple')) {
      result += `  /**\n   * Check if a contract implements the NftItemSimple standard\n   * @param blockchain Blockchain instance to use for queries\n   * @param address Address of the contract to check\n   * @returns Promise<boolean> True if the contract implements the standard\n   */\n`;
      result += `  public static async IsNftItemSimpleStandard(blockchain: Blockchain, address: Address): Promise<boolean> {\n`;
      result += `    try {\n`;
      result += `      // Try to dynamically import the NftItemSimple class\n`;
      result += `      const { NftItemSimple } = await import('./${outputDir}/nft_item_simple');\n`;
      result += `      const instance = new NftItemSimple(blockchain, address);\n`;
      result += `      \n`;
      result += `      // Test all required methods for this interface\n`;
      result += `      await instance.testGet_nft_data();\n`;
      result += `      return true;\n`;
      result += `    } catch (error) {\n`;
      result += `      // If there's an error, the contract doesn't implement this standard\n`;
      result += `      return false;\n`;
      result += `    }\n`;
      result += `  }\n\n`;
      
      result += `  /**\n   * Create NftItemSimple wrapper if supported\n   * @param blockchain Blockchain instance to use for queries\n   * @param address Address of the contract to check\n   * @returns Promise with the NftItemSimple wrapper or null if not supported\n   */\n`;
      result += `  public static async CreateNftItemSimple(blockchain: Blockchain, address: Address) {\n`;
      result += `    try {\n`;
      result += `      // Check if the contract implements the standard\n`;
      result += `      const isSupported = await this.IsNftItemSimpleStandard(blockchain, address);\n`;
      result += `      if (!isSupported) return null;\n`;
      result += `      \n`;
      result += `      // Create and return the wrapper\n`;
      result += `      const { NftItemSimple } = await import('./${outputDir}/nft_item_simple');\n`;
      result += `      return new NftItemSimple(blockchain, address);\n`;
      result += `    } catch (error) {\n`;
      result += `      return null;\n`;
      result += `    }\n`;
      result += `  }\n\n`;
      
      // Record that we've generated methods for this interface
      generatedMethods.add('NftItemSimple');
    }
    
    // Create from address - automatically detect and create the right wrapper
    result += `  /**\n   * Create an instance of a standard object if supported\n   * @param blockchain Blockchain instance to use for queries\n   * @param address Address of the contract to check\n   * @returns Promise with the appropriate standard instance, or null if not supported\n   */\n`;
    result += `  public static async createFromAddress(blockchain: Blockchain, address: Address) {\n`;
    
    // Build a dependency graph and order interfaces to respect inheritance
    // First, create a map of interface to its dependencies (interfaces it inherits from)
    const dependencyMap = new Map<string, string[]>();
    
    for (const iface of interfaces) {
      const ifaceObj = this.findInterface(iface);
      if (!ifaceObj) continue;
      
      // If this interface inherits from another, add it as a dependency
      const dependencies: string[] = [];
      if (ifaceObj.inherits) {
        dependencies.push(ifaceObj.inherits);
      }
      
      dependencyMap.set(iface, dependencies);
    }
    
    // Topological sort to order interfaces by dependencies
    const visited = new Set<string>();
    const tempVisited = new Set<string>();
    const orderedInterfaces: string[] = [];
    
    // DFS traversal function for topological sort
    const visit = (iface: string) => {
      if (tempVisited.has(iface)) {
        // Cyclic dependency found, but we'll ignore it and continue
        return;
      }
      
      if (visited.has(iface)) {
        return;
      }
      
      tempVisited.add(iface);
      
      const dependencies = dependencyMap.get(iface) || [];
      for (const dependency of dependencies) {
        visit(dependency);
      }
      
      tempVisited.delete(iface);
      visited.add(iface);
      orderedInterfaces.push(iface);
    };
    
    // Visit all interfaces to build the ordered list
    for (const iface of interfaces) {
      if (!visited.has(iface)) {
        visit(iface);
      }
    }
    
    // Reverse the order to get items with most dependencies first
    // Most specific interfaces (like SBT) should be checked before their parents (like NFT Item)
    orderedInterfaces.reverse();
    
    // Now check each interface in the topologically sorted order
    result += `    // Try to identify the standard and create the appropriate instance\n`;
    for (const iface of orderedInterfaces) {
      const className = this.normalizeInterfaceName(iface);
      
      // Skip interfaces we don't have methods for
      if (!generatedMethods.has(className)) continue;
      
      result += `    // Check if it's a ${className}\n`;
      
      // Use safe variable name for the instance (original interface name)
      const instanceVarName = iface.replace(/-/g, '_');
      result += `    const ${instanceVarName}Instance = await this.Create${className}(blockchain, address);\n`;
      result += `    if (${instanceVarName}Instance) return ${instanceVarName}Instance;\n`;
      result += `    \n`;
    }
    
    result += `    // No matching standard found\n`;
    result += `    return null;\n`;
    result += `  }\n`;
    
    // Close class
    result += `}\n`;
    
    return result;
  }

  /**
   * Generate default test values for method parameters
   */
  private generateDefaultTestValues(params: MethodParameter[]): string {
    const values: string[] = [];
    
    for (const param of params) {
      switch (param.getTsType()) {
        case 'bigint':
          values.push('0n');
          break;
        case 'boolean':
          values.push('false');
          break;
        case 'string':
          values.push('""');
          break;
        case 'Address | null':
          values.push('null');
          break;
        case 'Cell':
          values.push('beginCell().endCell()');
          break;
        case 'any':
          values.push('null');
          break;
        default:
          if (param.type && param.type.includes('Cell')) {
            values.push('beginCell().endCell()');
          } else {
            values.push('null');
          }
      }
    }
    
    return values.join(', ');
  }

  /**
   * Generate default test values for message parameters
   */
  private generateDefaultTestValuesForMessage(params: MessageParameter[]): string {
    const values: string[] = [];
    
    for (const param of params) {
      switch (param.getTsType()) {
        case 'bigint':
          values.push('0n');
          break;
        case 'boolean':
          values.push('false');
          break;
        case 'string':
          values.push('""');
          break;
        case 'Address':
          values.push('Address.parse("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")'); // Use a zero address
          break;
        case 'Cell':
          values.push('beginCell().endCell()');
          break;
        case 'Cell | null':
          values.push('null');
          break;
        case 'any':
          values.push('null');
          break;
        default:
          if (param.type && param.type.includes('Cell')) {
            values.push('beginCell().endCell()');
          } else {
            values.push('null');
          }
      }
    }
    
    return values.join(', ');
  }
}