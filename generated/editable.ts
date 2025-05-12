// Automatically generated TypeScript class for interface editable

import { Address, TupleItem, beginCell, Cell, ExternalAddress, TupleReader } from '@ton/core';
import { Blockchain, SendMessageResult } from '@ton/sandbox';
import { IEditable } from './interfaces';
import { expect } from '@jest/globals';

export class Editable implements IEditable {
  private blockchain: Blockchain;
  private address: Address;

  constructor(blockchain: Blockchain, address: Address) {
    this.blockchain = blockchain;
    this.address = address;
  }

  async get_editor(): Promise<Address | null> {
  try {
  // Call get-method via Blockchain from @ton/sandbox
  const result = await this.blockchain.runGetMethod(
    this.address,
    'get_editor',
    [] as TupleItem[]
  );

  // Use TupleReader to process the result, as in Tact
  const reader = new TupleReader(result.stack);
  // Try to read as optional address
  const address = reader.readAddressOpt();
  console.log('editor address:', address ? address.toString() : 'null');
  return address;
  } catch (error) {
    // Analyze error type
    if (error && typeof error === 'object' && 'exitCode' in error) {
      const exitCode = (error as { exitCode: number }).exitCode;
      const errorMessage = (error as { message?: string }).message || '';
      
      // Enhanced error messages for different TVM codes
      switch (exitCode) {
        case 11:
          throw new Error(`ERROR: Method 'get_editor' does not exist in contract at address ${this.address}.\nIs it correct that this contract implements interface 'IEditable'?`);
        case 4:
          throw new Error(`ERROR: Invalid arguments for method 'get_editor'.`);
        case 2:
          throw new Error(`ERROR: Contract at address ${this.address} is not responding.`);
        default:
          throw new Error(`ERROR: Method 'get_editor' returned error code ${exitCode}. The contract might not implement the expected interface. Details: ${errorMessage}`);
      }
    }
    
    // If error is not TVM-related, throw with enhanced information
    const errorMessage = (error as { message?: string }).message || 'Unknown error';
    throw new Error(`Error executing method 'get_editor': ${errorMessage}`);
  }
}

  /**
   * Test method for get_editor
   */
  async testGet_editor(): Promise<void> {
    const result = await this.get_editor();
    // Check return value type
    if (result !== null) {
      expect(result).toBeInstanceOf(Address);
      
      // Check address format
      const addrStr = result.toString();
      expect(addrStr.startsWith('EQ') || addrStr.startsWith('UQ')).toBeTruthy();
    }
  }

}
