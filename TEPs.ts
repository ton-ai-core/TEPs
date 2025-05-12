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
    const { NftCollection } = await import('./generated/nft_collection');
    const instance = new NftCollection(blockchain, address);
    
    // Test all required get-methods for this interface
    await instance.testGet_nft_content(0n, null);
    await instance.testGet_collection_data();
    await instance.testGet_nft_address_by_index(0n);
    
    // Test all required send-methods for this interface
    // This call may fail, which is expected during standard detection
    await instance.testsendGet_royalty_params(0n);
  }

  /**
   * Check if a contract implements the NftItem standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @throws Error if the contract doesn't implement the standard
   */
  public static async IsNftItemStandard(blockchain: Blockchain, address: Address): Promise<void> {
    // Import the NftItem class
    const { NftItem } = await import('./generated/nft_item');
    const instance = new NftItem(blockchain, address);
    
    // Test all required get-methods for this interface
    await instance.testGet_nft_data();
    
    // Test all required send-methods for this interface
    // Create a valid test address for TON
    const testAddress = Address.parse("EQA-qlZ1_NLqTbVP8fFcxpYxBvX8uKvwzEXCw_AYXbTJV5vN");
    // This call may fail, which is expected during standard detection
    await instance.testsendNft_transfer(0n, testAddress, testAddress, null, 0n, beginCell().endCell());
    // This call may fail, which is expected during standard detection
    await instance.testsendGet_static_data(0n);
  }

  /**
   * Check if a contract implements the Editable standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @throws Error if the contract doesn't implement the standard
   */
  public static async IsEditableStandard(blockchain: Blockchain, address: Address): Promise<void> {
    // Import the Editable class
    const { Editable } = await import('./generated/editable');
    const instance = new Editable(blockchain, address);
    
    // Test all required get-methods for this interface
    await instance.testGet_editor();
  }

  /**
   * Check if a contract implements the Sbt standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @throws Error if the contract doesn't implement the standard
   */
  public static async IsSbtStandard(blockchain: Blockchain, address: Address): Promise<void> {
    // Import the Sbt class
    const { Sbt } = await import('./generated/sbt');
    const instance = new Sbt(blockchain, address);
    
    // Test all required get-methods for this interface
    await instance.testGet_authority_address();
  }

  /**
   * Check if a contract implements the NftItemSimple standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @throws Error if the contract doesn't implement the standard
   */
  public static async IsNftItemSimpleStandard(blockchain: Blockchain, address: Address): Promise<void> {
    // Import the NftItemSimple class
    const { NftItemSimple } = await import('./generated/nft_item_simple');
    const instance = new NftItemSimple(blockchain, address);
    
    // Test all required methods for this interface
    await instance.testGet_nft_data();
  }

}
