// Automatically generated TypeScript interfaces for TON ABI

// Required imports
import { Address, TupleItem, beginCell, TupleReader, Cell } from '@ton/core';
import { Blockchain, SendMessageResult } from '@ton/sandbox';

export interface INftCollection {
  /**
   * get_nft_content
   */
  get_nft_content(index: bigint, individual_content: any): Promise<any>;

  /**
   * get_collection_data
   */
  get_collection_data(): Promise<{next_item_index: bigint, collection_content: any, owner_address: Address | null}>;

  /**
   * get_nft_address_by_index
   */
  get_nft_address_by_index(index: bigint): Promise<Address | null>;

  /**
   * Send get_royalty_params message
   */
  sendGet_royalty_params(query_id: bigint): Promise<SendMessageResult>;

}

export interface INftItem {
  /**
   * get_nft_data
   */
  get_nft_data(): Promise<{init: boolean, index: bigint, collection_address: Address | null, owner_address: Address | null, individual_content: any}>;

  /**
   * Send nft_transfer message
   */
  sendNft_transfer(query_id: bigint, new_owner: Address, response_destination: Address, custom_payload: Cell | null, forward_amount: bigint, forward_payload: Cell): Promise<SendMessageResult>;

  /**
   * Send get_static_data message
   */
  sendGet_static_data(query_id: bigint): Promise<SendMessageResult>;

}

export interface INftItemSimple extends INftItem {
}

export interface IEditable {
  /**
   * get_editor
   */
  get_editor(): Promise<Address | null>;

}

export interface ISbt {
  /**
   * get_authority_address
   */
  get_authority_address(): Promise<Address | null>;

}

