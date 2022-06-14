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
 * Ae module
 * @module @aeternity/aepp-sdk/es/ae
 * @export Ae
 * @example import { Ae } from '@aeternity/aepp-sdk'
 */
import stampit from '@stamp/it'
import * as chainMethods from '../chain'
import * as txMethods from '../tx'
import * as aensMethods from './aens'
import * as spendMethods from './spend'
import * as oracleMethods from './oracle'
import * as contractMethods from './contract'
import * as contractGaMethods from '../contract/ga'
import Compiler from '../contract/compiler'
import NodePool from '../node-pool'
import AccountResolver from '../account/resolver'
import { AE_AMOUNT_FORMATS } from '../utils/amount-formatter'
import { mapObject } from '../utils/other'
import { AMOUNT } from '../tx/builder/schema'
import { CompilerError } from '../utils/errors'

function getValueOrErrorProxy<Value extends Object> (valueCb: () => Value): Value {
  try {
    return valueCb()
  } catch (error) {
    return new Proxy(
      {},
      Object.fromEntries(['get', 'set', 'has'].map(name => [name, () => { throw error }]))
    ) as Value
  }
}

const { _buildTx, ...otherTxMethods } = txMethods
export default stampit(NodePool, AccountResolver, {
  init ({ compilerUrl, ignoreVersion }) {
    this.compilerApi = getValueOrErrorProxy(() => {
      throw new CompilerError('You can\'t use Compiler API. Compiler is not ready!')
    })
    if (compilerUrl == null) return
    this.setCompilerUrl(compilerUrl, { ignoreVersion })
  },
  methods: {
    setCompilerUrl (compilerUrl: string, { ignoreVersion = false } = {}): void {
      this.compilerApi = new Compiler(compilerUrl, { ignoreVersion })
    },
    ...mapObject<Function, Function>(
      {
        ...spendMethods,
        ...chainMethods,
        ...otherTxMethods,
        ...contractMethods,
        ...contractGaMethods,
        ...aensMethods,
        ...oracleMethods,
        buildTx: _buildTx
      },
      ([name, handler]) => [
        name,
        async function (...args: any[]) {
          const instanceOptions = {
            ...this.Ae.defaults,
            onNode: getValueOrErrorProxy(() => this.api),
            onAccount: getValueOrErrorProxy(() => this._resolveAccount()),
            onCompiler: getValueOrErrorProxy(() => this.compilerApi),
            // TODO: remove networkId
            networkId: this.networkId ?? (await this.api?.getStatus()).networkId
          }
          const lastArg = args[args.length - 1]
          if (lastArg != null && typeof lastArg === 'object' && lastArg.constructor === Object) {
            Object.assign(lastArg, {
              ...instanceOptions,
              ...lastArg,
              ...lastArg.onAccount != null && { onAccount: this._resolveAccount(lastArg.onAccount) }
            })
          } else args.push(instanceOptions)
          return handler(...args)
        }
      ])
  },
  deepProps: {
    Ae: {
      defaults: {
        denomination: AE_AMOUNT_FORMATS.AETTOS,
        amount: AMOUNT
      }
    }
  }
})
