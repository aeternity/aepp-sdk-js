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

/* Pretty printer of elang terms */
const showTerm = PS['Data.Show'].show(PS['Erlang.Type'].showErlangTerm)

/* Erl -> Erl conversions */
const erlBinToErlStr = (t) => PS['Erlang.Builtins'].erlang__binary_to_list__1([t])
const erlStrToErlBin = (t) => PS['Erlang.Builtins'].erlang__iolist_to_binary__1([t])
const erlMapToErlList = (t) => PS['Erlang.Builtins'].maps__to_list__1([t])

/* Erl -> JS casts */
const erlStrToJSStr = (t) => PS['Erlang.Type'].fromErl(PS['Erlang.Type'].stringFromErlang)(t).value0
const erlBinToJSStr = (t) => erlStrToJSStr(erlBinToErlStr(t))

/* JS -> Erl casts */
const jsStrToErlStr = PS['Erlang.Type'].toErl(PS['Erlang.Type'].stringToErlang)
const jsStrToErlBin = (t) => erlStrToErlBin(jsStrToErlStr(t))
const jsArrayToErlList = (t) => PS['Erlang.Builtins'].erlang__tuple_to_list__1([mkTuple(t)])

/* Constructors for erlang types */
const erlTuple = PS['Erlang.Type'].ErlangTuple
const erlCons = PS['Erlang.Type'].ErlangCons
const erlNil = PS['Erlang.Type'].ErlangEmptyList
const erlAtom = PS['Erlang.Type'].ErlangAtom
const erlBin = PS['Erlang.Type'].ErlangBinary
const erlMap = PS['Erlang.Type'].ErlangMap
const erlFloat = PS['Erlang.Type'].ErlangFloat
const erlInt = PS['Erlang.Type'].ErlangInt
const mkTuple = erlTuple.create
const mkAtom = PS['Erlang.Type'].ErlangAtom.create
const mkNil = PS['Erlang.Type'].ErlangEmptyList.value
const mkCons = (a, b) => PS['Erlang.Type'].ErlangCons.create(a)(b)

/* Convert an erlang JSON to a JS JSON */
const erlJSONToJsJSON =
  (t) => {
    if (t instanceof erlNil) return []
    if (t instanceof erlCons) {
        let r = [];
        while (!(t instanceof erlNil)) {
            r.push(erlJSONToJsJSON(t.value0));
            t = t.value1;
        }
        return r;
    }
    if(t instanceof erlMap) {
        t = erlMapToErlList(t);
        let r = {};
        while (!(t instanceof erlNil)) {
            let k = t.value0.value0[0];
            if (k instanceof erlAtom) k = k.value0;
            else if (k instanceof erlBin) k = erlBinToJSStr(k);
            else if (k instanceof erlInt) k = PS["Erlang.Utils"].bigIntToInt(k.value0).value0
            else {
                console.log(k)
                throw new Error("Invalid Key")
            }
            let v = t.value0.value0[1];
            r[k] = erlJSONToJsJSON(v);
            t = t.value1;
        }
        return r;
    }
    if(t instanceof erlBin) return erlBinToJSStr(t)
    if(t instanceof erlAtom) {
        if(t.value0 == "true") return true;
        if(t.value0 == "false") return false;
        return t.value0
    }
    if(t instanceof erlFloat) return t.value0;
    if(t instanceof erlInt) {
      return PS["Erlang.Utils"].bigIntToInt(t.value0).value0
    };
    console.log(t)
    throw new Error("Invalid value")
    }

async function getCompilerVersion (options = {}) {
  const r = PS['Aeso.Compiler'].erlps__version__0([])
  if (r instanceof erlTuple && r.value0[0].value0 === 'ok') {
    return erlBinToJSStr(r.value0[1])
  } else {
    console.log(showTerm(r))
    throw new Error('Failed to get compiler version')
  }
}

async function contractEncodeCallDataAPI (source, name, args = [], options = {}) {
  this.isInit()
  const copts = this.erlpsPrepareCompilerOption(options)
  const eargs = jsArrayToErlList(args.map(jsStrToErlStr))
  const r = PS['Aeso.Compiler'].erlps__create_calldata__4([jsStrToErlStr(source), jsStrToErlStr(name), eargs, copts])
  if (r instanceof erlTuple && r.value0[0].value0 === 'ok') {
    return erlBinToJSStr(PS['Aeser.Api.Encoder'].erlps__encode__2([mkAtom('contract_bytearray'), r.value0[1]]))
  } else {
    console.log(showTerm(r))
    throw new Error('Failed to encode calldata')
  }
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
  const copts = this.erlpsPrepareCompilerOption(options)
  const cval = PS['Aeser.Api.Encoder'].erlps__safe_decode__2([mkAtom('contract_bytearray'), jsStrToErlBin(callValue)])
  const r = PS['Aeso.Compiler'].erlps__to_sophia_value__5([jsStrToErlStr(source), jsStrToErlStr(fn), mkAtom(callResult), cval.value0[1], copts])
  if (r instanceof erlTuple && r.value0[0].value0 === 'ok') {
    return erlJSONToJsJSON(PS['Aeso.Aci'].erlps__json_encode_expr__1([r.value0[1]]))
  } else {
    console.log(showTerm(r))
    throw new Error('Failed to decode call result')
  }
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
  const copts = this.erlpsPrepareCompilerOption(options)
  // const copts = mkCons(mkTuple([mkAtom("aci"), mkAtom("json")]), this.erlpsPrepareCompilerOption(options)); // Uncomment to generate the ACI alongside the bytecode ;)
  const compiled = PS['Aeso.Compiler'].erlps__from_string__2([jsStrToErlStr(code), copts])
  if (compiled instanceof erlTuple && compiled.value0[0].value0 === 'ok') {
    const compiled1 = PS['Aeser.Contract.Code'].erlps__serialize__1([compiled.value0[1]])
    const bytecode = PS['Aeser.Api.Encoder'].erlps__encode__2([mkAtom('contract_bytearray'), compiled1])
    return erlBinToJSStr(bytecode)
  } else {
    console.log(showTerm(compiled))
    throw new Error('Failed to compile contract')
  }
}

async function contractGetACI (code, options = {}) {
  this.isInit()
  const copts = this.erlpsPrepareCompilerOption(options)
  const r = PS['Aeso.Aci'].erlps__contract_interface__3([mkAtom('json'), jsStrToErlStr(code), copts])
  if (r instanceof erlTuple && r.value0[0].value0 === 'ok') {
    const erlAci = r.value0[1]
    const jsAci = erlJSONToJsJSON(erlAci)
    const stubAci = PS['Aeso.Aci'].erlps__render_aci_json__1([erlAci]).value0[1]
    return {
      interface: erlBinToJSStr(stubAci),
      encoded_aci: jsAci[jsAci.length - 1],
      external_encoded_aci: jsAci.slice(0, -1)
    }
  } else {
    console.log(showTerm(r))
    throw new Error('Failed to generate ACI')
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
