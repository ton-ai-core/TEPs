// Automatically generated TypeScript class for interface sbt_item

import { Address, TupleItem, beginCell, Cell, ExternalAddress, TupleReader } from '@ton/core';
import { Blockchain, SendMessageResult } from '@ton/sandbox';
import { ISbtItem } from './interfaces';
import { expect } from '@jest/globals';

export class SbtItem implements ISbtItem {
  private blockchain: Blockchain;
  private address: Address;

  constructor(blockchain: Blockchain, address: Address) {
    this.blockchain = blockchain;
    this.address = address;
  }

  async get_authority_address(): Promise<any> {
  try {
  // Call get-method via Blockchain from @ton/sandbox
  const result = await this.blockchain.runGetMethod(
    this.address,
    'get_authority_address',
    [] as TupleItem[]
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
          throw new Error(`ERROR: Method 'get_authority_address' does not exist in contract at address ${this.address}.\nIs it correct that this contract implements interface 'ISbtItem'?`);
        case 4:
          throw new Error(`ERROR: Invalid arguments for method 'get_authority_address'.`);
        case 2:
          throw new Error(`ERROR: Contract at address ${this.address} is not responding.`);
        default:
          throw new Error(`ERROR: Method 'get_authority_address' returned error code ${exitCode}. The contract might not implement the expected interface. Details: ${errorMessage}`);
      }
    }
    
    // If error is not TVM-related, throw with enhanced information
    const errorMessage = (error as { message?: string }).message || 'Unknown error';
    throw new Error(`Error executing method 'get_authority_address': ${errorMessage}`);
  }
}

  async get_revoked_time(): Promise<bigint> {
  try {
  // Call get-method via Blockchain from @ton/sandbox
  const result = await this.blockchain.runGetMethod(
    this.address,
    'get_revoked_time',
    [] as TupleItem[]
  );

  // Use TupleReader to process the result, as in Tact
  const reader = new TupleReader(result.stack);
  // Read value from stack
  return reader.readBigNumber();
  } catch (error) {
    // Analyze error type
    if (error && typeof error === 'object' && 'exitCode' in error) {
      const exitCode = (error as { exitCode: number }).exitCode;
      const errorMessage = (error as { message?: string }).message || '';
      
      // Enhanced error messages for different TVM codes
      switch (exitCode) {
        case 11:
          throw new Error(`ERROR: Method 'get_revoked_time' does not exist in contract at address ${this.address}.\nIs it correct that this contract implements interface 'ISbtItem'?`);
        case 4:
          throw new Error(`ERROR: Invalid arguments for method 'get_revoked_time'.`);
        case 2:
          throw new Error(`ERROR: Contract at address ${this.address} is not responding.`);
        default:
          throw new Error(`ERROR: Method 'get_revoked_time' returned error code ${exitCode}. The contract might not implement the expected interface. Details: ${errorMessage}`);
      }
    }
    
    // If error is not TVM-related, throw with enhanced information
    const errorMessage = (error as { message?: string }).message || 'Unknown error';
    throw new Error(`Error executing method 'get_revoked_time': ${errorMessage}`);
  }
}

  async sendProve_ownership(query_id: bigint, dest: Address, forward_payload: Cell, with_content: boolean): Promise<SendMessageResult> {
  // Create external message
  const message = beginCell()
    .storeUint(0x04ded148, 32) // op
    .storeUint(query_id, 64) // query_id: uint64
    .storeAddress(typeof dest === 'string' ? Address.parse(dest) : dest) // dest: MsgAddress
    .storeRef(forward_payload) // forward_payload: Cell reference
    .storeBit(with_content) // with_content: Bool
    .endCell();

  // Send external message via blockchain
  return await this.blockchain.sendMessage(message);
}

  async sendRequest_owner(query_id: bigint, dest: Address, forward_payload: Cell, with_content: boolean): Promise<SendMessageResult> {
  // Create external message
  const message = beginCell()
    .storeUint(0xd0c3bfea, 32) // op
    .storeUint(query_id, 64) // query_id: uint64
    .storeAddress(typeof dest === 'string' ? Address.parse(dest) : dest) // dest: MsgAddress
    .storeRef(forward_payload) // forward_payload: Cell reference
    .storeBit(with_content) // with_content: Bool
    .endCell();

  // Send external message via blockchain
  return await this.blockchain.sendMessage(message);
}

  async sendDestroy(query_id: bigint): Promise<SendMessageResult> {
  // Create external message
  const message = beginCell()
    .storeUint(0x1f04537a, 32) // op
    .storeUint(query_id, 64) // query_id: uint64
    .endCell();

  // Send external message via blockchain
  return await this.blockchain.sendMessage(message);
}

  async sendRevoke(query_id: bigint): Promise<SendMessageResult> {
  // Create external message
  const message = beginCell()
    .storeUint(0x6f89f5e3, 32) // op
    .storeUint(query_id, 64) // query_id: uint64
    .endCell();

  // Send external message via blockchain
  return await this.blockchain.sendMessage(message);
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
          throw new Error(`ERROR: Method 'get_nft_data' does not exist in contract at address ${this.address}.\nIs it correct that this contract implements interface 'ISbtItem'?`);
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
   * Test method for get_authority_address
   */
  async testGet_authority_address(): Promise<void> {
    const result = await this.get_authority_address();
    // Check return value type
    // Type 'any' - check
    expect(result).not.toBeUndefined();
  }

  /**
   * Test method for get_revoked_time
   */
  async testGet_revoked_time(): Promise<void> {
    const result = await this.get_revoked_time();
    // Check return value type
    expect(typeof result).toBe('bigint');
  }

  /**
   * Test method for sendProve_ownership
   */
  async testsendProve_ownership(query_id: bigint, dest: Address, forward_payload: Cell, with_content: boolean): Promise<void> {
    try {
      // Call the send method and check result
      const result = await this.sendProve_ownership(query_id, dest, forward_payload, with_content);
      // Verify the basic structure of the result
      expect(result).toBeDefined();
      // Check if transactions are present in the result
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
    } catch (error) {
      // If test fails, provide helpful error message
      const errorMessage = (error as { message?: string }).message || 'Unknown error';
      throw new Error(`Error testing sendProve_ownership: ${errorMessage}`);
    }
  }

  /**
   * Test method for sendRequest_owner
   */
  async testsendRequest_owner(query_id: bigint, dest: Address, forward_payload: Cell, with_content: boolean): Promise<void> {
    try {
      // Call the send method and check result
      const result = await this.sendRequest_owner(query_id, dest, forward_payload, with_content);
      // Verify the basic structure of the result
      expect(result).toBeDefined();
      // Check if transactions are present in the result
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
    } catch (error) {
      // If test fails, provide helpful error message
      const errorMessage = (error as { message?: string }).message || 'Unknown error';
      throw new Error(`Error testing sendRequest_owner: ${errorMessage}`);
    }
  }

  /**
   * Test method for sendDestroy
   */
  async testsendDestroy(query_id: bigint): Promise<void> {
    try {
      // Call the send method and check result
      const result = await this.sendDestroy(query_id);
      // Verify the basic structure of the result
      expect(result).toBeDefined();
      // Check if transactions are present in the result
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
    } catch (error) {
      // If test fails, provide helpful error message
      const errorMessage = (error as { message?: string }).message || 'Unknown error';
      throw new Error(`Error testing sendDestroy: ${errorMessage}`);
    }
  }

  /**
   * Test method for sendRevoke
   */
  async testsendRevoke(query_id: bigint): Promise<void> {
    try {
      // Call the send method and check result
      const result = await this.sendRevoke(query_id);
      // Verify the basic structure of the result
      expect(result).toBeDefined();
      // Check if transactions are present in the result
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
    } catch (error) {
      // If test fails, provide helpful error message
      const errorMessage = (error as { message?: string }).message || 'Unknown error';
      throw new Error(`Error testing sendRevoke: ${errorMessage}`);
    }
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
