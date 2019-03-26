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
 * ContractACI module
 *
 * @module @aeternity/aepp-sdk/es/contract/aci
 * @export ContractACI
 * @example import ContractACI from '@aeternity/aepp-sdk/es/contract/aci'
 */
import Contract from '../ae/contract'

/**
 * Validated contract call arguments using contract ACI
 * @function validateCallParams
 * @rtype (aci: Object, params: Array) => Object
 * @param {Object} aci Contract ACI
 * @param {Array} params Contract call arguments
 * @return {Object} Object with validation errors
 */
function validateCallParams (aci, params) {}

/**
 * Transform contract call arguments
 * @function prepareCallParams
 * @rtype (aci: Object, params: Array) => Array
 * @param {Object} aci Contract ACI
 * @param {Array} params Contract call arguments
 * @return {Array} Object with call arguments
 */
function prepareCallParams (aci, params) {}

/**
 * Genrate JS contract call functions using ACI
 * @function generateContractJS
 * @rtype (aci: Object) => Object
 * @param {Object} aci Contract ACI
 * @return {Array} Object with contract call functions
 */
function generateContractJS (aci) {
  // return aci.functions
  //   .reduce(
  //     (acc, el) => {
  //       const { fn } = el
  //       acc[fn] = async (args = [], options = {}) => {
  //         return call.bind(this)(this.source, this.deployInfo.address, fn, args, options)
  //       }
  //     },
  //     {}
  //   )
  return {}
}

async function call (fn, params = [], options = {}) {
  if (!fn) throw new Error('Function name is required')
  if (!this.deployInfo.address) throw new Error('You need to deploy contract before calling!')

  return options.callStatic
    ? this.contractCallStatic(this.interface, this.deployInfo.address, fn, params, { top: options.top, options })
    : this.contractCall(this.interface, this.deployInfo.address, fn, params, options)
}

async function deploy (init = [], options = {}) {
  if (!this.compiled) await this.compiled

  const { owner, transaction, address, createdAt } = await this.contractDeploy(this.compiled, this.source, init, options)
  this.deployInfo = { owner, transaction, address, createdAt }
}

async function compile () {
  this.compiled = await this.contractCompile(this.source)
  return this
}

/**
 * Generate contract ACI object with predefined js methods for contract usage
 * @param {Object} aci Contract ACI
 * @param {String} source Contract source code
 * @param {Object} options Options object
 * @return {Object} JS Contract API
 */
function getInstance (aci, source, options = {}) {
  return Object.freeze({
    interface: aci.interface,
    source,
    compiled: null,
    deployInfo: {},
    compile: compile.bind(this),
    deploy: deploy.bind(this),
    call: call.bind(this),
    ...generateContractJS.bind(this)(aci)
  })
}

/**
 * Contract ACI Stamp
 *
 * @function
 * @alias module:@aeternity/aepp-sdk/es/contract/aci
 * @rtype Stamp
 * @return {Object} Contract compiler instance
 * @example ContractACI()
 */
const ContractACI = Contract.compose({
  methods: {
    validateCallParams,
    prepareCallParams,
    getInstance
  }
})

export default ContractACI
