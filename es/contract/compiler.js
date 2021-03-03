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
 * ContractCompilerAPI module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/contract}.
 * @module @aeternity/aepp-sdk/es/contract/compiler
 * @export ContractCompilerAPI
 * @example import ContractCompilerAPI from '@aeternity/aepp-sdk/es/contract/compiler'
 */

import Http from '../utils/http'
import ContractBase from './index'
import semverSatisfies from '../utils/semver-satisfies'
import AsyncInit from '../utils/async-init'
import { VM_TYPE } from '../tx/builder/schema'
import PS from 'erlps-aesophia/dist/bundle'

const showTerm = PS['Data.Show'].show(PS['Erlang.Type'].showErlangTerm)
const erlBinToErlStr = (t) => PS['Erlang.Builtins'].erlang__binary_to_list__1([t])
const erlStrToErlBin = (t) => PS['Erlang.Builtins'].erlang__iolist_to_binary__1([t])
const erlStrToJSStr = (t) => PS['Erlang.Type'].fromErl(PS['Erlang.Type'].stringFromErlang)(t).value0
const jsStrToErlStr = PS['Erlang.Type'].toErl(PS['Erlang.Type'].stringToErlang)
const mkTuple = PS['Erlang.Type'].ErlangTuple.create
const mkAtom = PS['Erlang.Type'].ErlangAtom.create
const mkNil = PS['Erlang.Type'].ErlangEmptyList.value
const mkCons = (a, b) => PS['Erlang.Type'].ErlangCons.create(a)(b)
/* const erlTermToJSONBIN =
  (t) =>
    PS['Jsx'].erlps__encode__1([t]) */
//  console.log(JSON.parse(erlTermToJSONBIN(jsStrToErlStr("AAAA")).value0.toString()))

async function getCompilerVersion (options = {}) {
  const verErlBin = PS['Aeso.Compiler'].erlps__version__0([]).value0[1]
  const verErlStr = erlBinToErlStr(verErlBin)
  const ver = erlStrToJSStr(verErlStr)
  return ver
}

async function contractEncodeCallDataAPI (source, name, args = [], options = {}) {
  this.isInit()
  return this.http
    .post('/encode-calldata', { source, function: name, arguments: args, options: this.prepareCompilerOption(options) }, options)
    .then(({ calldata }) => calldata)
}

async function contractDecodeCallDataByCodeAPI (bytecode, calldata, backend = this.compilerOptions.backend, options = {}) {
  this.isInit()
  return this.http
    .post('/decode-calldata/bytecode', { bytecode, calldata, backend }, options)
}

async function contractDecodeCallDataBySourceAPI (source, fn, callData, options = {}) {
  this.isInit()
  return this.http
    .post('/decode-calldata/source', { function: fn, source, calldata: callData, options: this.prepareCompilerOption(options) }, options)
}

async function contractDecodeCallResultAPI (source, fn, callValue, callResult, options = {}) {
  this.isInit()
  return this.http
    .post('/decode-call-result', { function: fn, source, 'call-result': callResult, 'call-value': callValue, options: this.prepareCompilerOption(options) }, options)
}

async function contractDecodeDataAPI (type, data, options = {}) {
  this.isInit()
  return this.http
    .post('/decode-data', { data, 'sophia-type': type }, options)
    .then(({ data }) => data)
}

async function validateByteCodeAPI (bytecode, source, options = {}) {
  this.isInit()
  return this.http
    .post('/validate-byte-code', { bytecode, source, options: this.prepareCompilerOption(options) }, options)
    .then(res => typeof res === 'object' ? true : res)
}

async function compileContractAPI (code, options = {}) {
  this.isInit()
  try {
    console.log('Compiling')
    console.log(options)
    const eopts = this.erlpsPrepareCompilerOption(options)
    console.log(showTerm(eopts))
    const a = PS['Aeso.Compiler'].erlps__from_string__2([jsStrToErlStr(code), eopts]).value0[1]
    console.log(showTerm(a))
    const b = PS['Aeser.Contract.Code'].erlps__serialize__1([a])
    // console.log(showTerm(b))
    const c = PS['Aeser.Api.Encoder'].erlps__encode__2([mkAtom('contract_bytearray'), b])
    // console.log(showTerm(c))
    const d = erlStrToJSStr(erlBinToErlStr(c))
    console.log('ErlPS: ', d)
    this.http.post('/compile', { code, options: this.prepareCompilerOption(options) }, options)
      .then(({ bytecode }) => { console.log('HTTP: ', bytecode); return bytecode })
    return d
  } catch (e) {
    console.log(e)
  }
}

async function contractGetACI (code, options = {}) {
  this.isInit()
  try {
    /*
      #{encoded_aci => lists:last(JsonACI),
      external_encoded_aci => lists:droplast(JsonACI),
      interface   => StringACI}
    */
    const eopts = this.erlpsPrepareCompilerOption(options)
    const jsonAci = PS['Aeso.Aci'].erlps__contract_interface__3([mkAtom('json'), jsStrToErlStr(code), eopts]).value0[1]
    const stubAci = PS['Aeso.Aci'].erlps__render_aci_json__1([jsonAci]).value0[1]
    const ret = { interface: erlStrToJSStr(erlBinToErlStr(stubAci)) }
    // TODO: implement erlang__atom_to_binary__2
    // console.log(JSON.parse(erlTermToJSONBIN(json_aci).value0.toString()))
    console.log(ret)
    const a = await this.http.post('/aci', { code, options: this.prepareCompilerOption(options) }, options)
    console.log(a)
    return a
  } catch (e) {
    console.log(e)
  }
}

async function getFateAssembler (bytecode, options = {}) {
  this.isInit()
  return this.http.post('/fate-assembler', { bytecode, options: this.prepareCompilerOption(options) }, options)
}

async function getBytecodeCompilerVersion (bytecode, options = {}) {
  this.isInit()
  return this.http.post('/compiler-version', { bytecode, options: this.prepareCompilerOption(options) }, options)
}

async function setCompilerUrl (url, { forceCompatibility = false } = {}) {
  this.http.changeBaseUrl(url)
  this.compilerVersion = await this.getCompilerVersion().catch(e => null)
  await this.checkCompatibility({ forceCompatibility })
}

async function checkCompatibility ({ force = false, forceCompatibility = false } = {}) {
  if (!this.compilerVersion && !force) throw new Error('Compiler do not respond')
  if (!forceCompatibility && this.compilerVersion && !semverSatisfies(this.compilerVersion.split('-')[0], COMPILER_GE_VERSION, COMPILER_LT_VERSION)) {
    const version = this.compilerVersion
    this.compilerVersion = null
    throw new Error(`Unsupported compiler version ${version}. ` +
      `Supported: >= ${COMPILER_GE_VERSION} < ${COMPILER_LT_VERSION}`)
  }
}

function erlpsPrepareCompilerOption ({ backend = this.compilerOptions.backend, filesystem = {} } = {}) {
  let erlfs = mkNil
  for (const [key, value] of Object.entries(filesystem)) {
    erlfs = mkCons(mkTuple([jsStrToErlStr(key), erlStrToErlBin(jsStrToErlStr(value))]), erlfs)
  }
  const filemap = PS['Erlang.Builtins'].maps__from_list__1([erlfs])
  return mkCons(mkTuple([mkAtom('backend'), mkAtom(backend)]),
    mkCons(mkTuple([mkAtom('include'), mkTuple([mkAtom('explicit_files'), filemap])]), mkNil))
}

function prepareCompilerOption ({ backend = this.compilerOptions.backend, filesystem = {} } = {}) {
  return { backend, file_system: filesystem }
}

function isInit () {
  if (this.compilerVersion === null) throw Error('Compiler not defined')
  return true
}

/**
 * Contract Compiler Stamp
 *
 * This stamp include api call's related to contract compiler functionality.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/contract/compiler
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {String} [options.compilerUrl] compilerUrl - Url for compiler API
 * @return {Object} Contract compiler instance
 * @example ContractCompilerAPI({ compilerUrl: 'COMPILER_URL' })
 */
const ContractCompilerAPI = AsyncInit.compose(ContractBase, {
  async init ({ compilerUrl = this.compilerUrl, forceCompatibility = false }) {
    this.http = Http({ baseUrl: compilerUrl })
    this.compilerVersion = await this.getCompilerVersion().catch(e => null)
    await this.checkCompatibility({ force: true, forceCompatibility })
  },
  methods: {
    contractEncodeCallDataAPI,
    contractDecodeDataAPI,
    compileContractAPI,
    contractGetACI,
    contractDecodeCallDataByCodeAPI,
    contractDecodeCallDataBySourceAPI,
    contractDecodeCallResultAPI,
    setCompilerUrl,
    getCompilerVersion,
    validateByteCodeAPI,
    isInit,
    checkCompatibility,
    erlpsPrepareCompilerOption,
    prepareCompilerOption,
    getFateAssembler,
    getBytecodeCompilerVersion
  },
  props: {
    compilerVersion: null,
    compilerOptions: {
      backend: VM_TYPE.FATE
    }
  }
})

const COMPILER_GE_VERSION = '4.0.0'
export const COMPILER_LT_VERSION = '5.0.0'

export default ContractCompilerAPI
