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
 * Transaction module
 * @module @aeternity/aepp-sdk/es/tx/tx
 * @export Transaction
 * @example import Transaction from '@aeternity/aepp-sdk/es/tx/tx'
 */

import * as R from 'ramda'
import Tx from './'
import Node from '../node'

import { buildTx, calculateFee } from './builder'
import { MIN_GAS_PRICE, PROTOCOL_VM_ABI, TX_TYPE } from './builder/schema'
import { buildContractId, oracleQueryId } from './builder/helpers'

const NODE_METHOD_NAME = {
  [TX_TYPE.spend]: 'postSpend',
  [TX_TYPE.namePreClaim]: 'postNamePreclaim',
  [TX_TYPE.nameClaim]: 'postNameClaim',
  [TX_TYPE.nameTransfer]: 'postNameTransfer',
  [TX_TYPE.nameUpdate]: 'postNameUpdate',
  [TX_TYPE.nameRevoke]: 'postNameRevoke',
  [TX_TYPE.contractCreate]: 'postContractCreate',
  [TX_TYPE.contractCall]: 'postContractCall',
  [TX_TYPE.oracleRegister]: 'postOracleRegister',
  [TX_TYPE.oracleExtend]: 'postOracleExtend',
  [TX_TYPE.oracleQuery]: 'postOracleQuery',
  [TX_TYPE.oracleResponse]: 'postOracleRespond',
  [TX_TYPE.channelCloseSolo]: 'postChannelCloseSolo',
  [TX_TYPE.channelSlash]: 'postChannelSlash',
  [TX_TYPE.channelSettle]: 'postChannelSettle',
  [TX_TYPE.channelSnapshotSolo]: 'postChannelSnapshotSolo'
}

const ACCOUNT_ID_FIELD_NAME = {
  [TX_TYPE.spend]: 'senderId',
  [TX_TYPE.namePreClaim]: 'accountId',
  [TX_TYPE.nameClaim]: 'accountId',
  [TX_TYPE.nameTransfer]: 'accountId',
  [TX_TYPE.nameUpdate]: 'accountId',
  [TX_TYPE.nameRevoke]: 'accountId',
  [TX_TYPE.contractCreate]: 'ownerId',
  [TX_TYPE.contractCall]: 'callerId',
  [TX_TYPE.oracleRegister]: 'accountId',
  [TX_TYPE.oracleExtend]: 'callerId',
  [TX_TYPE.oracleQuery]: 'senderId',
  [TX_TYPE.oracleResponse]: 'callerId',
  [TX_TYPE.channelCloseSolo]: 'fromId',
  [TX_TYPE.channelSlash]: 'fromId',
  [TX_TYPE.channelSettle]: 'fromId',
  [TX_TYPE.channelSnapshotSolo]: 'fromId'
}

function getTxBuilder (txType, fieldsMapper = a => a) {
  return async function (options) {
    let fields = await Promise.resolve(fieldsMapper.call(this, options))
    // Calculate fee, get absolute ttl (ttl + height), get account nonce
    const { fee, ttl, nonce } = await this.prepareTxParams(txType, fields)

    fields = { ...fields, nonce, ttl, fee }
    // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
    const { tx } = this.nativeMode
      ? buildTx(fields, txType)
      : await this.api[NODE_METHOD_NAME[txType]]({
        ...fields,
        ...fields.amount && { amount: parseInt(fields.amount) },
        ...fields.fee && { fee: parseInt(fields.fee) },
        ...fields.gas && { gas: parseInt(fields.gas) },
        ...fields.initiatorAmountFinal && { initiatorAmountFinal: parseInt(fields.initiatorAmountFinal) },
        ...fields.responderAmountFinal && { responderAmountFinal: parseInt(fields.responderAmountFinal) }
      })

    return tx
  }
}

const spendTx = getTxBuilder(
  TX_TYPE.spend,
  ({ payload = '', ...otherFields }) => ({ payload, ...otherFields })
)

const namePreclaimTx = getTxBuilder(TX_TYPE.namePreClaim)
const nameClaimTx = getTxBuilder(TX_TYPE.nameClaim)
const nameTransferTx = getTxBuilder(TX_TYPE.nameTransfer)
const nameUpdateTx = getTxBuilder(TX_TYPE.nameUpdate)
const nameRevokeTx = getTxBuilder(TX_TYPE.nameRevoke)

const contractCreateTx = getTxBuilder(
  TX_TYPE.contractCreate,
  async function ({ ownerId, gasPrice = MIN_GAS_PRICE, ...otherFields }) {
    const ctVersion = this.getVmVersion(TX_TYPE.contractCreate, arguments[0])
    return ({
      ownerId,
      gasPrice,
      ...otherFields,
      ctVersion,
      vmVersion: ctVersion.vmVersion,
      abiVersion: ctVersion.abiVersion,
      contractId: buildContractId(
        ownerId,
        (await this.prepareTxParams(TX_TYPE.oracleQuery, arguments[0])).nonce
      )
    })
  }
)

const contractCallTx = getTxBuilder(
  TX_TYPE.contractCall,
  function ({ gasPrice = MIN_GAS_PRICE, ...otherFields }) {
    const ctVersion = this.getVmVersion(TX_TYPE.contractCreate, arguments[0])
    return ({
      gasPrice,
      ...otherFields,
      abiVersion: ctVersion.abiVersion
    })
  }
)

const oracleRegisterTx = getTxBuilder(
  TX_TYPE.oracleRegister,
  function (fields) {
    const ctVersion = this.getVmVersion(TX_TYPE.oracleRegister, arguments[0])
    return ({
      ...fields,
      abiVersion: ctVersion.abiVersion
    })
  }
)

const oracleExtendTx = getTxBuilder(TX_TYPE.oracleExtend)
async function oraclePostQueryTx ({ senderId, oracleId, ...otherFields }) {
  return {
    tx: await getTxBuilder(TX_TYPE.oracleQuery).call(this, arguments[0]),
    queryId: oracleQueryId(
      senderId,
      (await this.prepareTxParams(TX_TYPE.oracleQuery, arguments[0])).nonce,
      oracleId
    )
  }
}
const oracleRespondTx = getTxBuilder(TX_TYPE.oracleResponse)

const channelCloseSoloTx = getTxBuilder(TX_TYPE.channelCloseSolo)
const channelSlashTx = getTxBuilder(TX_TYPE.channelSlash)
const channelSettleTx = getTxBuilder(TX_TYPE.channelSettle)
const channelSnapshotSoloTx = getTxBuilder(TX_TYPE.channelSnapshotSolo)

/**
 * Validated vm/abi version or get default based on transaction type and NODE version
 *
 * @param {string} txType Type of transaction
 * @param {object} vmAbi Object with vm and abi version fields
 * @return {object} Object with vm/abi version ({ vmVersion: number, abiVersion: number })
 */
function getVmVersion (txType, { vmVersion, abiVersion } = {}) {
  const version = this.consensusProtocolVersion
  const supportedProtocol = PROTOCOL_VM_ABI[version]
  if (!supportedProtocol) throw new Error('Not supported consensus protocol version')
  const protocolForTX = supportedProtocol[txType]
  if (!protocolForTX) throw new Error('Not supported tx type')

  const ctVersion = {
    abiVersion: abiVersion !== undefined ? abiVersion : protocolForTX.abiVersion[0],
    vmVersion: vmVersion !== undefined ? vmVersion : protocolForTX.vmVersion[0]
  }
  if (protocolForTX.vmVersion.length && !R.contains(ctVersion.vmVersion, protocolForTX.vmVersion)) throw new Error(`VM VERSION ${ctVersion.vmVersion} do not support by this node. Supported: [${protocolForTX.vmVersion}]`)
  if (!R.contains(ctVersion.abiVersion, protocolForTX.abiVersion)) throw new Error(`ABI VERSION ${ctVersion.abiVersion} do not support by this node. Supported: [${protocolForTX.abiVersion}]`)

  return ctVersion
}

/**
 * Compute the absolute ttl by adding the ttl to the current height of the chain
 *
 * @param {number} ttl
 * @param {boolean} relative ttl is absolute or relative(default: true(relative))
 * @return {number} Absolute Ttl
 */
async function calculateTtl (ttl = 0, relative = true) {
  if (ttl === 0) return 0
  if (ttl < 0) throw new Error('ttl must be greater than 0')

  if (relative) {
    const { height } = await this.api.getCurrentKeyBlock()
    return +(height) + ttl
  }
  return ttl
}

/**
 * Get the next nonce to be used for a transaction for an account
 *
 * @param {string} accountId
 * @param {number} nonce
 * @return {number} Next Nonce
 */
async function getAccountNonce (accountId, nonce) {
  if (nonce) return nonce
  const { nonce: accountNonce } = await this.api.getAccountByPubkey(accountId).catch(() => ({ nonce: 0 }))
  return accountNonce + 1
}

/**
 * Calculate fee, get absolute ttl (ttl + height), get account nonce
 *
 * @param {String} txType Type of transaction
 * @param {Object} params Object which contains all tx data
 * @return {Object} { ttl, nonce, fee } Object with account nonce, absolute ttl and transaction fee
 */
async function prepareTxParams (txType, { nonce: n, ttl: t, fee: f, gas, absoluteTtl }) {
  const nonce = await this.getAccountNonce(arguments[1][ACCOUNT_ID_FIELD_NAME[txType]], n)
  const ttl = await (calculateTtl.bind(this)(t, !absoluteTtl))
  const fee = calculateFee(f, txType, { showWarning: this.showWarning, gas, params: { ...arguments[1], nonce, ttl } })
  return { fee, ttl, nonce }
}

/**
 * Transaction Stamp
 *
 * This is implementation of [Tx](api/tx.md) relays
 * the creation of transactions to {@link module:@aeternity/aepp-sdk/es/Node}.
 * This stamp provide ability to create native transaction's,
 * or transaction's using Node API.
 * As there is no built-in security between Node and client communication,
 * creating transaction using {@link module:@aeternity/aepp-sdk/es/Node} API
 * must never be used for production but can be very useful to verify other
 * implementations.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/tx
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Boolean} [options.nativeMode=true] options.nativeMode - Use Native build of transaction's
 * @param {String} options.url - Node url
 * @param {String} options.internalUrl - Node internal url
 * @return {Object} Transaction instance
 * @example Transaction({url: 'https://sdk-testnet.aepps.com/'})
 */
const Transaction = Node.compose(Tx, {
  init ({ nativeMode = true, showWarning = false }) {
    this.nativeMode = nativeMode
    this.showWarning = showWarning
  },
  props: {
    nativeMode: null,
    showWarning: null
  },
  methods: {
    spendTx,
    namePreclaimTx,
    nameClaimTx,
    nameTransferTx,
    nameUpdateTx,
    nameRevokeTx,
    contractCreateTx,
    contractCallTx,
    prepareTxParams,
    oracleRegisterTx,
    oracleExtendTx,
    oraclePostQueryTx,
    oracleRespondTx,
    channelCloseSoloTx,
    channelSlashTx,
    channelSettleTx,
    channelSnapshotSoloTx,
    getAccountNonce,
    getVmVersion
  }
})

export default Transaction
