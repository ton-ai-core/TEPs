"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TonAbi = exports.AbiInternalMessage = exports.AbiGetMethod = exports.AbiInterface = exports.MessageParameter = exports.MethodParameter = exports.AbiEntity = exports.createTonAbiFromJson = exports.createTonAbiFromObject = void 0;
/**
 * Creates a TonAbi instance from ABI object
 * @param abiObject ABI object
 */
function createTonAbiFromObject(abiObject) {
    return new TonAbi(abiObject);
}
exports.createTonAbiFromObject = createTonAbiFromObject;
/**
 * Creates a TonAbi instance from JSON string
 * @param jsonString JSON string with ABI
 */
function createTonAbiFromJson(jsonString) {
    try {
        const abiObject = JSON.parse(jsonString);
        return createTonAbiFromObject(abiObject);
    }
    catch (error) {
        console.error('Error parsing ABI JSON string:', error);
        throw error;
    }
}
exports.createTonAbiFromJson = createTonAbiFromJson;
/**
 * Base class for all ABI entities
 */
class AbiEntity {
    constructor(data) {
        this._data = data;
    }
    get rawData() {
        return this._data;
    }
}
exports.AbiEntity = AbiEntity;
/**
 * Class for method parameters
 */
class MethodParameter {
    constructor(category, name, type) {
        this._category = category;
        this._name = name;
        this._type = type;
    }
    get category() {
        return this._category;
    }
    get name() {
        return this._name;
    }
    get type() {
        return this._type;
    }
    /**
     * Get TypeScript type for this parameter
     */
    getTsType() {
        if (!this._type)
            return 'any';
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
                if (this._type.includes('Maybe'))
                    return 'any | null';
                if (this._type.includes('Either'))
                    return 'any';
                if (this._type.includes('Cell'))
                    return 'Cell'; // Assuming Cell type exists
                return 'any';
        }
    }
    /**
     * Get TypeScript parameter string for function signature
     */
    toTsParam() {
        return `${this._name}: ${this.getTsType()}`;
    }
}
exports.MethodParameter = MethodParameter;
/**
 * Class for internal message parameters
 */
class MessageParameter {
    constructor(name, type) {
        this._name = name;
        this._type = type;
    }
    get name() {
        return this._name;
    }
    get type() {
        return this._type;
    }
    /**
     * Get TypeScript type for this parameter
     */
    getTsType() {
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
        if (this._type.startsWith('(Maybe'))
            return 'Cell | null';
        if (this._type.startsWith('(Either'))
            return 'Cell';
        if (this._type.startsWith('(VarUInteger'))
            return 'bigint';
        if (this._type.includes('Cell'))
            return 'Cell';
        // Default fallback
        return 'any';
    }
    /**
     * Get TypeScript parameter string for function signature
     */
    toTsParam() {
        return `${this._name}: ${this.getTsType()}`;
    }
}
exports.MessageParameter = MessageParameter;
/**
 * Class for working with ABI interfaces
 */
class AbiInterface extends AbiEntity {
    constructor(data) {
        super(data);
    }
    get name() {
        return this._data.name;
    }
    get inherits() {
        return this._data.inherits;
    }
    get codeHash() {
        return this._data.code_hash;
    }
    get getMethodsRefs() {
        return this._data.get_methods_ref;
    }
    get messagesInRefs() {
        return this._data.messages_in_ref;
    }
    get messagesOutRefs() {
        return this._data.messages_out_ref;
    }
    /**
     * Get TypeScript interface string
     */
    toTsInterface(abi) {
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
            }
            else {
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
            }
            else {
                // Log warning about missing message
                console.warn(`Warning: Message ${msgRef} referenced in interface ${this.name} was not found in ABI definition`);
            }
        }
        result += `}\n`;
        return result;
    }
    normalizeInterfaceName(name) {
        return name.split('_').map(this.capitalize).join('');
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    getReturnType(method) {
        if (method.outputs.length === 0) {
            return 'void';
        }
        else if (method.outputs.length === 1) {
            return method.outputs[0].getTsType();
        }
        else {
            return `{${method.outputs.map(p => `${p.name}: ${p.getTsType()}`).join(', ')}}`;
        }
    }
}
exports.AbiInterface = AbiInterface;
/**
 * Class for working with ABI get-methods
 */
class AbiGetMethod extends AbiEntity {
    constructor(data) {
        super(data);
        this._inputs = [];
        this._outputs = [];
        // Parse input parameters
        if (data.inputs) {
            for (const input of data.inputs) {
                this._inputs.push(new MethodParameter(input.param_category, input.name, input.type));
            }
        }
        // Parse output parameters
        if (data.outputs) {
            for (const output of data.outputs) {
                this._outputs.push(new MethodParameter(output.param_category, output.name, output.type));
            }
        }
    }
    get name() {
        return this._data.name;
    }
    get inputs() {
        return this._inputs;
    }
    get outputs() {
        return this._outputs;
    }
    /**
     * Generates TypeScript code for calling get-method using @ton/sandbox
     */
    generateTsMethodCall() {
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
        }
        else {
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
                        }
                        else {
                            result += `  return reader.readRemainingTuple();\n`;
                        }
                }
            }
            else {
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
                            }
                            else {
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
    generateTupleItemConversion(param) {
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
                }
                else {
                    // Fallback for other types
                    result = `      // Convert parameter ${param.name} to appropriate TupleItem based on type '${param.type}'\n`;
                    result = `      { type: 'any', value: ${param.name} },\n`;
                }
        }
        return result;
    }
}
exports.AbiGetMethod = AbiGetMethod;
/**
 * Class for working with ABI internal messages
 */
class AbiInternalMessage extends AbiEntity {
    constructor(data) {
        super(data);
        this._params = [];
        // Parse message parameters
        if (data.params) {
            for (const param of data.params) {
                // Use the full parameter type without modification
                this._params.push(new MessageParameter(param.name, param.type));
            }
        }
    }
    get name() {
        return this._data.xml_name;
    }
    get definitionName() {
        return this._data.definition_name || '';
    }
    get opcode() {
        return this._data.opcode || '';
    }
    get params() {
        return this._params;
    }
    get returnType() {
        return this._data.return_type || '';
    }
    /**
     * Generates TypeScript code for creating and sending internal message
     */
    generateTsMessageSender() {
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
    getStoreCodeForParam(param) {
        // Check for complex types first
        if (param.type.startsWith('(Maybe')) {
            return `    .storeRef(${param.name} || null) // ${param.name}: ${param.type}\n`;
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
    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
exports.AbiInternalMessage = AbiInternalMessage;
/**
 * Main class for working with ABI data
 */
class TonAbi {
    constructor(abiData) {
        this._interfaces = [];
        this._getMethods = [];
        this._internalMessages = [];
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
    get interfaces() {
        return this._interfaces;
    }
    get getMethods() {
        return this._getMethods;
    }
    get internalMessages() {
        return this._internalMessages;
    }
    /**
     * Find interface by name
     */
    findInterface(name) {
        return this._interfaces.find(i => i.name === name);
    }
    /**
     * Find get-method by name
     */
    findGetMethod(name) {
        return this._getMethods.find(m => m.name === name);
    }
    /**
     * Find internal message by name
     */
    findInternalMessage(name) {
        return this._internalMessages.find(m => m.name === name);
    }
    /**
     * Normalize interface name
     */
    normalizeInterfaceName(name) {
        return name.split('_').map(this.capitalize).join('');
    }
    /**
     * Capitalize first letter of string
     */
    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
     * Capitalize first letter of each word
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
     * Generate TypeScript code for all interfaces
     */
    generateAllInterfaces() {
        let result = '';
        // Add imports
        result += `// Automatically generated TypeScript interfaces for TON ABI\n\n`;
        result += `// Required imports\n`;
        result += `import { Address, TupleItem, beginCell, TupleReader } from '@ton/core';\n`;
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
    generateClassForInterface(interfaceName) {
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
        }
        result += `}\n`;
        return result;
    }
    /**
     * Collect all interfaces that are inherited by the given interface
     * Returns an array that includes the interface itself and all parent interfaces
     */
    collectInheritedInterfaces(iface) {
        const result = [iface];
        // Recursively add parent interfaces
        if (iface.inherits) {
            const parentIface = this.findInterface(iface.inherits);
            if (parentIface) {
                result.push(...this.collectInheritedInterfaces(parentIface));
            }
            else {
                console.warn(`Warning: Parent interface ${iface.inherits} for ${iface.name} not found in ABI definition`);
            }
        }
        return result;
    }
    /**
     * Generate class method that uses address from class property
     */
    generateClassMethodWithStoredAddress(method, interfaceName) {
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
            }
            else {
                returnType = output.getTsType();
            }
        }
        else if (method.outputs.length > 1) {
            returnType = '{' + method.outputs.map(o => {
                if (o.type === 'msgaddress') {
                    return `${o.name}: Address | null`;
                }
                else {
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
                        }
                        else {
                            result += `      { type: 'text', value: ${input.name} }, // string\n`;
                        }
                        break;
                    default:
                        if (input.type && input.type.includes('Cell')) {
                            result += `      { type: 'cell', value: ${input.name} }, // cell\n`;
                        }
                        else {
                            // Fallback for other types
                            result += `      // Convert parameter ${input.name} to appropriate TupleItem based on type '${input.type}'\n`;
                            result += `      { type: 'any', value: ${input.name} },\n`;
                        }
                }
            }
            result += `    ] as TupleItem[]\n`;
        }
        else {
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
        }
        else if (method.outputs.length === 1) {
            const output = method.outputs[0];
            // Special handling for addresses
            if (output.type === 'msgaddress') {
                result += `  // Try to read as optional address\n`;
                result += `  const address = reader.readAddressOpt();\n`;
                result += `  console.log('${methodName.replace('get_', '')} address:', address ? address.toString() : 'null');\n`;
                result += `  return address;\n`;
            }
            else {
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
                        }
                        else {
                            result += `  return reader.readCell();\n`;
                        }
                }
            }
        }
        else {
            // For multiple output parameters (object)
            result += `  // Read multiple values from stack\n`;
            result += `  return {\n`;
            for (const output of method.outputs) {
                if (output.type === 'msgaddress') {
                    result += `    ${output.name}: reader.readAddressOpt(),\n`;
                }
                else {
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
                            }
                            else {
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
    generateTestMethodWithStoredAddress(method) {
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
        }
        else {
            result += `    const result = await this.${methodName}();\n`;
        }
        // Add return value type checks using expect
        if (method.outputs.length === 0) {
            result += `    // Method should not return a value\n`;
            result += `    expect(result).toBeUndefined();\n`;
        }
        else if (method.outputs.length === 1) {
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
            }
            else {
                const expectedType = this.getExpectedTypeForTest(output.getTsType());
                result += `    // Check return value type\n`;
                if (expectedType === 'bigint') {
                    result += `    expect(typeof result).toBe('bigint');\n`;
                }
                else if (expectedType === 'boolean') {
                    result += `    expect(typeof result).toBe('boolean');\n`;
                }
                else if (expectedType === 'string') {
                    result += `    expect(typeof result).toBe('string');\n`;
                }
                else {
                    result += `    // Type '${expectedType}' - check\n`;
                    result += `    expect(result).not.toBeUndefined();\n`;
                }
            }
        }
        else {
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
                }
                else {
                    const expectedType = this.getExpectedTypeForTest(output.getTsType());
                    result += `    // Check field ${output.name}\n`;
                    if (expectedType === 'bigint') {
                        result += `    expect(typeof result.${output.name}).toBe('bigint');\n`;
                    }
                    else if (expectedType === 'boolean') {
                        result += `    expect(typeof result.${output.name}).toBe('boolean');\n`;
                    }
                    else if (expectedType === 'string') {
                        result += `    expect(typeof result.${output.name}).toBe('string');\n`;
                    }
                    else {
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
     * Get expected type for error messages
     */
    getExpectedTypeForTest(tsType) {
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
    generateMessageSenderWithStoredAddress(msg) {
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
                result += `    .storeRef(${param.name} || null) // ${param.name}: ${param.type}\n`;
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
}
exports.TonAbi = TonAbi;
