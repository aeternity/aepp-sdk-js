/**
 * Aens methods - routines to interact with the æternity naming system
 *
 * The high-level description of the naming system is
 * https://github.com/aeternity/protocol/blob/master/AENS.md in the protocol
 * repository.
 */

import BigNumber from 'bignumber.js';
import { genSalt, isAddressValid } from './utils/crypto';
import { commitmentHash, isAuctionName } from './tx/builder/helpers';
import { Tag, AensName, ConsensusProtocolVersion } from './tx/builder/constants';
import { Encoded, Encoding } from './utils/encoder';
import { UnsupportedProtocolError } from './utils/errors';
import { getName } from './chain';
import { sendTransaction, SendTransactionOptions } from './send-transaction';
import { buildTxAsync, BuildTxOptions } from './tx/builder';
import { TransformNodeType } from './Node';
import { NameEntry, NamePointer } from './apis/node';
import AccountBase from './account/Base';
import { AddressEncodings } from './tx/builder/field-types/address';

interface KeyPointers {
  [key: string]: Encoded.Generic<AddressEncodings | Encoding.Bytearray>;
}

/**
 * Revoke a name
 * @category AENS
 * @param name - Name hash
 * @param options - Options
 * @returns Transaction result
 * @example
 * ```js
 * const name = 'test.chain'
 * const nameObject = await sdkInstance.aensQuery(name)
 *
 * await sdkInstance.aensRevoke(name, { fee, ttl , nonce })
 * // or
 * await nameObject.revoke({ fee, ttl, nonce })
 * ```
 */
export async function aensRevoke(
  name: AensName,
  options: AensRevokeOptions,
): ReturnType<typeof sendTransaction> {
  const nameRevokeTx = await buildTxAsync({
    _isInternalBuild: true,
    ...options,
    tag: Tag.NameRevokeTx,
    nameId: name,
    accountId: options.onAccount.address,
  });
  return sendTransaction(nameRevokeTx, options);
}

interface AensRevokeOptions extends
  BuildTxOptions<Tag.NameRevokeTx, 'nameId' | 'accountId' | 'onNode'>,
  SendTransactionOptions {}

/**
 * Update a name
 * @category AENS
 * @param name - AENS name
 * @param pointers - Map of pointer keys to corresponding addresses
 * @param options - Options
 * @throws Invalid pointer array error
 * @example
 * ```js
 * const name = 'test.chain'
 * const pointersArray = ['ak_asd23dasdas...,' 'ct_asdf34fasdasd...']
 * const nameObject = await sdkInstance.aensQuery(name)
 *
 * await sdkInstance.aensUpdate(name, pointersArray, { nameTtl, ttl, fee, nonce, clientTtl })
 * // or
 * await nameObject.update(pointers, { nameTtl, ttl, fee, nonce, clientTtl })
 * ```
 */
export async function aensUpdate(
  name: AensName,
  pointers: KeyPointers,
  { extendPointers, ...options }: AensUpdateOptions,
): ReturnType<typeof sendTransaction> {
  const allPointers = {
    ...extendPointers === true && Object.fromEntries(
      (await getName(name, options)).pointers.map(({ key, id }) => [key, id]),
    ),
    ...pointers,
  };

  const hasRawPointers = Object.values(allPointers)
    .some((v) => isAddressValid(v, Encoding.Bytearray));
  const isIris = (await options.onNode.getNodeInfo())
    .consensusProtocolVersion === ConsensusProtocolVersion.Iris;
  if (hasRawPointers && isIris) {
    throw new UnsupportedProtocolError('Raw pointers are available only in Ceres, the current protocol is Iris');
  }

  const nameUpdateTx = await buildTxAsync({
    _isInternalBuild: true,
    ...options,
    tag: Tag.NameUpdateTx,
    version: hasRawPointers ? 2 : 1,
    nameId: name,
    accountId: options.onAccount.address,
    pointers: Object.entries(allPointers)
      .map(([key, id]: [string, Encoded.Generic<AddressEncodings>]) => ({ key, id })),
  });

  return sendTransaction(nameUpdateTx, options);
}

interface AensUpdateOptions extends
  BuildTxOptions<Tag.NameUpdateTx, 'nameId' | 'accountId' | 'pointers' | 'clientTtl' | 'nameTtl' | 'onNode'>,
  SendTransactionOptions {
  /**
   * Get the pointers from the node and merge with provided ones. Pointers with the same key will be
   * overwritten.
   */
  extendPointers?: boolean;
  /**
   * a suggestion as to how long any clients should cache this information
   */
  clientTtl?: number;
  /**
   * Name ttl represented in number of blocks (Max value is 50000 blocks)
   */
  nameTtl?: number;
}

/**
 * Transfer a domain to another account
 * @category AENS
 * @param name - AENS name
 * @param account - Recipient account publick key
 * @param options - Options
 * @returns Transaction result
 * @example
 * ```js
 * const name = 'test.chain'
 * const recipientPub = 'ak_asd23dasdas...'
 * const nameObject = await sdkInstance.aensQuery(name)
 *
 * await sdkInstance.aensTransfer(name, recipientPub, { ttl, fee, nonce })
 * // or
 * await nameObject.transfer(recipientPub, { ttl, fee, nonce })
 * ```
 */
export async function aensTransfer(
  name: AensName,
  account: Encoded.AccountAddress,
  options: AensTransferOptions,
): ReturnType<typeof sendTransaction> {
  const nameTransferTx = await buildTxAsync({
    _isInternalBuild: true,
    ...options,
    tag: Tag.NameTransferTx,
    nameId: name,
    accountId: options.onAccount.address,
    recipientId: account,
  });

  return sendTransaction(nameTransferTx, options);
}

interface AensTransferOptions extends
  BuildTxOptions<Tag.NameTransferTx, 'nameId' | 'accountId' | 'recipientId' | 'onNode'>,
  SendTransactionOptions {}

/**
 * Query the AENS name info from the node
 * and return the object with info and predefined functions for manipulating name
 * @category AENS
 * @param name - AENS name
 * @param opt - Options
 * @example
 * ```js
 * const nameObject = sdkInstance.aensQuery('test.chain')
 * console.log(nameObject)
 * {
 *  id, // name hash
 *  pointers, // array of pointers
 *  update, // Update name function
 *  extendTtl, // Extend Ttl name function
 *  transfer, // Transfer name function
 *  revoke // Revoke name function
 * }
 * ```
 */
export async function aensQuery(
  name: AensName,
  opt: Parameters<typeof getName>[1] & Parameters<typeof aensUpdate>[2]
  & Parameters<typeof aensTransfer>[2],
): Promise<Readonly<
  TransformNodeType<NameEntry> & {
    id: Encoded.Name;
    owner: Encoded.AccountAddress;
    pointers: KeyPointers | NamePointer[];
    ttl: number;
    update: (
      pointers: KeyPointers,
      options?: Omit<Parameters<typeof aensQuery>[1], 'onNode' | 'onCompiler' | 'onAccount'> & {
        onAccount?: AccountBase;
      }
    ) => ReturnType<typeof aensUpdate> & ReturnType<typeof aensQuery>;
    transfer: (
      account: Encoded.AccountAddress,
      options?: Parameters<typeof aensQuery>[1]
    ) => ReturnType<typeof aensUpdate> & ReturnType<typeof aensQuery>;
    revoke: (options?: Omit<Parameters<typeof aensRevoke>[1], 'onNode' | 'onCompiler' | 'onAccount'> & {
      onAccount?: AccountBase;
    }
    ) => ReturnType<typeof aensRevoke>;
    extendTtl: (
      nameTtl?: number,
      options?: Omit<Parameters<typeof aensQuery>[1], 'onNode' | 'onCompiler' | 'onAccount'>
    ) => ReturnType<typeof aensUpdate> & ReturnType<typeof aensQuery>;
  }
  >> {
  const nameEntry = await getName(name, opt);
  return Object.freeze({
    ...nameEntry,
    id: nameEntry.id as Encoded.Name,
    owner: nameEntry.owner as Encoded.AccountAddress,
    async update(pointers, options) {
      return {
        ...await aensUpdate(name, pointers, { ...opt, ...options }),
        ...await aensQuery(name, { ...opt, ...options }),
      };
    },
    async transfer(account, options) {
      return {
        ...await aensTransfer(name, account, { ...opt, ...options }),
        ...await aensQuery(name, { ...opt, ...options }),
      };
    },
    async revoke(options) {
      return aensRevoke(name, { ...opt, ...options });
    },
    async extendTtl(nameTtl, options = {}) {
      return {
        ...await aensUpdate(name, {}, {
          ...opt, ...options, nameTtl, extendPointers: true,
        }),
        ...await aensQuery(name, { ...opt, ...options }),
      };
    },
  });
}

/**
 * Claim a previously preclaimed registration. This can only be done after the
 * preclaim step
 * @category AENS
 * @param name - AENS name
 * @param salt - Salt from pre-claim, or 0 if it's a bid or claiming without preclaim (in Ceres)
 * @param options - options
 * @returns Transaction result
 * @example
 * ```js
 * const name = 'test.chain'
 * const salt = preclaimResult.salt // salt from pre-claim transaction
 *
 * await sdkInstance.aensClaim(name, salt, { ttl, fee, nonce, nameFee })
 * ```
 */
export async function aensClaim(
  name: AensName,
  salt: number,
  options: AensClaimOptions,
): Promise<AensClaimReturnType> {
  const claimTx = await buildTxAsync({
    _isInternalBuild: true,
    ...options,
    tag: Tag.NameClaimTx,
    accountId: options.onAccount.address,
    nameSalt: salt,
    name,
  });

  const result = await sendTransaction(claimTx, options);
  if (!isAuctionName(name)) {
    const nameInter = result.blockHeight != null && result.blockHeight > 0
      ? await aensQuery(name, options)
      : {};
    return Object.assign(result, nameInter);
  }
  return result;
}

type AensClaimOptionsType = BuildTxOptions<Tag.NameClaimTx, 'accountId' | 'nameSalt' | 'name'>
& SendTransactionOptions & Parameters<typeof aensQuery>[1];
interface AensClaimOptions extends AensClaimOptionsType {}
interface AensClaimReturnType extends
  Awaited<ReturnType<typeof sendTransaction>>,
  Partial<Awaited<ReturnType<typeof aensQuery>>> {}

/**
 * Preclaim a name. Sends a hash of the name and a random salt to the node
 * @category AENS
 * @param name - AENS name
 * @param options - Options
 * @example
 * ```js
 * const name = 'test.chain'
 * const salt = preclaimResult.salt // salt from pre-claim transaction
 *
 * await sdkInstance.aensPreclaim(name, { ttl, fee, nonce })
 * {
 *   ...transactionResult,
 *   claim, // Claim function (options={}) => claimTransactionResult
 *   salt,
 *   commitmentId
 * }
 * ```
 */
export async function aensPreclaim(name: AensName, options: AensPreclaimOptions): Promise<Readonly<
Awaited<ReturnType<typeof sendTransaction>> & {
  salt: number;
  commitmentId: string;
  claim: (opts?: Parameters<typeof aensClaim>[2]) => ReturnType<typeof aensClaim>;
}
>> {
  const salt = genSalt();
  const commitmentId = commitmentHash(name, salt);

  const preclaimTx = await buildTxAsync({
    _isInternalBuild: true,
    ...options,
    tag: Tag.NamePreclaimTx,
    accountId: options.onAccount.address,
    commitmentId,
  });

  return Object.freeze({
    ...await sendTransaction(preclaimTx, options),
    salt,
    commitmentId,
    async claim(opts?: Parameters<typeof aensClaim>[2]) {
      const { version, ...otherOptions } = options;
      return aensClaim(name, salt, { ...otherOptions, ...opts });
    },
  });
}

interface AensPreclaimOptions extends
  BuildTxOptions<Tag.NamePreclaimTx, 'accountId' | 'commitmentId' | 'onNode'>,
  SendTransactionOptions,
  Omit<AensClaimOptions, 'version'> {}

/**
 * Bid to name auction
 * @category AENS
 * @param name - Domain name
 * @param nameFee - Name fee (bid fee)
 * @param options - Options
 * @returns Transaction result
 * @example
 * ```js
 * const name = 'test.chain'
 * const bidFee = computeBidFee(name, { startFee, increment: 0.42 })
 *
 * await sdkInstance.aensBid(name, 213109412839123, { ttl, fee, nonce })
 * ```
 */
export async function aensBid(
  name: AensName,
  nameFee: number | string | BigNumber,
  options: Omit<Parameters<typeof aensClaim>[2], 'nameFee'>,
): ReturnType<typeof aensClaim> {
  return aensClaim(name, 0, { ...options, nameFee });
}
