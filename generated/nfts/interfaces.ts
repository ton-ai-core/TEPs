// Automatically generated TypeScript interfaces for TON ABI

// Required imports
import { Address, TupleItem, beginCell, TupleReader, Cell } from '@ton/core';
import { Blockchain, SendMessageResult } from '@ton/sandbox';

export interface INftCollection {
  /**
   * get_collection_data
   */
  get_collection_data(): Promise<{next_item_index: any, collection_content: Cell, owner_address: any}>;

  /**
   * get_nft_address_by_index
   */
  get_nft_address_by_index(index: bigint): Promise<any>;

  /**
   * get_nft_content
   */
  get_nft_content(index: bigint, individual_content: Cell): Promise<Cell>;

}

export interface INftItem {
  /**
   * get_nft_data
   */
  get_nft_data(): Promise<{init?: any, index: bigint, collection_address: any, owner_address: any, individual_content: Cell}>;

  /**
   * Send transfer message
   */
  sendTransfer(query_id: bigint, new_owner: Address, response_destination: Address, custom_payload: Cell | null, forward_amount: bigint, forward_payload: Cell): Promise<SendMessageResult>;

  /**
   * Send get_static_data message
   */
  sendGet_static_data(query_id: bigint): Promise<SendMessageResult>;

}

export interface ISbtItem extends INftItem {
  /**
   * get_authority_address
   */
  get_authority_address(): Promise<any>;

  /**
   * get_revoked_time
   */
  get_revoked_time(): Promise<bigint>;

  /**
   * Send prove_ownership message
   */
  sendProve_ownership(query_id: bigint, dest: Address, forward_payload: Cell, with_content: boolean): Promise<SendMessageResult>;

  /**
   * Send request_owner message
   */
  sendRequest_owner(query_id: bigint, dest: Address, forward_payload: Cell, with_content: boolean): Promise<SendMessageResult>;

  /**
   * Send destroy message
   */
  sendDestroy(query_id: bigint): Promise<SendMessageResult>;

  /**
   * Send revoke message
   */
  sendRevoke(query_id: bigint): Promise<SendMessageResult>;

}

