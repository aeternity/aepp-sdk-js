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
 * @example import Aens from '@aeternity/aepp-sdk/es/ae/aens'
 */

import * as R from 'ramda'
import { encodeBase58Check, salt } from '../utils/crypto'
import { commitmentHash, prelimaCommitmentHash, isNameValid, getMinimumNameFee } from '../tx/builder/helpers'
import Ae from './'
import { CLIENT_TTL, NAME_FEE, NAME_TTL } from '../tx/builder/schema'

/**
 * Transfer a domain to another account
 * @instance
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @category async
 * @param {String} nameId
 * @param {String} account
 * @param {Object} [options={}]
 * @return {Promise<Object>}
 */
async function transfer (nameId, account, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)

  const nameTransferTx = await this.nameTransferTx(R.merge(opt, {
    nameId,
    accountId: await this.address(opt),
    recipientId: account
  }))

  return this.send(nameTransferTx, opt)
}

/**
 * Revoke a domain
 * @instance
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @category async
 * @param {String} nameId
 * @param {Object} [options={}]
 * @return {Promise<Object>}
 */
async function revoke (nameId, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)

  const nameRevokeTx = await this.nameRevokeTx(R.merge(opt, {
    nameId,
    accountId: await this.address(opt)
  }))

  return this.send(nameRevokeTx, opt)
}

/**
 * What kind of a hash is this? If it begins with 'ak_' it is an
 * account key, if with 'ok_' it's an oracle key.
 *
 * @param s - the hash.
 * returns the type, or throws an exception if type not found.
 */
function classify (s) {
  const keys = {
    ak: 'account_pubkey',
    ok: 'oracle_pubkey',
    ct: 'contract_pubkey',
    ch: 'channel'
  }

  if (!s.match(/^[a-z]{2}_.+/)) {
    throw Error('Not a valid hash')
  }

  const klass = s.substr(0, 2)
  if (klass in keys) {
    return keys[klass]
  } else {
    throw Error(`Unknown class ${klass}`)
  }
}

/**
 * Update an aens entry
 * @instance
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @param nameId domain hash
 * @param target new target
 * @param options
 * @return {Object}
 */
async function update (nameId, target, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const nameUpdateTx = await this.nameUpdateTx(R.merge(opt, {
    nameId: nameId,
    accountId: await this.address(opt),
    pointers: [R.fromPairs([['id', target], ['key', classify(target)]])]
  }))

  return this.send(nameUpdateTx, opt)
}

/**
 * Query the status of an AENS registration
 * @instance
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @param {string} name
 * @param {Object} opt Options
 * @return {Promise<Object>}
 */
async function query (name, opt = {}) {
  isNameValid(name)
  const o = await this.getName(name)
  const nameId = o.id

  return Object.freeze(Object.assign(o, {
    pointers: o.pointers || {},
    update: async (target, options) => {
      return {
        ...(await this.aensUpdate(nameId, target, R.merge(opt, options))),
        ...(await this.aensQuery(name))
      }
    },
    transfer: async (account, options) => {
      return {
        ...(await this.aensTransfer(nameId, account, R.merge(opt, options))),
        ...(await this.aensQuery(name))
      }
    },
    revoke: async (options) => this.aensRevoke(nameId, R.merge(opt, options))
  }))
}

/**
 * Claim a previously preclaimed registration. This can only be done after the
 * preclaim step
 * @instance
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @param {String} name
 * @param {Number} salt
 * @param {Record} [options={}]
 * @param {Number|String} [options.nameFee] Name Fee
 * @return {Promise<Object>} the result of the claim
 */
async function claim (name, salt, options = {}) {
  // Todo remove cross compatibility
  const { version } = this.getNodeInfo()
  const [majorVersion] = version.split('.')
  const vsn = +majorVersion === 5 && version !== '5.0.0-rc.1' ? 2 : 1
  options.vsn = options.vsn || vsn

  isNameValid(name)
  const opt = R.merge(this.Ae.defaults, options)

  // TODO remove cross compatibility
  if (opt.vsn === 2) {
    const minNameFee = getMinimumNameFee(name)
    if (opt.nameFee !== this.Ae.defaults.nameFee && minNameFee.gt(opt.nameFee)) {
      throw new Error(`the provided fee ${opt.nameFee} is not enough to execute the claim, required: ${minNameFee}`)
    }
    opt.nameFee = opt.nameFee !== this.Ae.defaults.nameFee ? opt.nameFee : minNameFee
  }
  const claimTx = await this.nameClaimTx(R.merge(opt, {
    accountId: await this.address(opt),
    nameSalt: salt,
    name: `nm_${encodeBase58Check(Buffer.from(name))}`
  }))

  const result = await this.send(claimTx, opt)
  if (opt.vsn === 1 || name.length - 4 > 12) {
    const nameInter = this.Chain.defaults.waitMined ? await this.aensQuery(name, opt) : {}
    return Object.assign(result, nameInter)
  }
  return result
}

/**
 * Preclaim a name. Sends a hash of the name and a random salt to the node
 * @instance
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/aens
 * @param {string} name
 * @param {Record} [options={}]
 * @return {Promise<Object>}
 */
async function preclaim (name, options = {}) {
  // TODO remove cross compatibility
  const { version } = this.getNodeInfo()
  const [majorVersion] = version.split('.')
  const vsn = +majorVersion === 5 && version !== '5.0.0-rc.1' ? 2 : 1

  isNameValid(name)
  const opt = R.merge(this.Ae.defaults, options)
  const _salt = salt()
  const height = await this.height()
  const hash = vsn === 1
    ? await prelimaCommitmentHash(name, _salt)
    : await commitmentHash(name, _salt)

  const preclaimTx = await this.namePreclaimTx(R.merge(opt, {
    accountId: await this.address(opt),
    commitmentId: hash
  }))

  const result = await this.send(preclaimTx, opt)

  return Object.freeze({
    ...result,
    height,
    claim: options => this.aensClaim(name, _salt, { ...options, onAccount: opt.onAccount, vsn }),
    salt: _salt,
    commitmentId: hash
  })
}

async function bid (name, nameFee = NAME_FEE, options = {}) {
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
        nameTtl: NAME_TTL, // aec_governance:name_claim_max_expiration() => 50000
        nameFee: NAME_FEE
      }
    }
  }
})

export default Aens
