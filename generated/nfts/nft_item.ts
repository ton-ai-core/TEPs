// Automatically generated TypeScript class for interface nft_item

import { Address, TupleItem, beginCell, Cell, ExternalAddress, TupleReader } from '@ton/core';
import { Blockchain, SendMessageResult } from '@ton/sandbox';
import { INftItem } from './interfaces';
import { expect } from '@jest/globals';

export class NftItem implements INftItem {
  private blockchain: Blockchain;
  private address: Address;

  constructor(blockchain: Blockchain, address: Address) {
    this.blockchain = blockchain;
    this.address = address;
  }

  async get_nft_data(): Promise<{init?: any, index: bigint, collection_address: any, owner_address: any, individual_content: Cell}> {
  try {
  // Call get-method via Blockchain from @ton/sandbox
  const result = await this.blockchain.runGetMethod(
    this.address,
    'get_nft_data',
    [] as TupleItem[]
  );

  // Use TupleReader to process the result, as in Tact
  const reader = new TupleReader(result.stack);
  // Read multiple values from stack
  return {
    init: reader.readCell(),
    index: reader.readBigNumber(),
    collection_address: reader.readCell(),
    owner_address: reader.readCell(),
    individual_content: reader.readCell(),
  };
  } catch (error) {
    // Analyze error type
    if (error && typeof error === 'object' && 'exitCode' in error) {
      const exitCode = (error as { exitCode: number }).exitCode;
      const errorMessage = (error as { message?: string }).message || '';
      
      // Enhanced error messages for different TVM codes
      switch (exitCode) {
        case 11:
          throw new Error(`ERROR: Method 'get_nft_data' does not exist in contract at address ${this.address}.\nIs it correct that this contract implements interface 'INftItem'?`);
        case 4:
          throw new Error(`ERROR: Invalid arguments for method 'get_nft_data'.`);
        case 2:
          throw new Error(`ERROR: Contract at address ${this.address} is not responding.`);
        default:
          throw new Error(`ERROR: Method 'get_nft_data' returned error code ${exitCode}. The contract might not implement the expected interface. Details: ${errorMessage}`);
      }
    }
    
    // If error is not TVM-related, throw with enhanced information
    const errorMessage = (error as { message?: string }).message || 'Unknown error';
    throw new Error(`Error executing method 'get_nft_data': ${errorMessage}`);
  }
}

  async sendTransfer(query_id: bigint, new_owner: Address, response_destination: Address, custom_payload: Cell | null, forward_amount: bigint, forward_payload: Cell): Promise<SendMessageResult> {
  // Create external message
  const message = beginCell()
    .storeUint(0x5fcc3d14, 32) // op
    .storeUint(query_id, 64) // query_id: uint64
    .storeAddress(typeof new_owner === 'string' ? Address.parse(new_owner) : new_owner) // new_owner: MsgAddress
    .storeAddress(typeof response_destination === 'string' ? Address.parse(response_destination) : response_destination) // response_destination: MsgAddress
    .storeMaybeRef(custom_payload) // custom_payload: (Maybe ^Cell)
    .storeVarUint(forward_amount, 16) // forward_amount: (VarUInteger 16)
    .storeRef(forward_payload) // forward_payload: (Either Cell ^Cell)
    .endCell();

  // Send external message via blockchain
  return await this.blockchain.sendMessage(message);
}

  async sendGet_static_data(query_id: bigint): Promise<SendMessageResult> {
  // Create external message
  const message = beginCell()
    .storeUint(0x2fcb26a2, 32) // op
    .storeUint(query_id, 64) // query_id: uint64
    .endCell();

  // Send external message via blockchain
  return await this.blockchain.sendMessage(message);
}

  /**
   * Test method for get_nft_data
   */
  async testGet_nft_data(): Promise<void> {
    const result = await this.get_nft_data();
    // Check return object structure
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
    // Check field init
    // Type 'any' - check field exists
    expect(result.init).toBeDefined();
    // Check field index
    expect(typeof result.index).toBe('bigint');
    // Check field collection_address
    // Type 'any' - check field exists
    expect(result.collection_address).toBeDefined();
    // Check field owner_address
    // Type 'any' - check field exists
    expect(result.owner_address).toBeDefined();
    // Check field individual_content
    // Type 'Cell' - check field exists
    expect(result.individual_content).toBeDefined();
  }

  /**
   * Test method for sendTransfer
   */
  async testsendTransfer(query_id: bigint, new_owner: Address, response_destination: Address, custom_payload: Cell | null, forward_amount: bigint, forward_payload: Cell): Promise<void> {
    try {
      // Call the send method and check result
      const result = await this.sendTransfer(query_id, new_owner, response_destination, custom_payload, forward_amount, forward_payload);
      // Verify the basic structure of the result
      expect(result).toBeDefined();
      // Check if transactions are present in the result
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
    } catch (error) {
      // If test fails, provide helpful error message
      const errorMessage = (error as { message?: string }).message || 'Unknown error';
      throw new Error(`Error testing sendTransfer: ${errorMessage}`);
    }
  }

  /**
   * Test method for sendGet_static_data
   */
  async testsendGet_static_data(query_id: bigint): Promise<void> {
    try {
      // Call the send method and check result
      const result = await this.sendGet_static_data(query_id);
      // Verify the basic structure of the result
      expect(result).toBeDefined();
      // Check if transactions are present in the result
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
    } catch (error) {
      // If test fails, provide helpful error message
      const errorMessage = (error as { message?: string }).message || 'Unknown error';
      throw new Error(`Error testing sendGet_static_data: ${errorMessage}`);
    }
  }

}
