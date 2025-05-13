// Automatically generated TEPs (TON Enhancement Proposals) utility class

import { Address, TupleItem, beginCell, Cell } from '@ton/core';
import { Blockchain } from '@ton/sandbox';

/**
 * TEPs - TON Enhancement Proposals standards utility class
 * This class provides methods to check if contracts implement specific standards
 */
export class TEPs {
  /**
   * Check if a contract implements the NftCollection standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @throws Error if the contract doesn't implement the standard
   */
  public static async IsNftCollectionStandard(blockchain: Blockchain, address: Address): Promise<void> {
    // Import the NftCollection class
    const { NftCollection } = await import('././generated/nfts/nft_collection');
    const instance = new NftCollection(blockchain, address);
    
    // Test all required get-methods for this interface
    await instance.testGet_collection_data();
    await instance.testGet_nft_address_by_index(0n);
    await instance.testGet_nft_content(0n, beginCell().endCell());
  }

  /**
   * Check if a contract implements the NftItem standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @throws Error if the contract doesn't implement the standard
   */
  public static async IsNftItemStandard(blockchain: Blockchain, address: Address): Promise<void> {
    // Import the NftItem class
    const { NftItem } = await import('././generated/nfts/nft_item');
    const instance = new NftItem(blockchain, address);
    
    // Test all required get-methods for this interface
    await instance.testGet_nft_data();
    
    // Test all required send-methods for this interface
    // Create a valid test address for TON
    const testAddress = Address.parse("EQA-qlZ1_NLqTbVP8fFcxpYxBvX8uKvwzEXCw_AYXbTJV5vN");
    // This call may fail, which is expected during standard detection
    await instance.testsendTransfer(0n, testAddress, testAddress, null, 0n, beginCell().endCell());
    // This call may fail, which is expected during standard detection
    await instance.testsendGet_static_data(0n);
  }

  /**
   * Check if a contract implements the SbtItem standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @throws Error if the contract doesn't implement the standard
   */
  public static async IsSbtItemStandard(blockchain: Blockchain, address: Address): Promise<void> {
    // Import the SbtItem class
    const { SbtItem } = await import('././generated/nfts/sbt_item');
    const instance = new SbtItem(blockchain, address);
    
    // Test all required get-methods for this interface
    await instance.testGet_authority_address();
  }

}
