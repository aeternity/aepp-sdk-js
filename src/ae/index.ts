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

const { _buildTx, ...otherTxMethods } = txMethods
export default stampit(NodePool, AccountResolver, {
  init ({ compilerUrl, ignoreVersion }) {
    if (compilerUrl == null) return
    this.setCompilerUrl(compilerUrl, { ignoreVersion })
  },
  methods: {
    setCompilerUrl (compilerUrl: string, { ignoreVersion = false } = {}): void {
      this.compilerApi = new Compiler(compilerUrl, { ignoreVersion })
    },
    /**
     * Remove all listeners for RPC
     */
    destroyInstance (): void {
      const destroyMethods = ['destroyClient', 'destroyServer']
      destroyMethods.forEach((m) => typeof this[m] === 'function' && this[m]())
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
        async function (...args: any) {
          const instanceOptions = {
            ...this.Ae.defaults,
            onNode: this.api,
            onAccount: this,
            onCompiler: this.compilerApi,
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
