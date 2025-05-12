import { ParsedAbi, Interface, GetMethod, InternalMessage } from './abi_parser';
import { 
  Address, 
  TupleItem, 
  TupleReader, 
  beginCell, 
  Cell, 
  Builder,
  Slice,
  Dictionary,
  DictionaryValue,
  TupleBuilder
} from '@ton/core';
import { Blockchain } from '@ton/sandbox';
import { TEPs } from './TEPs';

/**
 * Generates code for TypeScript interfaces of data types
 */
export function generateTypeInterfaces(abi: ParsedAbi): string {
  let output = '';
  const types = new Map<string, string>();
  
  // First collect all types from messages
  for (const msg of abi.internal_messages) {
    if (!msg.definition_name) continue;
    
    const typeName = msg.definition_name;
    let typeCode = `export type ${typeName} = {\n`;
    typeCode += `  $$type: '${typeName}';\n`;
    
    if (msg.params) {
      for (const param of msg.params) {
        const tsType = mapToTsType(param.type);
        typeCode += `  ${param.name}: ${tsType};\n`;
      }
    }
    
    typeCode += `}\n\n`;
    types.set(typeName, typeCode);
  }
  
  // Add imports
  output += `import {\n`;
  output += `  Cell,\n`;
  output += `  Slice,\n`;
  output += `  Address,\n`;
  output += `  Builder,\n`;
  output += `  beginCell,\n`;
  output += `  ComputeError,\n`;
  output += `  TupleItem,\n`;
  output += `  TupleReader,\n`;
  output += `  Dictionary,\n`;
  output += `  DictionaryValue,\n`;
  output += `  TupleBuilder\n`;
  output += `} from '@ton/core';\n\n`;
  
  // Add types
  for (const typeCode of types.values()) {
    output += typeCode;
  }
  
  return output;
}

/**
 * Generates code for type serialization functions
 */
export function generateTypeSerializers(abi: ParsedAbi): string {
  let output = '';
  
  for (const msg of abi.internal_messages) {
    if (!msg.definition_name) continue;
    
    const typeName = msg.definition_name;
    
    // Store function for the type
    output += `export function store${typeName}(src: ${typeName}) {\n`;
    output += `  return (builder: Builder) => {\n`;
    output += `    const b_0 = builder;\n`;
    
    // If there's an opcode, store it
    if (msg.opcode) {
      output += `    b_0.storeUint(${msg.opcode.replace('0x', '')}, 32);\n`;
    }
    
    // Serialize each parameter
    if (msg.params) {
      for (const param of msg.params) {
        output += generateStoreCode(param);
      }
    }
    
    output += `  };\n`;
    output += `}\n\n`;
    
    // Load function for the type
    output += `export function load${typeName}(slice: Slice) {\n`;
    output += `  const sc_0 = slice;\n`;
    
    // If there's an opcode, check it
    if (msg.opcode) {
      output += `  if (sc_0.loadUint(32) !== ${msg.opcode.replace('0x', '')}) { throw Error('Invalid prefix'); }\n`;
    }
    
    // Deserialize each parameter
    if (msg.params) {
      for (const param of msg.params) {
        output += generateLoadCode(param);
      }
    }
    
    // Return the object
    output += `  return { $$type: '${typeName}' as const`;
    if (msg.params) {
      for (const param of msg.params) {
        output += `, ${param.name}: _${param.name}`;
      }
    }
    output += ` };\n`;
    output += `}\n\n`;
    
    // loadTuple function for the type
    output += `export function loadTuple${typeName}(source: TupleReader) {\n`;
    if (msg.params) {
      for (const param of msg.params) {
        output += generateTupleReadCode(param);
      }
    }
    
    // Return the object
    output += `  return { $$type: '${typeName}' as const`;
    if (msg.params) {
      for (const param of msg.params) {
        output += `, ${param.name}: _${param.name}`;
      }
    }
    output += ` };\n`;
    output += `}\n\n`;
    
    // loadGetterTuple function for the type (used in getters)
    output += `export function loadGetterTuple${typeName}(source: TupleReader) {\n`;
    if (msg.params) {
      for (const param of msg.params) {
        output += generateTupleReadCode(param);
      }
    }
    
    // Return the object
    output += `  return { $$type: '${typeName}' as const`;
    if (msg.params) {
      for (const param of msg.params) {
        output += `, ${param.name}: _${param.name}`;
      }
    }
    output += ` };\n`;
    output += `}\n\n`;
    
    // storeTuple function for the type
    output += `export function storeTuple${typeName}(source: ${typeName}) {\n`;
    output += `  const builder = new TupleBuilder();\n`;
    if (msg.params) {
      for (const param of msg.params) {
        output += generateTupleWriteCode(param);
      }
    }
    output += `  return builder.build();\n`;
    output += `}\n\n`;
    
    // DictionaryValue parser
    output += `export function dictValueParser${typeName}(): DictionaryValue<${typeName}> {\n`;
    output += `  return {\n`;
    output += `    serialize: (src, builder) => {\n`;
    output += `      builder.storeRef(beginCell().store(store${typeName}(src)).endCell());\n`;
    output += `    },\n`;
    output += `    parse: (src) => {\n`;
    output += `      return load${typeName}(src.loadRef().beginParse());\n`;
    output += `    }\n`;
    output += `  }\n`;
    output += `}\n\n`;
  }
  
  return output;
}

/**
 * Generates code for contract class
 */
export function generateContractClass(abi: ParsedAbi, contractName: string): string {
  let output = '';
  
  // List of get-methods
  const getters = abi.get_methods.map(method => ({
    name: method.name,
    inputs: method.inputs.filter(input => input.param_category === 'int' || input.param_category === 'cell'),
    outputs: method.outputs.filter(output => output.param_category === 'int' || output.param_category === 'cell')
  }));
  
  // List of messages that the contract receives
  const receivers = abi.internal_messages.filter(msg => msg.definition_name);
  
  // Generate code for get-methods
  output += `export const ${contractName}_getters = [\n`;
  for (const getter of getters) {
    output += `  {"name":"${getter.name}","methodId":${Math.floor(Math.random() * 100000)},"arguments":[],"returnType":{"kind":"simple","type":"${getter.name}Result","optional":false}},\n`;
  }
  output += `]\n\n`;
  
  // Mapping get-method names to function names in the class
  output += `export const ${contractName}_getterMapping: { [key: string]: string } = {\n`;
  for (const getter of getters) {
    output += `  '${getter.name}': 'get${capitalize(getter.name)}',\n`;
  }
  output += `}\n\n`;
  
  // Start the class
  output += `export class ${contractName} {\n`;
  output += `  readonly address: Address;\n`;
  output += `  readonly blockchain: any; // Blockchain from @ton/sandbox or compatible\n\n`;
  
  // Constructor
  output += `  constructor(blockchain: any, address: Address) {\n`;
  output += `    this.blockchain = blockchain;\n`;
  output += `    this.address = address;\n`;
  output += `  }\n\n`;
  
  // Generate code for get-methods
  for (const getter of getters) {
    // Define the return type
    const isAddress = getter.outputs && 
                      getter.outputs.length > 0 && 
                      getter.outputs[0].param_category === 'cell' && 
                      getter.outputs[0].type && 
                      (getter.outputs[0].type.includes('address') || getter.outputs[0].type.includes('address?'));
    
    // Determine the return type
    let returnType = 'any';
    if (isAddress) {
      returnType = 'Address | null';
    } else if (getter.outputs && getter.outputs.length === 1) {
      if (getter.outputs[0].param_category === 'int') {
        returnType = 'bigint';
      } else if (getter.outputs[0].param_category === 'cell') {
        returnType = 'Cell';
      } else {
        returnType = 'any';
      }
    } else if (getter.outputs && getter.outputs.length > 1) {
      returnType = '{' + getter.outputs.map(o => {
        if (o.param_category === 'int') {
          return `${o.name}: bigint`;
        } else if (o.param_category === 'cell' && o.type && (o.type.includes('address') || o.type.includes('address?'))) {
          return `${o.name}: Address | null`;
        } else if (o.param_category === 'cell') {
          return `${o.name}: Cell`;
        } else {
          return `${o.name}: any`;
        }
      }).join(', ') + '}';
    }
    
    // Method get_ for data retrieval
    output += `  async get${capitalize(getter.name)}(): Promise<${returnType}> {\n`;
    output += `    const result = await this.blockchain.getMethod(this.address, "${getter.name}");\n`;
    
    // Always use TupleReader to process the result
    output += `    // Use TupleReader to process the result, like in Tact\n`;
    output += `    const reader = new TupleReader(result);\n`;
    
    // Process the output
    if (isAddress) {
      output += `      // Check the return value type\n`;
      output += `      const item = reader.readAddress();\n`;
      output += `      if (typeof item !== 'object') {\n`;
      output += `        throw new Error(\`Invalid result type: expected Address, got \${typeof result}\`);\n`;
      output += `      }\n`;
      output += `      // If an address is received, check it\n`;
      output += `      return item;\n`;
    } else if (getter.outputs && getter.outputs.length === 1) {
      // For other types, just check that the result exists
      output += `      // Check that the result exists\n`;
      const outParam = getter.outputs[0];
      if (outParam.param_category === 'int') {
        output += `      return reader.readBigNumber();\n`;
      } else if (outParam.param_category === 'cell') {
        output += `      return reader.readCell();\n`;
      } else {
        output += `      return reader.readAny();\n`;
      }
    } else if (getter.outputs && getter.outputs.length > 1) {
      // For multiple outputs, return an object
      output += `      return {\n`;
      for (const outParam of getter.outputs) {
        if (outParam.param_category === 'int') {
          output += `        ${outParam.name}: reader.readBigNumber(),\n`;
        } else if (outParam.param_category === 'cell' && outParam.type && (outParam.type.includes('address') || outParam.type.includes('address?'))) {
          output += `        ${outParam.name}: reader.readAddress(),\n`;
        } else if (outParam.param_category === 'cell') {
          output += `        ${outParam.name}: reader.readCell(),\n`;
        } else {
          output += `        ${outParam.name}: reader.readAny(),\n`;
        }
      }
      output += `      };\n`;
    } else {
      output += `      return result;\n`;
    }
    
    output += `  }\n\n`;
    
    // Test method for this get method
    output += `  async test${capitalize(getter.name)}(): Promise<${returnType}> {\n`;
    output += `    try {\n`;
    output += `      return await this.get${capitalize(getter.name)}();\n`;
    output += `    } catch (error) {\n`;
    output += `      return null as any;\n`;
    output += `    }\n`;
    output += `  }\n\n`;
  }
  
  // Close the class
  output += `}\n`;
  
  return output;
}

// Helper functions
/**
 * Map TON type to TypeScript type
 */
function mapToTsType(tonType: string): string {
  if (!tonType) return 'any';
  
  // Remove comments in parentheses or square brackets
  const cleanType = tonType.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  
  if (cleanType.includes('int') || cleanType.includes('uint')) {
    return 'bigint';
  } else if (cleanType.includes('bool')) {
    return 'boolean';
  } else if (cleanType.includes('address') || cleanType.includes('MsgAddress')) {
    return 'Address';
  } else if (cleanType.includes('cell')) {
    return 'Cell';
  } else if (cleanType.includes('slice')) {
    return 'Slice';
  } else if (cleanType.includes('builder')) {
    return 'Builder';
  } else if (cleanType.includes('string') || cleanType.includes('text')) {
    return 'string';
  } else {
    return 'any';
  }
}

/**
 * Generate code to store a parameter
 */
function generateStoreCode(param: { name: string, type: string }): string {
  const tsType = mapToTsType(param.type);
  
  if (tsType === 'bigint') {
    return `    b_0.storeInt(src.${param.name}, 257);\n`;
  } else if (tsType === 'boolean') {
    return `    b_0.storeBit(src.${param.name});\n`;
  } else if (tsType === 'Address') {
    return `    b_0.storeAddress(src.${param.name});\n`;
  } else if (tsType === 'Cell') {
    return `    b_0.storeRef(src.${param.name});\n`;
  } else {
    return `    b_0.storeAny(src.${param.name});\n`;
  }
}

/**
 * Generate code to load a parameter
 */
function generateLoadCode(param: { name: string, type: string }): string {
  const tsType = mapToTsType(param.type);
  
  if (tsType === 'bigint') {
    return `  const _${param.name} = sc_0.loadIntBig(257);\n`;
  } else if (tsType === 'boolean') {
    return `  const _${param.name} = sc_0.loadBit();\n`;
  } else if (tsType === 'Address') {
    return `  const _${param.name} = sc_0.loadAddress();\n`;
  } else if (tsType === 'Cell') {
    return `  const _${param.name} = sc_0.loadRef();\n`;
  } else {
    return `  const _${param.name} = sc_0.loadAny();\n`;
  }
}

/**
 * Generate code to read a parameter from a tuple
 */
function generateTupleReadCode(param: { name: string, type: string }): string {
  const tsType = mapToTsType(param.type);
  
  if (tsType === 'bigint') {
    return `  const _${param.name} = source.readBigNumber();\n`;
  } else if (tsType === 'boolean') {
    return `  const _${param.name} = source.readBoolean();\n`;
  } else if (tsType === 'Address') {
    return `  const _${param.name} = source.readAddress();\n`;
  } else if (tsType === 'Cell') {
    return `  const _${param.name} = source.readCell();\n`;
  } else if (tsType === 'Slice') {
    return `  const _${param.name} = source.readCell().beginParse();\n`;
  } else {
    return `  const _${param.name} = source.readAny();\n`;
  }
}

/**
 * Generate code to write a parameter to a tuple
 */
function generateTupleWriteCode(param: { name: string, type: string }): string {
  const tsType = mapToTsType(param.type);
  
  if (tsType === 'bigint') {
    return `  builder.writeNumber(source.${param.name});\n`;
  } else if (tsType === 'boolean') {
    return `  builder.writeBoolean(source.${param.name});\n`;
  } else if (tsType === 'Address') {
    return `  builder.writeAddress(source.${param.name});\n`;
  } else if (tsType === 'Cell') {
    return `  builder.writeCell(source.${param.name});\n`;
  } else if (tsType === 'Slice') {
    return `  builder.writeSlice(source.${param.name});\n`;
  } else {
    return `  builder.writeAny(source.${param.name});\n`;
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Example of using the TEPs class without a provider
 */
export async function exampleUsingTEPs() {
  // Create a blockchain instance
  const blockchain = await Blockchain.create();
  
  // Example address - replace with an actual address
  const address = Address.parse('EQBInPs62kcCSGDwnCTx0FLzgNpu_t6sTca-mOXInYPBISzT');
  
  // Check what standards are implemented
  const isNft = await TEPs.IsNftItemStandard(blockchain, address);
  const isCollection = await TEPs.IsNftCollectionStandard(blockchain, address);
  const isSbt = await TEPs.IsSbtStandard(blockchain, address);
  
  console.log(`Is NFT: ${isNft}`);
  console.log(`Is Collection: ${isCollection}`);
  console.log(`Is SBT: ${isSbt}`);
  
  // Automatically create the right type of wrapper
  const wrapper = await TEPs.createFromAddress(blockchain, address);
  
  if (wrapper) {
    console.log(`Created wrapper of type: ${wrapper.constructor.name}`);
    
    // Now you can use the wrapper methods based on the wrapper type
    if (await TEPs.IsNftItemStandard(blockchain, address)) {
      // Import the NftItem class to use for type checking
      const { NftItem } = await import('./generated/nft_item');
      
      // Check if the wrapper is an NftItem instance
      if (wrapper instanceof NftItem) {
        const data = await wrapper.get_nft_data();
        console.log('NFT Data:', data);
      }
    }
  } else {
    console.log('No suitable wrapper found for this address');
  }
}