/*
 * ISC License (ISC)
 * Copyright (c) 2021 aeternity developers
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
 * Contract module - routines to interact with the æternity contract
 *
 * High level documentation of the contracts are available at
 * https://github.com/aeternity/protocol/tree/master/contracts and
 *
 * @module @aeternity/aepp-sdk/es/ae/contract
 * @export Contract
 * @example import { Contract } from '@aeternity/aepp-sdk'
 */

import Ae from './'
import ContractCompilerHttp from '../contract/compiler'
import getContractInstance from '../contract/aci'
import { AMOUNT, DEPOSIT, MIN_GAS_PRICE } from '../tx/builder/schema'
import { decode, produceNameId } from '../tx/builder/helpers'

/**
 * Static contract call(using dry-run)
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @deprecated
 * @param {String} source Contract source code
 * @param {String} contractAddress Contract address
 * @param {String} name Name of function to call
 * @param {Array} args Arguments array for call/deploy transaction
 * @param {Object} [options]
 * @param {Number|String} [options.top] Block height or hash on which you want to call contract
 * @param {String} [options.bytecode] Block hash on which you want to call contract
 * @param {Object} [options.filesystem] Contract external namespaces map
 * @return {Promise<Object>} Result object
 * @example
 * const callResult = await client.contractCallStatic(source, address, fnName, args)
 * {
 *   result: TX_DATA,
 *   decode: (type) => Decode call result
 * }
 */
async function contractCallStatic (source, contractAddress, name, args = [], options) {
  const contract = await this.getContractInstance({ ...options, source, contractAddress })
  return contract.call(name, args, { ...options, callStatic: true })
}

/**
 * Deploy contract to the node
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @deprecated
 * @param {String} code Compiled contract
 * @param {String} source Contract source code
 * @param {Array} params Arguments of contract constructor(init) function. Can be array of
 * arguments or callData string
 * @param {Object} [options] Transaction options (fee, ttl, gas, amount, deposit)
 * @param {Object} [options.filesystem={}] Contract external namespaces map*
 * @return {Promise<Object>} Result object
 * @example
 * const deployed = await client.contractDeploy(bytecode, source, init = [], options)
 * {
 *   owner: OWNER_PUB_KEY,
 *   transaction: TX_HASH,
 *   address: CONTRACT_ADDRESS,
 *   createdAt: Date,
 *   result: DEPLOY_TX_DATA,
 *   call: (fnName, args = [], options) => Call contract function,
 *   callStatic: (fnName, args = [], options) => Static all contract function
 * }
 */
async function contractDeploy (code, source, params, options) {
  const contract = await this.getContractInstance({ ...options, source })
  contract.bytecode = code
  return contract.deploy(params, options)
}

/**
 * Compile contract source code
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} code Contract source code
 * @param {Object} [options={}] Transaction options (fee, ttl, gas, amount, deposit)
 * @param {Object} [options.filesystem={}] Contract external namespaces map*
 * @return {Promise<Object>} Result object
 * @example
 * const compiled = await client.contractCompile(SOURCE_CODE)
 * {
 *   bytecode: CONTRACT_BYTE_CODE,
 *   deploy: (init = [], options = {}) => Deploy Contract
 * }
 */
async function contractCompile (code, options = {}) {
  const opt = { ...this.Ae.defaults, ...options }
  const { bytecode } = await this.compilerApi.compileContract({ code, options })
  return Object.freeze({
    deploy: (init, options) => this.contractDeploy(bytecode, code, init, { ...opt, ...options }),
    deployStatic: (init, options) => this.contractCallStatic(code, null, 'init', init, {
      ...opt,
      ...options,
      bytecode
    }),
    bytecode
  })
}

/**
 * Utility method to create a delegate signature for a contract
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String[]} ids The list of id's to prepend
 * @param {Object} [opt={}] options
 * @param {{ onAccount: String | Object }} [opt={}] opt Options
 * @return {Promise<String>} Signature in hex representation
 */
async function delegateSignatureCommon (ids = [], opt = {}) {
  const signature = await this.sign(
    Buffer.concat([
      Buffer.from(this.getNetworkId(opt)),
      ...(Object.prototype.hasOwnProperty.call(opt, 'onAccount') ? [decode(await this.address(opt))] : []),
      ...ids.map(e => decode(e))
    ]),
    opt
  )
  return Buffer.from(signature).toString('hex')
}

/**
 * Helper to generate a signature to delegate pre-claim/claim/transfer/revoke of a name to
 * a contract.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} contractId Contract Id
 * @param {String} [name] The name
 * @param {{ onAccount: String | Object }} [opt={}] opt Options
 * @return {Promise<String>} Signature for delegation
 * @example
 * const client = await Universal({ ... })
 * const contractId = 'ct_asd2ks...' // contract address
 * const name = 'example.chain' // AENS name
 * const onAccount = await client.address() // Sign with a specific account
 * // Preclaim signature
 * const params = { contractId }
 * const preclaimSig = await client.createAensDelegationSignature(params, { onAccount: current })
 * // Claim, transfer and revoke signature
 * const params = { contractId, name }
 * const aensDelegationSig = await contract.createAensDelegationSignature(
 *   params, name, { onAccount: current }
 * )
 */
async function createAensDelegationSignature ({ contractId, name }, opt = {}) {
  return this.delegateSignatureCommon([...name ? [produceNameId(name)] : [], contractId], opt)
}

/**
 * Helper to generate a signature to delegate register/extend/respond of a Oracle to a contract.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} contractId Contract Id
 * @param {String} [queryId] Oracle Query Id
 * @param {{ onAccount: String | Object }} [opt={}] opt Options
 * @return {Promise<String>} Signature for delegation
 * @example
 * const client = await Universal({ ... })
 * const contractId = 'ct_asd2ks...' // contract address
 * const queryId = 'oq_...' // Oracle Query Id
 * const onAccount = await client.address() // Sign with a specific account
 * // Oracle register and extend signature
 * const params = { contractId }
 * const oracleDelegationSig = await contract.createOracleDelegationSignature(params, { onAccount })
 * // Oracle respond signature
 * const params = { contractId, queryId }
 * const respondSig = await contract.createOracleDelegationSignature(params, queryId)
 */
async function createOracleDelegationSignature ({ contractId, queryId }, opt = {}) {
  return this.delegateSignatureCommon([...queryId ? [queryId] : [], contractId], opt)
}

/**
 * Contract Stamp
 *
 * Provide contract implementation
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} clients.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Contract instance
 * @example
 * import { Transaction, MemoryAccount, ChainNode } from '@aeternity/aepp-sdk
 *
 * const ContractWithAE = await Contract
 *    .compose(Transaction, MemoryAccount, ChainNode) // AE implementation
 * const client = await ContractWithAe({ url, internalUrl, compilerUrl, keypair, ... })
 *
 */
export default Ae.compose(ContractCompilerHttp, {
  methods: {
    getContractInstance,
    contractCompile,
    contractCallStatic,
    contractDeploy,
    // Delegation for contract
    delegateSignatureCommon,
    // AENS
    createAensDelegationSignature,
    // Oracle
    createOracleDelegationSignature
  },
  deepProps: {
    Ae: {
      defaults: {
        deposit: DEPOSIT,
        gasPrice: MIN_GAS_PRICE,
        amount: AMOUNT
      }
    }
  }
})
