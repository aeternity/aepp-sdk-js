/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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
 * Aens module - routines to interact with the æternity naming system
 *
 * The high-level description of the naming system is
 * https://github.com/aeternity/protocol/blob/master/AENS.md in the protocol
 * repository.
 * @module @aeternity/aepp-sdk/es/ae/aens
 * @export Aens
 * @example import { Aens } from '@aeternity/aepp-sdk'
 */

import { salt } from '../utils/crypto'
import { commitmentHash, ensureNameValid, isAuctionName } from '../tx/builder/helpers'
import Ae from './'
import { CLIENT_TTL, NAME_TTL, TX_TYPE } from '../tx/builder/schema'
import { ArgumentError } from '../utils/errors'

/**
 * Revoke a name
 * @instance
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @category async
 * @param {String} name Name hash
 * @param {Object} [options={}] options
 * @param {String|Object} [options.onAccount] Make operation on specific account from sdk (you pass
 * publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param {Number|String|BigNumber} [options.fee] fee
 * @param {Number|String|BigNumber} [options.ttl] ttl
 * @param {Number|String|BigNumber} [options.nonce] nonce
 * @return {Promise<Object>} Transaction result
 * @example
 * const name = 'test.chain'
 * const nameObject = await sdkInstance.aensQuery(name)
 *
 * await sdkInstance.aensRevoke(name, { fee, ttl , nonce })
 * // or
 * await nameObject.revoke({ fee, ttl, nonce })
 */
async function revoke (name, options = {}) {
  ensureNameValid(name)
  const opt = { ...this.Ae.defaults, ...options }

  const nameRevokeTx = await this.buildTx(TX_TYPE.nameRevoke, {
    ...opt,
    nameId: name,
    accountId: await this.address(opt)
  })

  return this.send(nameRevokeTx, opt)
}

/**
 * Update a name
 * @instance
 * @function
 * @category async
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @param {String} name AENS name
 * @param {Object.<string, string>} pointers Map of pointer keys to corresponding addresses
 * @param {Object} [options={}]
 * @param {Boolean} [options.extendPointers] Get the pointers from the node and merge with provided
 * ones. Pointers with the same type will be overwritten
 * @param {String|Object} [options.onAccount] Make operation on specific account from sdk (you
 * pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param {Number|String|BigNumber} [options.fee] fee
 * @param {Number|String|BigNumber} [options.ttl] ttl
 * @param {Number|String|BigNumber} [options.nonce] nonce
 * @param {Number|String|BigNumber} [options.nameTtl=50000] Name ttl represented in number of
 * blocks (Max value is 50000 blocks)
 * @param {Number|String|BigNumber} [options.clientTtl=84600] a suggestion as to how long any
 * clients should cache this information
 * @return {Promise<Object>}
 * @throws Invalid pointer array error
 * @example
 * const name = 'test.chain'
 * const pointersArray = ['ak_asd23dasdas...,' 'ct_asdf34fasdasd...']
 * const nameObject = await sdkInstance.aensQuery(name)
 *
 * await sdkInstance.aensUpdate(name, pointersArray, { nameTtl, ttl, fee, nonce, clientTtl })
 * // or
 * await nameObject.update(pointers, { nameTtl, ttl, fee, nonce, clientTtl })
 */
async function update (name, pointers = {}, options = {}) {
  ensureNameValid(name)
  const opt = { ...this.Ae.defaults, ...options }
  const allPointers = {
    ...options.extendPointers && Object.fromEntries(
      (await this.getName(name)).pointers.map(({ key, id }) => [key, id])
    ),
    ...pointers
  }

  const nameUpdateTx = await this.buildTx(TX_TYPE.nameUpdate, {
    ...opt,
    nameId: name,
    accountId: await this.address(opt),
    pointers: Object.entries(allPointers).map(([key, id]) => ({ key, id }))
  })

  return this.send(nameUpdateTx, opt)
}

/**
 * Transfer a domain to another account
 * @instance
 * @function
 * @category async
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @param {String} name AENS name
 * @param {String} account Recipient account publick key
 * @param {Object} [options={}]
 * @param {String|Object} [options.onAccount] Make operation on specific account from sdk (you pass
 * publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param {Number|String|BigNumber} [options.fee] fee
 * @param {Number|String|BigNumber} [options.ttl] ttl
 * @param {Number|String|BigNumber} [options.nonce] nonce
 * @return {Promise<Object>} Transaction result
 * @example
 * const name = 'test.chain'
 * const recipientPub = 'ak_asd23dasdas...'
 * const nameObject = await sdkInstance.aensQuery(name)
 *
 * await sdkInstance.aensTransfer(name, recipientPub, { ttl, fee, nonce })
 * // or
 * await nameObject.transfer(recipientPub, { ttl, fee, nonce })
 */
async function transfer (name, account, options = {}) {
  ensureNameValid(name)
  const opt = { ...this.Ae.defaults, ...options }

  const nameTransferTx = await this.buildTx(TX_TYPE.nameTransfer, {
    ...opt,
    nameId: name,
    accountId: await this.address(opt),
    recipientId: account
  })

  return this.send(nameTransferTx, opt)
}

/**
 * Query the AENS name info from the node
 * and return the object with info and predefined functions for manipulating name
 * @instance
 * @function
 * @category async
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @param {String} name
 * @param {Object} opt Options
 * @return {Promise<Object>}
 * @example
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
 */
async function query (name, opt = {}) {
  ensureNameValid(name)
  const o = await this.getName(name)

  return Object.freeze(Object.assign(o, {
    pointers: o.pointers || [],
    update: async (pointers, options = {}) => {
      return {
        ...(await this.aensUpdate(name, pointers, { ...opt, ...options })),
        ...(await this.aensQuery(name))
      }
    },
    transfer: async (account, options = {}) => {
      return {
        ...(await this.aensTransfer(name, account, { ...opt, ...options })),
        ...(await this.aensQuery(name))
      }
    },
    revoke: async (options = {}) => this.aensRevoke(name, { ...opt, ...options }),
    extendTtl: async (nameTtl = NAME_TTL, options = {}) => {
      if (typeof nameTtl !== 'number' || nameTtl > NAME_TTL || nameTtl <= 0) {
        throw new ArgumentError('nameTtl', `a number between 1 and ${NAME_TTL} blocks`, nameTtl)
      }

      return {
        ...await this.aensUpdate(name, {}, { ...opt, ...options, nameTtl, extendPointers: true }),
        ...await this.aensQuery(name)
      }
    }
  }))
}

/**
 * Claim a previously preclaimed registration. This can only be done after the
 * preclaim step
 * @instance
 * @function
 * @category async
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @param {String} name
 * @param {Number} salt Salt from pre-claim, or 0 if it's a bid
 * @param {Object} [options] options
 * @param {String|Object} [options.onAccount] Make operation on specific account from sdk (you pass
 * publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param {Number|String|BigNumber} [options.fee] fee
 * @param {Number|String|BigNumber} [options.ttl] ttl
 * @param {Number|String|BigNumber} [options.nonce] nonce
 * @param {Number|String} [options.nameFee] Name Fee (By default calculated by sdk)
 * @return {Promise<Object>} the result of the claim
 * @example
 * const name = 'test.chain'
 * const salt = preclaimResult.salt // salt from pre-claim transaction
 *
 * await sdkInstance.aensClaim(name, salt, { ttl, fee, nonce, nameFee })
 */
async function claim (name, salt, options) {
  ensureNameValid(name)
  const opt = { ...this.Ae.defaults, ...options }

  const claimTx = await this.buildTx(TX_TYPE.nameClaim, {
    ...opt,
    accountId: await this.address(opt),
    nameSalt: salt,
    name
  })

  const result = await this.send(claimTx, opt)
  if (!isAuctionName(name)) {
    const nameInter = result.blockHeight ? await this.aensQuery(name, opt) : {}
    return Object.assign(result, nameInter)
  }
  return { ...result, nameFee: opt.nameFee }
}

/**
 * Preclaim a name. Sends a hash of the name and a random salt to the node
 * @instance
 * @function
 * @category async
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @param {String} name
 * @param {Object} [options={}]
 * @param {String|Object} [options.onAccount] Make operation on specific account from sdk (you pass
 * publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param {Number|String|BigNumber} [options.fee] fee
 * @param {Number|String|BigNumber} [options.ttl] ttl
 * @param {Number|String|BigNumber} [options.nonce] nonce
 * @return {Promise<Object>}
 * @example
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
 */
async function preclaim (name, options = {}) {
  ensureNameValid(name)
  const opt = { ...this.Ae.defaults, ...options }
  const _salt = salt()
  const height = await this.height()
  const commitmentId = commitmentHash(name, _salt)

  const preclaimTx = await this.buildTx(TX_TYPE.namePreClaim, {
    ...opt,
    accountId: await this.address(opt),
    commitmentId
  })

  const result = await this.send(preclaimTx, opt)

  return Object.freeze({
    ...result,
    height,
    claim: options => this.aensClaim(name, _salt, { ...options, onAccount: opt.onAccount }),
    salt: _salt,
    commitmentId
  })
}

/**
 * Bid to name auction
 * @instance
 * @function
 * @category async
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @param {String} name Domain name
 * @param {String|Number} nameFee Name fee (bid fee)
 * @param {Object} [options={}]
 * @param {String|Object} [options.onAccount] Make operation on specific account from sdk (you pass
 * publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount)
 * @param {Number|String|BigNumber} [options.fee] fee
 * @param {Number|String|BigNumber} [options.ttl] ttl
 * @param {Number|String|BigNumber} [options.nonce] nonce
 * @return {Promise<Object>} Transaction result
 * @example
 * const name = 'test.chain'
 * const bidFee = computeBidFee(name, startFee, incrementPercentage)
 *
 * await sdkInstance.aensBid(name, 213109412839123, { ttl, fee, nonce })
 */
async function bid (name, nameFee, options = {}) {
  return this.aensClaim(name, 0, { ...options, nameFee, vsn: 2 })
}

/**
 * Aens Stamp
 *
 * Aens provides name-system related methods atop
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} clients.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Aens instance
 */
const Aens = Ae.compose({
  methods: {
    aensQuery: query,
    aensPreclaim: preclaim,
    aensClaim: claim,
    aensUpdate: update,
    aensTransfer: transfer,
    aensRevoke: revoke,
    aensBid: bid
  },
  deepProps: {
    Ae: {
      defaults: {
        clientTtl: CLIENT_TTL,
        nameTtl: NAME_TTL // aec_governance:name_claim_max_expiration() => 50000
      }
    }
  }
})

export default Aens
