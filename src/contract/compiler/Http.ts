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
import { RestError } from '@azure/core-rest-pipeline';
import {
  Compiler as CompilerApi,
  ErrorModel,
  CompilerError as CompilerErrorApi,
} from '../../apis/compiler';
import { genErrorFormatterPolicy, genVersionCheckPolicy } from '../../utils/autorest';
import CompilerBase, { Aci } from './Base';
import { Encoded } from '../../utils/encoder';
import { CompilerError } from '../../utils/errors';

type GeneralCompilerError = ErrorModel & {
  info?: object;
  parameter?: string;
};

/**
 * Contract Compiler over HTTP
 *
 * This class include api call's related to contract compiler functionality.
 * @category contract
 * @example CompilerHttp('COMPILER_URL')
 */
export default class CompilerHttp extends CompilerBase {
  readonly api: CompilerApi;

  /**
   * @param compilerUrl - Url for compiler API
   * @param options - Options
   * @param options.ignoreVersion - Don't check compiler version
   */
  constructor(compilerUrl: string, { ignoreVersion }: { ignoreVersion?: boolean } = {}) {
    super();
    this.api = new CompilerApi(compilerUrl, {
      allowInsecureConnection: true,
      additionalPolicies: [
        genErrorFormatterPolicy((body: GeneralCompilerError | CompilerErrorApi[]) => {
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
              .join('\n')}`;
          }
          return message;
        }),
      ],
    });
    if (ignoreVersion !== true) {
      const versionPromise = this.api.apiVersion().then(({ apiVersion }) => apiVersion);
      this.api.pipeline.addPolicy(
        genVersionCheckPolicy('compiler', '/api-version', versionPromise, '7.0.1', '8.0.0'),
      );
    }
  }

  async compileBySourceCode(
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): Promise<{ bytecode: Encoded.ContractBytearray; aci: Aci }> {
    try {
      const [bytecode, aci] = await Promise.all([
        this.api.compileContract({ code: sourceCode, options: { fileSystem } })
          .then((res) => res.bytecode as Encoded.ContractBytearray),
        this.api.generateACI({ code: sourceCode, options: { fileSystem } }),
      ]);
      // TODO: should be fixed when the compiledAci interface gets updated
      return { bytecode, aci: aci as Aci };
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 400) {
        throw new CompilerError(error.message.replace(/^aci error:/, 'compile error:'));
      }
      throw error;
    }
  }

  async validateBySourceCode(
    bytecode: Encoded.ContractBytearray,
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): Promise<boolean> {
    try {
      await this.api.validateByteCode({ bytecode, source: sourceCode, options: { fileSystem } });
      return true;
    } catch {
      return false;
    }
  }

  async version(): Promise<string> {
    return (await this.api.version()).version;
  }
}
