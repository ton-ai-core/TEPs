// Automatically generated TypeScript class for interface sbt

import { Address, TupleItem, beginCell, Cell, ExternalAddress, TupleReader } from '@ton/core';
import { Blockchain, SendMessageResult } from '@ton/sandbox';
import { ISbt } from './interfaces';
import { expect } from '@jest/globals';

export class Sbt implements ISbt {
  private blockchain: Blockchain;
  private address: Address;

  constructor(blockchain: Blockchain, address: Address) {
    this.blockchain = blockchain;
    this.address = address;
  }

  async get_authority_address(): Promise<Address | null> {
  try {
  // Call get-method via Blockchain from @ton/sandbox
  const result = await this.blockchain.runGetMethod(
    this.address,
    'get_authority_address',
    [] as TupleItem[]
  );

  // Use TupleReader to process the result, as in Tact
  const reader = new TupleReader(result.stack);
  // Try to read as optional address
  const address = reader.readAddressOpt();
  console.log('authority_address address:', address ? address.toString() : 'null');
  return address;
  } catch (error) {
    // Analyze error type
    if (error && typeof error === 'object' && 'exitCode' in error) {
      const exitCode = (error as { exitCode: number }).exitCode;
      const errorMessage = (error as { message?: string }).message || '';
      
      // Enhanced error messages for different TVM codes
      switch (exitCode) {
        case 11:
          throw new Error(`ERROR: Method 'get_authority_address' does not exist in contract at address ${this.address}.\nIs it correct that this contract implements interface 'ISbt'?`);
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

  /**
   * Test method for get_authority_address
   */
  async testGet_authority_address(): Promise<void> {
    const result = await this.get_authority_address();
    // Check return value type
    if (result !== null) {
      expect(result).toBeInstanceOf(Address);
      
      // Check address format
      const addrStr = result.toString();
      expect(addrStr.startsWith('EQ') || addrStr.startsWith('UQ')).toBeTruthy();
    }
  }

}
