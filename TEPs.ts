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
   * @returns Promise<boolean> True if the contract implements the standard
   */
  public static async IsNftCollectionStandard(blockchain: Blockchain, address: Address): Promise<boolean> {
    try {
      // Try to dynamically import the NftCollection class
      const { NftCollection } = await import('././generated/nft_collection');
      const instance = new NftCollection(blockchain, address);
      
      // Test all required get-methods for this interface
      await instance.testGet_nft_content(0n, null);
      await instance.testGet_collection_data();
      await instance.testGet_nft_address_by_index(0n);
      
      // Test all required send-methods for this interface
      try {
        // Test send method: sendGet_royalty_params
        try {
          await instance.testsendGet_royalty_params(0n);
        } catch (sendError: any) {
          console.log(`Note: Send method sendGet_royalty_params test failed, but this is expected during standard detection: ${sendError?.message || 'Unknown error'}`);
          // Continue with next test - send method failures are expected during detection
        }
      } catch (error) {
        // If there's an error with send methods, log but continue
        console.log('Note: Some send method tests failed but get-methods passed, standard detection continues');
      }
      return true;
    } catch (error) {
      // If there's an error, the contract doesn't implement this standard
      return false;
    }
  }

  /**
   * Create NftCollection wrapper if supported
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @returns Promise with the NftCollection wrapper or null if not supported
   */
  public static async CreateNftCollection(blockchain: Blockchain, address: Address) {
    try {
      // Check if the contract implements the standard
      const isSupported = await this.IsNftCollectionStandard(blockchain, address);
      if (!isSupported) return null;
      
      // Create and return the wrapper
      const { NftCollection } = await import('././generated/nft_collection');
      return new NftCollection(blockchain, address);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a contract implements the NftItem standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @returns Promise<boolean> True if the contract implements the standard
   */
  public static async IsNftItemStandard(blockchain: Blockchain, address: Address): Promise<boolean> {
    try {
      // Try to dynamically import the NftItem class
      const { NftItem } = await import('././generated/nft_item');
      const instance = new NftItem(blockchain, address);
      
      // Test all required get-methods for this interface
      await instance.testGet_nft_data();
      
      // Test all required send-methods for this interface
      try {
        // Test send method: sendNft_transfer
        try {
          await instance.testsendNft_transfer(0n, Address.parse("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"), Address.parse("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"), null, 0n, beginCell().endCell());
        } catch (sendError: any) {
          console.log(`Note: Send method sendNft_transfer test failed, but this is expected during standard detection: ${sendError?.message || 'Unknown error'}`);
          // Continue with next test - send method failures are expected during detection
        }
        // Test send method: sendGet_static_data
        try {
          await instance.testsendGet_static_data(0n);
        } catch (sendError: any) {
          console.log(`Note: Send method sendGet_static_data test failed, but this is expected during standard detection: ${sendError?.message || 'Unknown error'}`);
          // Continue with next test - send method failures are expected during detection
        }
      } catch (error) {
        // If there's an error with send methods, log but continue
        console.log('Note: Some send method tests failed but get-methods passed, standard detection continues');
      }
      return true;
    } catch (error) {
      // If there's an error, the contract doesn't implement this standard
      return false;
    }
  }

  /**
   * Create NftItem wrapper if supported
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @returns Promise with the NftItem wrapper or null if not supported
   */
  public static async CreateNftItem(blockchain: Blockchain, address: Address) {
    try {
      // Check if the contract implements the standard
      const isSupported = await this.IsNftItemStandard(blockchain, address);
      if (!isSupported) return null;
      
      // Create and return the wrapper
      const { NftItem } = await import('././generated/nft_item');
      return new NftItem(blockchain, address);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a contract implements the Editable standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @returns Promise<boolean> True if the contract implements the standard
   */
  public static async IsEditableStandard(blockchain: Blockchain, address: Address): Promise<boolean> {
    try {
      // Try to dynamically import the Editable class
      const { Editable } = await import('././generated/editable');
      const instance = new Editable(blockchain, address);
      
      // Test all required get-methods for this interface
      await instance.testGet_editor();
      return true;
    } catch (error) {
      // If there's an error, the contract doesn't implement this standard
      return false;
    }
  }

  /**
   * Create Editable wrapper if supported
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @returns Promise with the Editable wrapper or null if not supported
   */
  public static async CreateEditable(blockchain: Blockchain, address: Address) {
    try {
      // Check if the contract implements the standard
      const isSupported = await this.IsEditableStandard(blockchain, address);
      if (!isSupported) return null;
      
      // Create and return the wrapper
      const { Editable } = await import('././generated/editable');
      return new Editable(blockchain, address);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a contract implements the Sbt standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @returns Promise<boolean> True if the contract implements the standard
   */
  public static async IsSbtStandard(blockchain: Blockchain, address: Address): Promise<boolean> {
    try {
      // Try to dynamically import the Sbt class
      const { Sbt } = await import('././generated/sbt');
      const instance = new Sbt(blockchain, address);
      
      // Test all required get-methods for this interface
      await instance.testGet_authority_address();
      return true;
    } catch (error) {
      // If there's an error, the contract doesn't implement this standard
      return false;
    }
  }

  /**
   * Create Sbt wrapper if supported
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @returns Promise with the Sbt wrapper or null if not supported
   */
  public static async CreateSbt(blockchain: Blockchain, address: Address) {
    try {
      // Check if the contract implements the standard
      const isSupported = await this.IsSbtStandard(blockchain, address);
      if (!isSupported) return null;
      
      // Create and return the wrapper
      const { Sbt } = await import('././generated/sbt');
      return new Sbt(blockchain, address);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a contract implements the NftItemSimple standard
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @returns Promise<boolean> True if the contract implements the standard
   */
  public static async IsNftItemSimpleStandard(blockchain: Blockchain, address: Address): Promise<boolean> {
    try {
      // Try to dynamically import the NftItemSimple class
      const { NftItemSimple } = await import('././generated/nft_item_simple');
      const instance = new NftItemSimple(blockchain, address);
      
      // Test all required methods for this interface
      await instance.testGet_nft_data();
      return true;
    } catch (error) {
      // If there's an error, the contract doesn't implement this standard
      return false;
    }
  }

  /**
   * Create NftItemSimple wrapper if supported
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @returns Promise with the NftItemSimple wrapper or null if not supported
   */
  public static async CreateNftItemSimple(blockchain: Blockchain, address: Address) {
    try {
      // Check if the contract implements the standard
      const isSupported = await this.IsNftItemSimpleStandard(blockchain, address);
      if (!isSupported) return null;
      
      // Create and return the wrapper
      const { NftItemSimple } = await import('././generated/nft_item_simple');
      return new NftItemSimple(blockchain, address);
    } catch (error) {
      return null;
    }
  }

  /**
   * Create an instance of a standard object if supported
   * @param blockchain Blockchain instance to use for queries
   * @param address Address of the contract to check
   * @returns Promise with the appropriate standard instance, or null if not supported
   */
  public static async createFromAddress(blockchain: Blockchain, address: Address) {
    // Try to identify the standard and create the appropriate instance
    // Check if it's a Sbt
    const sbtInstance = await this.CreateSbt(blockchain, address);
    if (sbtInstance) return sbtInstance;
    
    // Check if it's a Editable
    const editableInstance = await this.CreateEditable(blockchain, address);
    if (editableInstance) return editableInstance;
    
    // Check if it's a NftItemSimple
    const nft_item_simpleInstance = await this.CreateNftItemSimple(blockchain, address);
    if (nft_item_simpleInstance) return nft_item_simpleInstance;
    
    // Check if it's a NftItem
    const nft_itemInstance = await this.CreateNftItem(blockchain, address);
    if (nft_itemInstance) return nft_itemInstance;
    
    // Check if it's a NftCollection
    const nft_collectionInstance = await this.CreateNftCollection(blockchain, address);
    if (nft_collectionInstance) return nft_collectionInstance;
    
    // No matching standard found
    return null;
  }
}
