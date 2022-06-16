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

import { salt } from '../utils/crypto'
import { commitmentHash, isAuctionName, Pointer } from '../tx/builder/helpers'
import { CLIENT_TTL, NAME_TTL, TX_TYPE, AensName } from '../tx/builder/schema'
import { ArgumentError } from '../utils/errors'
import { EncodedData } from '../utils/encoder'
import { BigNumber } from 'bignumber.js'
import { send } from './spend'
import { getName, height } from '../chain'
import { _buildTx, BuildTxOptions } from '../tx'
import { TransformNodeType } from '../node'
import { NameEntry } from '../apis/node'
import AccountBase from '../account/base'

interface KeyPointers {
  [key: string]: string | Buffer
}

/**
 * Revoke a name
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
export async function aensRevoke (
  name: AensName,
  options: Parameters<typeof send>[1] & BuildTxOptions<TX_TYPE.nameRevoke, 'nameId' | 'accountId'>
): ReturnType<typeof send> {
  const nameRevokeTx = await _buildTx(TX_TYPE.nameRevoke, {
    ...options,
    nameId: name,
    accountId: await options.onAccount.address(options)
  })
  return await send(nameRevokeTx, options)
}

/**
 * Update a name
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
export async function aensUpdate (
  name: AensName,
  pointers: KeyPointers,
  { extendPointers, ...options }: { extendPointers?: boolean } & Parameters<typeof send>[1]
  & BuildTxOptions<TX_TYPE.nameUpdate, 'nameId' | 'accountId' | 'pointers' | 'clientTtl' | 'nameTtl'>
  & { clientTtl?: number, nameTtl?: number }
): ReturnType<typeof send> {
  const allPointers = {
    ...extendPointers === true && Object.fromEntries(
      (await getName(name, options)).pointers
        .map(({ key, id }: { key: string, id: string }) => [key, id])
    ),
    ...pointers
  }

  const nameUpdateTx = await _buildTx(TX_TYPE.nameUpdate, {
    clientTtl: CLIENT_TTL,
    nameTtl: NAME_TTL,
    ...options,
    nameId: name,
    accountId: await options.onAccount.address(options),
    pointers: Object.entries(allPointers).map(([key, id]) => ({ key, id: id.toString() }))
  })

  return await send(nameUpdateTx, options)
}

/**
 * Transfer a domain to another account
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
export async function aensTransfer (
  name: AensName,
  account: EncodedData<'ak'>,
  options: BuildTxOptions<TX_TYPE.nameTransfer, 'nameId' | 'accountId' | 'recipientId'>
  & Parameters<typeof send>[1]
): ReturnType<typeof send> {
  const nameTransferTx = await _buildTx(TX_TYPE.nameTransfer, {
    ...options,
    nameId: name,
    accountId: await options.onAccount.address(options),
    recipientId: account
  })

  return await send(nameTransferTx, options)
}

/**
 * Query the AENS name info from the node
 * and return the object with info and predefined functions for manipulating name
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
export async function aensQuery (
  name: AensName,
  opt: Parameters<typeof getName>[1] & Parameters<typeof aensUpdate>[2]
  & Parameters<typeof aensTransfer>[2]
): Promise<Readonly<
  TransformNodeType<NameEntry> & {
    id: EncodedData<'nm'>
    owner: EncodedData<'ak'>
    pointers: KeyPointers | Pointer[]
    ttl: number
    update: (
      pointers: KeyPointers,
      options?: Omit<Parameters<typeof aensQuery>[1], 'onNode' | 'onCompiler' | 'onAccount'> & {
        onAccount?: AccountBase
      }
    ) => ReturnType<typeof aensUpdate> & ReturnType<typeof aensQuery>
    transfer: (
      account: EncodedData<'ak'>,
      options?: Parameters<typeof aensQuery>[1]
    ) => ReturnType<typeof aensUpdate> & ReturnType<typeof aensQuery>
    revoke: (options?: Omit<Parameters<typeof aensRevoke>[1], 'onNode' | 'onCompiler' | 'onAccount'> & {
      onAccount?: AccountBase
    }
    ) => ReturnType<typeof aensRevoke>
    extendTtl: (
      nameTtl: number,
      options?: Omit<Parameters<typeof aensQuery>[1], 'onNode' | 'onCompiler' | 'onAccount'>
    ) => ReturnType<typeof aensUpdate> & ReturnType<typeof aensQuery>
  }
  >> {
  const nameEntry = await getName(name, opt)
  return Object.freeze({
    ...nameEntry,
    id: nameEntry.id as EncodedData<'nm'>,
    owner: nameEntry.owner as EncodedData<'ak'>,
    async update (pointers, options) {
      return {
        ...await aensUpdate(name, pointers, { ...opt, ...options }),
        ...await aensQuery(name, { ...opt, ...options })
      }
    },
    async transfer (account, options) {
      return {
        ...await aensTransfer(name, account, { ...opt, ...options }),
        ...await aensQuery(name, { ...opt, ...options })
      }
    },
    async revoke (options) {
      return await aensRevoke(name, { ...opt, ...options })
    },
    async extendTtl (nameTtl = NAME_TTL, options) {
      if (nameTtl > NAME_TTL || nameTtl <= 0) {
        throw new ArgumentError('nameTtl', `a number between 1 and ${NAME_TTL} blocks`, nameTtl)
      }

      return {
        ...await aensUpdate(name, {}, { ...opt, ...options, nameTtl, extendPointers: true }),
        ...await aensQuery(name, { ...opt, ...options })
      }
    }
  })
}

/**
 * Claim a previously preclaimed registration. This can only be done after the
 * preclaim step
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
export async function aensClaim (
  name: AensName,
  salt: number,
  options: BuildTxOptions<TX_TYPE.nameClaim, 'accountId' | 'nameSalt' | 'name'>
  & Parameters<typeof send>[1] & Parameters<typeof aensQuery>[1]
): Promise<Awaited<ReturnType<typeof send>> & Partial<Awaited<ReturnType<typeof aensQuery>>>> {
  const claimTx = await _buildTx(TX_TYPE.nameClaim, {
    ...options,
    accountId: await options.onAccount.address(options),
    nameSalt: salt,
    name
  })

  const result = await send(claimTx, options)
  if (!isAuctionName(name)) {
    const nameInter = result.blockHeight != null && result.blockHeight > 0
      ? await aensQuery(name, options)
      : {}
    return Object.assign(result, nameInter)
  }
  return result
}

/**
 * Preclaim a name. Sends a hash of the name and a random salt to the node
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
export async function aensPreclaim (
  name: AensName,
  options: BuildTxOptions<TX_TYPE.namePreClaim, 'accountId' | 'commitmentId'>
  & Parameters<typeof send>[1] & Parameters<typeof aensClaim>[2]
): Promise<Readonly<
  Awaited<ReturnType<typeof send>> & {
    height: number
    salt: number
    commitmentId: string
    claim: (opts?: Parameters<typeof aensClaim>[2]) => ReturnType<typeof aensClaim>
  }
  >> {
  const _salt = salt()
  const currentHeight = await height(options)
  const commitmentId = commitmentHash(name, _salt)

  const preclaimTx = await _buildTx(TX_TYPE.namePreClaim, {
    ...options,
    accountId: await options.onAccount.address(options),
    commitmentId
  })

  return Object.freeze({
    ...await send(preclaimTx, options),
    height: currentHeight,
    salt: _salt,
    commitmentId,
    async claim (opts) {
      return await aensClaim(name, _salt, { ...options, ...opts })
    }
  })
}

/**
 * Bid to name auction
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
export async function aensBid (
  name: AensName,
  nameFee: number | string | BigNumber,
  options: Omit<Parameters<typeof aensClaim>[2], 'nameFee'>
): ReturnType<typeof aensClaim> {
  return await aensClaim(name, 0, { ...options, nameFee })
}
