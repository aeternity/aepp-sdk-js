/**
 * Aens methods - routines to interact with the æternity naming system
 *
 * The high-level description of the naming system is
 * https://github.com/aeternity/protocol/blob/master/AENS.md in the protocol
 * repository.
 */

import { BigNumber } from 'bignumber.js';
import { genSalt, isAddressValid } from './utils/crypto.js';
import { commitmentHash, isAuctionName, produceNameId } from './tx/builder/helpers.js';
import { Tag, AensName } from './tx/builder/constants.js';
import { Encoded, Encoding } from './utils/encoder.js';
import { LogicError } from './utils/errors.js';
import { getName } from './chain.js';
import { sendTransaction, SendTransactionOptions } from './send-transaction.js';
import { Optional } from './utils/other.js';
import { buildTxAsync, BuildTxOptions } from './tx/builder/index.js';
import Node from './Node.js';
import AccountBase from './account/Base.js';
import { AddressEncodings } from './tx/builder/field-types/address.js';

interface NameRevokeOptions
  extends BuildTxOptions<Tag.NameRevokeTx, 'nameId' | 'accountId'>,
    Optional<SendTransactionOptions, 'onAccount' | 'onNode'> {}

interface KeyPointers {
  [key: string]: Encoded.Generic<AddressEncodings | Encoding.Bytearray>;
}

interface NameUpdateOptions
  extends BuildTxOptions<Tag.NameUpdateTx, 'nameId' | 'accountId' | 'pointers'>,
    Optional<SendTransactionOptions, 'onAccount' | 'onNode'> {
  /**
   * Get the pointers from the node and merge with provided ones. Pointers with the same key will be
   * overwritten.
   */
  extendPointers?: boolean;
}

interface NameTransferOptions
  extends BuildTxOptions<Tag.NameTransferTx, 'nameId' | 'accountId' | 'recipientId'>,
    Optional<SendTransactionOptions, 'onAccount' | 'onNode'> {}

interface NamePreclaimOptions
  extends BuildTxOptions<Tag.NamePreclaimTx, 'accountId' | 'commitmentId'>,
    Optional<SendTransactionOptions, 'onAccount' | 'onNode'> {}

interface NameClaimOptions
  extends BuildTxOptions<Tag.NameClaimTx, 'accountId' | 'name'>,
    Optional<SendTransactionOptions, 'onAccount' | 'onNode'> {}

class NotAuctionNameError extends LogicError {
  constructor(name: AensName, action: string) {
    super(`Can't ${action} because ${name} is not an auction name`);
    this.name = 'NotAuctionNameError';
  }
}

/**
 * @category AENS
 * @example
 * ```js
 * const name = new Name('test.chain', aeSdk.getContext())
 * ```
 */
export default class Name {
  #salt?: number;

  /**
   * @param value - AENS name
   * @param options - Options
   * @param options.onNode - Node to use
   * @param options.onAccount - Account to use
   */
  constructor(
    public readonly value: AensName,
    public options: { onNode: Node; onAccount: AccountBase } & Omit<
      NameRevokeOptions &
        NameUpdateOptions &
        NameTransferOptions &
        NamePreclaimOptions &
        NameClaimOptions,
      'version'
    >,
  ) {
    this.options = options;
  }

  /**
   * Name ID encoded as nm_-prefixed string
   */
  get id(): Encoded.Name {
    return produceNameId(this.value);
  }

  /**
   * Revoke a name
   * @param options - Options
   * @returns mined transaction details
   * @example
   * ```js
   * await name.revoke({ fee, ttl, nonce })
   * ```
   */
  async revoke(options: NameRevokeOptions = {}): ReturnType<typeof sendTransaction> {
    const opt = { ...this.options, ...options };
    const tx = await buildTxAsync({
      _isInternalBuild: true,
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
      ...(extendPointers === true &&
        Object.fromEntries(
          (await getName(this.value, opt)).pointers.map(({ key, id }) => [key, id]),
        )),
      ...pointers,
    };

    const hasRawPointers = Object.values(allPointers).some((v) =>
      isAddressValid(v, Encoding.Bytearray),
    );

    const tx = await buildTxAsync({
      _isInternalBuild: true,
      ...opt,
      tag: Tag.NameUpdateTx,
      version: hasRawPointers ? 2 : 1,
      nameId: this.value,
      accountId: opt.onAccount.address,
      pointers: Object.entries(allPointers).map(
        ([key, id]: [string, Encoded.Generic<AddressEncodings>]) => ({ key, id }),
      ),
    });
    return sendTransaction(tx, opt);
  }

  /**
   * Transfer a name to another account
   * @param address - Recipient account public key
   * @param options - Options
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
      _isInternalBuild: true,
      ...opt,
      tag: Tag.NameTransferTx,
      nameId: this.value,
      accountId: opt.onAccount.address,
      recipientId: address,
    });
    return sendTransaction(tx, opt);
  }

  /**
   * Query the AENS name info from the node and return the object with info
   * @param options - Options
   * @example
   * ```js
   * const nameEntry = await name.getState()
   * console.log(nameEntry.owner)
   * ```
   */
  async getState(options: { onNode?: Node } = {}): Promise<
    Awaited<ReturnType<Node['getNameEntryByName']>> & {
      id: Encoded.Name;
      owner: Encoded.AccountAddress;
    }
  > {
    const onNode = options.onNode ?? this.options.onNode;
    const nameEntry = await onNode.getNameEntryByName(this.value);
    return {
      ...nameEntry,
      id: nameEntry.id as Encoded.Name,
      owner: nameEntry.owner as Encoded.AccountAddress,
    };
  }

  /**
   * Query the AENS auction info from the node and return the object with info
   * @param options - Options
   * @example
   * ```js
   * const auctionEntry = await name.getAuctionState()
   * console.log(auctionEntry.highestBidder)
   * ```
   */
  async getAuctionState(options: { onNode?: Node } = {}): Promise<
    Awaited<ReturnType<Node['getAuctionEntryByName']>> & {
      id: Encoded.Name;
      highestBidder: Encoded.AccountAddress;
    }
  > {
    if (!isAuctionName(this.value)) throw new NotAuctionNameError(this.value, 'get auction state');
    const onNode = options.onNode ?? this.options.onNode;
    const nameEntry = await onNode.getAuctionEntryByName(this.value);
    return {
      ...nameEntry,
      id: nameEntry.id as Encoded.Name,
      highestBidder: nameEntry.highestBidder as Encoded.AccountAddress,
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
   * @returns mined transaction details
   * @example
   * ```js
   * await name.claim({ ttl, fee, nonce, nameFee })
   * ```
   */
  async claim(options: NameClaimOptions = {}): ReturnType<typeof sendTransaction> {
    const opt = { ...this.options, ...options };
    const tx = await buildTxAsync({
      _isInternalBuild: true,
      nameSalt: this.#salt,
      ...opt,
      tag: Tag.NameClaimTx,
      accountId: opt.onAccount.address,
      name: this.value,
    });
    return sendTransaction(tx, opt);
  }

  /**
   * Preclaim a name. Sends a hash of the name and a random salt to the node
   * @param options - Options
   * @example
   * ```js
   * await name.preclaim({ ttl, fee, nonce })
   * ```
   */
  async preclaim(
    options: NamePreclaimOptions = {},
  ): Promise<Awaited<ReturnType<typeof sendTransaction>> & { nameSalt: number }> {
    const opt = { ...this.options, ...options };
    const nameSalt = genSalt();
    const tx = await buildTxAsync({
      _isInternalBuild: true,
      ...opt,
      tag: Tag.NamePreclaimTx,
      accountId: opt.onAccount.address,
      commitmentId: commitmentHash(this.value, nameSalt),
    });
    const result = await sendTransaction(tx, opt);
    this.#salt = nameSalt;
    return { ...result, nameSalt };
  }

  /**
   * Bid to name auction
   * @param nameFee - Name fee (bid fee)
   * @param options - Options
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
    if (!isAuctionName(this.value)) throw new NotAuctionNameError(this.value, 'make a bid');
    const opt = { ...this.options, ...options };
    const tx = await buildTxAsync({
      _isInternalBuild: true,
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
