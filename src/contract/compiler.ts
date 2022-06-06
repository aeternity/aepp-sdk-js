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
 * ContractCompilerHttp module
 *
 * @module @aeternity/aepp-sdk/es/contract/compiler
 * @export ContractCompilerHttp
 * @example import { ContractCompilerHttp } from '@aeternity/aepp-sdk'
 */

import stampit from '@stamp/it'
import { Compiler as CompilerApi, ErrorModel, CompilerError } from '../apis/compiler'
import { genErrorFormatterPolicy, genVersionCheckPolicy } from '../utils/autorest'

type GeneralCompilerError = ErrorModel & {
  info?: object
  parameter?: string
}

export type OnCompiler = _ContractCompilerHttp['compilerApi']

export class _ContractCompilerHttp {
  compilerApi: CompilerApi

  // TODO: replace with constructor after dropping account stamps
  init (
    { compilerUrl, ignoreVersion }: { compilerUrl?: string, ignoreVersion?: boolean }
  ): void {
    if (compilerUrl == null) return
    this.setCompilerUrl(compilerUrl, { ignoreVersion })
  }

  setCompilerUrl (compilerUrl: string, { ignoreVersion = false } = {}): void {
    this.compilerApi = new CompilerApi(compilerUrl, {
      allowInsecureConnection: true,
      additionalPolicies: [
        genErrorFormatterPolicy((body: GeneralCompilerError | CompilerError[]) => {
          let message = ''
          if ('reason' in body) {
            message += ' ' + body.reason +
              (body.parameter != null ? ` in ${body.parameter}` : '') +
              // TODO: revising after improving documentation https://github.com/aeternity/aesophia_http/issues/78
              (body.info != null ? ` (${JSON.stringify(body.info)})` : '')
          }
          if (Array.isArray(body)) {
            message += '\n' + body
              .map(e => `${e.type}:${e.pos.line}:${e.pos.col}: ${e.message}${e.context != null ? `(${e.context})` : ''}`)
              .map(e => e.trim()) // TODO: remove after fixing https://github.com/aeternity/aesophia_http/issues/80
              .join('\n')
          }
          return message
        })
      ]
    })
    if (!ignoreVersion) {
      const versionPromise = this.compilerApi.aPIVersion().then(({ apiVersion }) => apiVersion)
      this.compilerApi.pipeline.addPolicy(
        genVersionCheckPolicy('compiler', '/api-version', versionPromise, '6.1.0', '7.0.0')
      )
    }
  }
}

/**
 * Contract Compiler Stamp
 *
 * This stamp include api call's related to contract compiler functionality.
 * @alias module:@aeternity/aepp-sdk/es/contract/compiler
 * @param options - Initializer object
 * @returns Contract compiler instance
 * @example ContractCompilerHttp({ compilerUrl: 'COMPILER_URL' })
 */
export default stampit <_ContractCompilerHttp>({
  init: _ContractCompilerHttp.prototype.init,
  methods: {
    setCompilerUrl: _ContractCompilerHttp.prototype.setCompilerUrl
  }
})