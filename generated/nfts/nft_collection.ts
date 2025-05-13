// Automatically generated TypeScript class for interface nft_collection

import { Address, TupleItem, beginCell, Cell, ExternalAddress, TupleReader } from '@ton/core';
import { Blockchain, SendMessageResult } from '@ton/sandbox';
import { INftCollection } from './interfaces';
import { expect } from '@jest/globals';

export class NftCollection implements INftCollection {
  private blockchain: Blockchain;
  private address: Address;

  constructor(blockchain: Blockchain, address: Address) {
    this.blockchain = blockchain;
    this.address = address;
  }

  async get_collection_data(): Promise<{next_item_index: any, collection_content: Cell, owner_address: any}> {
  try {
  // Call get-method via Blockchain from @ton/sandbox
  const result = await this.blockchain.runGetMethod(
    this.address,
    'get_collection_data',
    [] as TupleItem[]
  );

  // Use TupleReader to process the result, as in Tact
  const reader = new TupleReader(result.stack);
  // Read multiple values from stack
  return {
    next_item_index: reader.readCell(),
    collection_content: reader.readCell(),
    owner_address: reader.readCell(),
  };
  } catch (error) {
    // Analyze error type
    if (error && typeof error === 'object' && 'exitCode' in error) {
      const exitCode = (error as { exitCode: number }).exitCode;
      const errorMessage = (error as { message?: string }).message || '';
      
      // Enhanced error messages for different TVM codes
      switch (exitCode) {
        case 11:
          throw new Error(`ERROR: Method 'get_collection_data' does not exist in contract at address ${this.address}.\nIs it correct that this contract implements interface 'INftCollection'?`);
        case 4:
          throw new Error(`ERROR: Invalid arguments for method 'get_collection_data'.`);
        case 2:
          throw new Error(`ERROR: Contract at address ${this.address} is not responding.`);
        default:
          throw new Error(`ERROR: Method 'get_collection_data' returned error code ${exitCode}. The contract might not implement the expected interface. Details: ${errorMessage}`);
      }
    }
    
    // If error is not TVM-related, throw with enhanced information
    const errorMessage = (error as { message?: string }).message || 'Unknown error';
    throw new Error(`Error executing method 'get_collection_data': ${errorMessage}`);
  }
}

  async get_nft_address_by_index(index: bigint): Promise<any> {
  try {
  // Call get-method via Blockchain from @ton/sandbox
  const result = await this.blockchain.runGetMethod(
    this.address,
    'get_nft_address_by_index',
    [
      { type: 'int', value: index }, // bigint
    ] as TupleItem[]
  );

  // Use TupleReader to process the result, as in Tact
  const reader = new TupleReader(result.stack);
  // Read value from stack
  return reader.readCell();
  } catch (error) {
    // Analyze error type
    if (error && typeof error === 'object' && 'exitCode' in error) {
      const exitCode = (error as { exitCode: number }).exitCode;
      const errorMessage = (error as { message?: string }).message || '';
      
      // Enhanced error messages for different TVM codes
      switch (exitCode) {
        case 11:
          throw new Error(`ERROR: Method 'get_nft_address_by_index' does not exist in contract at address ${this.address}.\nIs it correct that this contract implements interface 'INftCollection'?`);
        case 4:
          throw new Error(`ERROR: Invalid arguments for method 'get_nft_address_by_index'.`);
        case 2:
          throw new Error(`ERROR: Contract at address ${this.address} is not responding.`);
        default:
          throw new Error(`ERROR: Method 'get_nft_address_by_index' returned error code ${exitCode}. The contract might not implement the expected interface. Details: ${errorMessage}`);
      }
    }
    
    // If error is not TVM-related, throw with enhanced information
    const errorMessage = (error as { message?: string }).message || 'Unknown error';
    throw new Error(`Error executing method 'get_nft_address_by_index': ${errorMessage}`);
  }
}

  async get_nft_content(index: bigint, individual_content: Cell): Promise<Cell> {
  try {
  // Call get-method via Blockchain from @ton/sandbox
  const result = await this.blockchain.runGetMethod(
    this.address,
    'get_nft_content',
    [
      { type: 'int', value: index }, // bigint
      { type: 'cell', value: individual_content }, // cell
    ] as TupleItem[]
  );

  // Use TupleReader to process the result, as in Tact
  const reader = new TupleReader(result.stack);
  // Read value from stack
  return reader.readCell();
  } catch (error) {
    // Analyze error type
    if (error && typeof error === 'object' && 'exitCode' in error) {
      const exitCode = (error as { exitCode: number }).exitCode;
      const errorMessage = (error as { message?: string }).message || '';
      
      // Enhanced error messages for different TVM codes
      switch (exitCode) {
        case 11:
          throw new Error(`ERROR: Method 'get_nft_content' does not exist in contract at address ${this.address}.\nIs it correct that this contract implements interface 'INftCollection'?`);
        case 4:
          throw new Error(`ERROR: Invalid arguments for method 'get_nft_content'.`);
        case 2:
          throw new Error(`ERROR: Contract at address ${this.address} is not responding.`);
        default:
          throw new Error(`ERROR: Method 'get_nft_content' returned error code ${exitCode}. The contract might not implement the expected interface. Details: ${errorMessage}`);
      }
    }
    
    // If error is not TVM-related, throw with enhanced information
    const errorMessage = (error as { message?: string }).message || 'Unknown error';
    throw new Error(`Error executing method 'get_nft_content': ${errorMessage}`);
  }
}

  /**
   * Test method for get_collection_data
   */
  async testGet_collection_data(): Promise<void> {
    const result = await this.get_collection_data();
    // Check return object structure
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
    // Check field next_item_index
    // Type 'any' - check field exists
    expect(result.next_item_index).toBeDefined();
    // Check field collection_content
    // Type 'Cell' - check field exists
    expect(result.collection_content).toBeDefined();
    // Check field owner_address
    // Type 'any' - check field exists
    expect(result.owner_address).toBeDefined();
  }

  /**
   * Test method for get_nft_address_by_index
   */
  async testGet_nft_address_by_index(index: bigint): Promise<void> {
    const result = await this.get_nft_address_by_index(index);
    // Check return value type
    // Type 'any' - check
    expect(result).not.toBeUndefined();
  }

  /**
   * Test method for get_nft_content
   */
  async testGet_nft_content(index: bigint, individual_content: Cell): Promise<void> {
    const result = await this.get_nft_content(index, individual_content);
    // Check return value type
    // Type 'Cell' - check
    expect(result).not.toBeUndefined();
  }

}
