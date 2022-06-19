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
import { Compiler as CompilerApi, ErrorModel, CompilerError } from '../apis/compiler';
import { genErrorFormatterPolicy, genVersionCheckPolicy } from '../utils/autorest';

type GeneralCompilerError = ErrorModel & {
  info?: object;
  parameter?: string;
};

/**
 * Contract Compiler
 *
 * This class include api call's related to contract compiler functionality.
 * @category contract
 * @example Compiler('COMPILER_URL')
 */
export default class Compiler extends CompilerApi {
  /**
   * @param compilerUrl - Url for compiler API
   * @param options - Options
   * @param options.ignoreVersion - Don't check compiler version
   */
  constructor(compilerUrl: string, { ignoreVersion }: { ignoreVersion?: boolean } = {}) {
    super(compilerUrl, {
      allowInsecureConnection: true,
      additionalPolicies: [
        genErrorFormatterPolicy((body: GeneralCompilerError | CompilerError[]) => {
          let message = '';
          if ('reason' in body) {
            message += ` ${body.reason
            }${body.parameter != null ? ` in ${body.parameter}` : ''
              // TODO: revising after improving documentation https://github.com/aeternity/aesophia_http/issues/78
            }${body.info != null ? ` (${JSON.stringify(body.info)})` : ''}`;
          }
          if (Array.isArray(body)) {
            message += `\n${body
              .map((e) => `${e.type}:${e.pos.line}:${e.pos.col}: ${e.message}${e.context != null ? `(${e.context})` : ''}`)
              .map((e) => e.trim()) // TODO: remove after fixing https://github.com/aeternity/aesophia_http/issues/80
              .join('\n')}`;
          }
          return message;
        }),
      ],
    });
    if (ignoreVersion !== true) {
      const versionPromise = this.aPIVersion().then(({ apiVersion }) => apiVersion);
      this.pipeline.addPolicy(
        genVersionCheckPolicy('compiler', '/api-version', versionPromise, '6.1.0', '7.0.0'),
      );
    }
  }
}
