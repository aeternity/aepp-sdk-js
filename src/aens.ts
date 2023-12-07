/**
 * Aens methods - routines to interact with the æternity naming system
 *
 * The high-level description of the naming system is
 * https://github.com/aeternity/protocol/blob/master/AENS.md in the protocol
 * repository.
 */

import BigNumber from 'bignumber.js';
import { genSalt } from './utils/crypto';
import { commitmentHash, isAuctionName } from './tx/builder/helpers';
import { Tag, AensName } from './tx/builder/constants';
import { LogicError } from './utils/errors';
import { Encoded } from './utils/encoder';
import { Optional } from './utils/other';
import { sendTransaction, SendTransactionOptions, getName } from './chain';
import { buildTxAsync, BuildTxOptions } from './tx/builder';
import Node from './Node';
import AccountBase from './account/Base';
import { AddressEncodings } from './tx/builder/field-types/address';

interface NameRevokeOptions extends
  BuildTxOptions<Tag.NameRevokeTx, 'nameId' | 'accountId'>,
  Optional<SendTransactionOptions, 'onAccount' | 'onNode'> {}

interface KeyPointers {
  [key: string]: Encoded.Generic<AddressEncodings>;
}

interface NameUpdateOptions extends
  BuildTxOptions<Tag.NameUpdateTx, 'nameId' | 'accountId' | 'pointers'>,
  Optional<SendTransactionOptions, 'onAccount' | 'onNode'> {
  extendPointers?: boolean;
}

interface NameTransferOptions extends
  BuildTxOptions<Tag.NameTransferTx, 'nameId' | 'accountId' | 'recipientId'>,
  Optional<SendTransactionOptions, 'onAccount' | 'onNode'> {}

interface NamePreclaimOptions extends
  BuildTxOptions<Tag.NamePreclaimTx, 'accountId' | 'commitmentId'>,
  Optional<SendTransactionOptions, 'onAccount' | 'onNode'> {}

interface NameClaimOptions extends
  BuildTxOptions<Tag.NameClaimTx, 'accountId' | 'nameSalt' | 'name'>,
  Optional<SendTransactionOptions, 'onAccount' | 'onNode'> {}

/**
 * @category AENS
 * @example
 * ```js
 * const name = new Name('test.chain', aeSdk.getContext())
 * ```
 */
export default class Name {
  #salt?: number;

  options: { onNode: Node; onAccount: AccountBase } & NameRevokeOptions & NameUpdateOptions
  & NameTransferOptions & NamePreclaimOptions & NameClaimOptions;

  /**
   * @param value - AENS name
   * @param options - Options
   * @param options.onNode - Node to use
   * @param options.onAccount - Account to use
   */
  constructor(
    public readonly value: AensName,
    options: { onNode: Node; onAccount: AccountBase },
  ) {
    this.options = options;
  }

  /**
   * Revoke a name
   * @param options - Options
   * @param options.onAccount - Account to use
   * @param options.fee - fee
   * @param options.ttl - ttl
   * @param options.nonce - nonce
   * @returns mined transaction details
   * @example
   * ```js
   * await name.revoke({ fee, ttl, nonce })
   * ```
   */
  async revoke(options: NameRevokeOptions = {}): ReturnType<typeof sendTransaction> {
    const opt = { ...this.options, ...options };
    const tx = await buildTxAsync({
      ...opt,
      tag: Tag.NameRevokeTx,
      nameId: this.value,
      accountId: opt.onAccount.address,
    });
    return sendTransaction(tx, opt);
  }

  /**
   * Update a name
   * @param pointers - Map of pointer keys to corresponding addresses
   * @param options - Options
   * @param options.extendPointers - Get the pointers from the node and merge with provided
   * ones. Pointers with the same type will be overwritten
   * @param options.onAccount - Account to use
   * @param options.fee - fee
   * @param options.ttl - ttl
   * @param options.nonce - nonce
   * @param options.nameTtl - represents in number of blocks (max and default is 180000)
   * @param options.clientTtl - a suggestion in seconds as to how long any clients should cache this
   * information
   * @example
   * ```js
   * const name = 'test.chain'
   * const channel = 'ch_2519mBs...'
   * const pointers = {
   *   account_pubkey: 'ak_asd23dasdas...,',
   *   contract_pubkey: 'ct_asdf34fasdasd...',
   *   [getDefaultPointerKey(channel)]: channel,
   * }
   * await name.update(pointers, { nameTtl, ttl, fee, nonce, clientTtl })
   * ```
   */
  async update(
    pointers: KeyPointers,
    options: NameUpdateOptions = {},
  ): ReturnType<typeof sendTransaction> {
    const { extendPointers, ...opt } = { ...this.options, ...options };
    const allPointers = {
      ...extendPointers === true && Object.fromEntries(
        (await getName(this.value, opt)).pointers.map(({ key, id }) => [key, id]),
      ),
      ...pointers,
    };
    const tx = await buildTxAsync({
      ...opt,
      tag: Tag.NameUpdateTx,
      nameId: this.value,
      accountId: opt.onAccount.address,
      pointers: Object.entries(allPointers)
        .map(([key, id]: [string, Encoded.Generic<AddressEncodings>]) => ({ key, id })),
    });
    return sendTransaction(tx, opt);
  }

  /**
   * Transfer a name to another account
   * @param address - Recipient account public key
   * @param options - Options
   * @param options.onAccount - Account to use
   * @param options.fee - fee
   * @param options.ttl - ttl
   * @param options.nonce - nonce
   * @returns mined transaction details
   * @example
   * ```js
   * await name.transfer('ak_asd23dasdas...', { ttl, fee, nonce })
   * ```
   */
  async transfer(
    address: Encoded.AccountAddress,
    options: NameTransferOptions = {},
  ): ReturnType<typeof sendTransaction> {
    const opt = { ...this.options, ...options };
    const tx = await buildTxAsync({
      ...opt,
      tag: Tag.NameTransferTx,
      nameId: this.value,
      accountId: opt.onAccount.address,
      recipientId: address,
    });
    return sendTransaction(tx, opt);
  }

  /**
   * Query the AENS name info from the node
   * and return the object with info and predefined functions for manipulating name
   * @param opt - Options
   * @example
   * ```js
   * const nameEntry = await name.getNodeState()
   * console.log(nameEntry.owner)
   * ```
   */
  async getNodeState(options: { onNode?: Node } = {}): Promise<
  Awaited<ReturnType<Node['getNameEntryByName']>> & {
    id: Encoded.Name;
    owner: Encoded.AccountAddress;
  }
  > {
    const onNode = this.options.onNode ?? options.onNode;
    const nameEntry = await onNode.getNameEntryByName(this.value);
    return {
      ...nameEntry,
      id: nameEntry.id as Encoded.Name,
      owner: nameEntry.owner as Encoded.AccountAddress,
    };
  }

  /**
   *
   * @param nameTtl - represents in number of blocks (max and default is 180000)
   * @param options - Options
   * @returns mined transaction details
   */
  async extendTtl(
    nameTtl?: number,
    options: Omit<Parameters<Name['update']>[1], 'extendPointers' | 'nameTtl'> = {},
  ): ReturnType<Name['update']> {
    return this.update({}, { ...options, nameTtl, extendPointers: true });
  }

  /**
   * Claim a previously preclaimed registration. This can only be done after the preclaim step
   * @param options - options
   * @param options.onAccount - Account to use
   * @param options.fee - fee
   * @param options.ttl - ttl
   * @param options.nonce - nonce
   * @param options.nameFee - name fee (by default calculated by sdk)
   * @returns mined transaction details
   * @example
   * ```js
   * await name.claim({ ttl, fee, nonce, nameFee })
   * ```
   */
  async claim(options: NameClaimOptions = {}): ReturnType<typeof sendTransaction> {
    if (this.#salt == null) throw new LogicError('Name needs to be preclaimed firstly');
    const opt = { ...this.options, ...options };
    const tx = await buildTxAsync({
      ...opt,
      tag: Tag.NameClaimTx,
      accountId: opt.onAccount.address,
      nameSalt: this.#salt,
      name: this.value,
    });
    return sendTransaction(tx, opt);
  }

  /**
   * Preclaim a name. Sends a hash of the name and a random salt to the node
   * @param options - Options
   * @param options.onAccount - Account to use
   * @param options.fee - fee
   * @param options.ttl - ttl
   * @param options.nonce - nonce
   * @example
   * ```js
   * await name.preclaim({ ttl, fee, nonce })
   * ```
   */
  async preclaim(options: NamePreclaimOptions = {}): ReturnType<typeof sendTransaction> {
    const opt = { ...this.options, ...options };
    const salt = genSalt();
    const tx = await buildTxAsync({
      ...opt,
      tag: Tag.NamePreclaimTx,
      accountId: opt.onAccount.address,
      commitmentId: commitmentHash(this.value, salt),
    });
    const result = await sendTransaction(tx, opt);
    this.#salt = salt;
    return result;
  }

  /**
   * Bid to name auction
   * @param nameFee - Name fee (bid fee)
   * @param options - Options
   * @param options.onAccount - Account to use
   * @param options.fee - fee
   * @param options.ttl - ttl
   * @param options.nonce - nonce
   * @returns mined transaction details
   * @example
   * ```js
   * const bidFee = computeBidFee(name.value, { startFee, increment: 0.42 })
   * await name.bid(213109412839123, { ttl, fee, nonce })
   * ```
   */
  async bid(
    nameFee: number | string | BigNumber,
    options: Omit<NameClaimOptions, 'nameFee'> = {},
  ): ReturnType<typeof sendTransaction> {
    if (!isAuctionName(this.value)) {
      throw new LogicError('This is not auction name, so cant make a bid!');
    }
    const opt = { ...this.options, ...options };
    const tx = await buildTxAsync({
      ...opt,
      tag: Tag.NameClaimTx,
      accountId: opt.onAccount.address,
      nameSalt: 0,
      name: this.value,
      nameFee,
    });
    return sendTransaction(tx, opt);
  }
}
