/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

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
import {
  CLIENT_TTL, NAME_TTL, Tag, AensName,
} from './tx/builder/constants';
import { ArgumentError } from './utils/errors';
import { Encoded } from './utils/encoder';
import { send, SendOptions } from './spend';
import { getName, getHeight } from './chain';
import { _buildTx, BuildTxOptions } from './tx';
import { TransformNodeType } from './Node';
import { NameEntry, NamePointer } from './apis/node';
import AccountBase from './account/Base';

interface KeyPointers {
  [key: string]: string | Buffer;
}

/**
 * Revoke a name
 * @category AENS
 * @param name - Name hash
 * @param options - Options
 * @param options.onAccount - Make operation on specific account from sdk (you pass
 * publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param options.fee - fee
 * @param options.ttl - ttl
 * @param options.nonce - nonce
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
): ReturnType<typeof send> {
  const nameRevokeTx = await _buildTx(Tag.NameRevokeTx, {
    ...options,
    nameId: name,
    accountId: await options.onAccount.address(options),
  });
  return send(nameRevokeTx, options);
}

interface AensRevokeOptions extends
  BuildTxOptions<Tag.NameRevokeTx, 'nameId' | 'accountId'>,
  SendOptions {}

/**
 * Update a name
 * @category AENS
 * @param name - AENS name
 * @param pointers - Map of pointer keys to corresponding addresses
 * @param options - Options
 * @param options.extendPointers - Get the pointers from the node and merge with provided
 * ones. Pointers with the same type will be overwritten
 * @param options.onAccount - Make operation on specific account from sdk (you
 * pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param options.fee - fee
 * @param options.ttl - ttl
 * @param options.nonce - nonce
 * @param options.nameTtl - Name ttl represented in number of
 * blocks (Max value is 50000 blocks)
 * @param options.clientTtl=84600 a suggestion as to how long any
 * clients should cache this information
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
): ReturnType<typeof send> {
  const allPointers = {
    ...extendPointers === true && Object.fromEntries(
      (await getName(name, options)).pointers
        .map(({ key, id }: { key: string; id: string }) => [key, id]),
    ),
    ...pointers,
  };

  const nameUpdateTx = await _buildTx(Tag.NameUpdateTx, {
    clientTtl: CLIENT_TTL,
    nameTtl: NAME_TTL,
    ...options,
    nameId: name,
    accountId: await options.onAccount.address(options),
    pointers: Object.entries(allPointers).map(([key, id]) => ({ key, id: id.toString() })),
  });

  return send(nameUpdateTx, options);
}

interface AensUpdateOptions extends
  BuildTxOptions<Tag.NameUpdateTx, 'nameId' | 'accountId' | 'pointers' | 'clientTtl' | 'nameTtl'>,
  SendOptions {
  extendPointers?: boolean;
  clientTtl?: number;
  nameTtl?: number;
}

/**
 * Transfer a domain to another account
 * @category AENS
 * @param name - AENS name
 * @param account - Recipient account publick key
 * @param options - Options
 * @param options.onAccount - Make operation on specific account from sdk (you pass
 * publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param options.fee - fee
 * @param options.ttl - ttl
 * @param options.nonce - nonce
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
): ReturnType<typeof send> {
  const nameTransferTx = await _buildTx(Tag.NameTransferTx, {
    ...options,
    nameId: name,
    accountId: await options.onAccount.address(options),
    recipientId: account,
  });

  return send(nameTransferTx, options);
}

interface AensTransferOptions extends
  BuildTxOptions<Tag.NameTransferTx, 'nameId' | 'accountId' | 'recipientId'>,
  SendOptions {}

/**
 * Query the AENS name info from the node
 * and return the object with info and predefined functions for manipulating name
 * @category AENS
 * @param name - AENS name
 * @param opt - Options
 * @returns
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
      nameTtl: number,
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
    async extendTtl(nameTtl = NAME_TTL, options = {}) {
      if (nameTtl > NAME_TTL || nameTtl <= 0) {
        throw new ArgumentError('nameTtl', `a number between 1 and ${NAME_TTL} blocks`, nameTtl);
      }

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
 * @param salt - Salt from pre-claim, or 0 if it's a bid
 * @param options - options
 * @param options.onAccount - Make operation on specific account from sdk (you pass
 * publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param options.fee - fee
 * @param options.ttl - ttl
 * @param options.nonce - nonce
 * @param options.nameFee - Name Fee (By default calculated by sdk)
 * @returns the result of the claim
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
  const claimTx = await _buildTx(Tag.NameClaimTx, {
    ...options,
    accountId: await options.onAccount.address(options),
    nameSalt: salt,
    name,
  });

  const result = await send(claimTx, options);
  if (!isAuctionName(name)) {
    const nameInter = result.blockHeight != null && result.blockHeight > 0
      ? await aensQuery(name, options)
      : {};
    return Object.assign(result, nameInter);
  }
  return result;
}

type AensClaimOptionsType = BuildTxOptions<Tag.NameClaimTx, 'accountId' | 'nameSalt' | 'name'>
& SendOptions & Parameters<typeof aensQuery>[1];
interface AensClaimOptions extends AensClaimOptionsType {}
interface AensClaimReturnType extends
  Awaited<ReturnType<typeof send>>,
  Partial<Awaited<ReturnType<typeof aensQuery>>> {}

/**
 * Preclaim a name. Sends a hash of the name and a random salt to the node
 * @category AENS
 * @param name - AENS name
 * @param options - Options
 * @param options.onAccount - Make operation on specific account from sdk (you pass
 * publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param options.fee - fee
 * @param options.ttl - ttl
 * @param options.nonce - nonce
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
Awaited<ReturnType<typeof send>> & {
  height: number;
  salt: number;
  commitmentId: string;
  claim: (opts?: Parameters<typeof aensClaim>[2]) => ReturnType<typeof aensClaim>;
}
>> {
  const salt = genSalt();
  const height = await getHeight(options);
  const commitmentId = commitmentHash(name, salt);

  const preclaimTx = await _buildTx(Tag.NamePreclaimTx, {
    ...options,
    accountId: await options.onAccount.address(options),
    commitmentId,
  });

  return Object.freeze({
    ...await send(preclaimTx, options),
    height,
    salt,
    commitmentId,
    async claim(opts?: Parameters<typeof aensClaim>[2]) {
      return aensClaim(name, salt, { ...options, ...opts });
    },
  });
}

interface AensPreclaimOptions extends
  BuildTxOptions<Tag.NamePreclaimTx, 'accountId' | 'commitmentId'>,
  SendOptions,
  AensClaimOptions {}

/**
 * Bid to name auction
 * @category AENS
 * @param name - Domain name
 * @param nameFee - Name fee (bid fee)
 * @param options - Options
 * @param options.onAccount - Make operation on specific account from sdk (you pass
 * publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param options.fee - fee
 * @param options.ttl - ttl
 * @param options.nonce - nonce
 * @returns Transaction result
 * @example
 * ```js
 * const name = 'test.chain'
 * const bidFee = computeBidFee(name, startFee, incrementPercentage)
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
