import { RestError } from '@azure/core-rest-pipeline';
import {
  Compiler as CompilerApi,
  ErrorModel,
  CompilerError as CompilerErrorApi,
} from '../../apis/compiler';
import { genErrorFormatterPolicy, genVersionCheckPolicy } from '../../utils/autorest';
import CompilerBase, { Aci } from './Base';
import { Encoded } from '../../utils/encoder';
import { CompilerError, NotImplementedError } from '../../utils/errors';

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
              .map((e) => `${e.type}:${e.pos.line}:${e.pos.col}: ${e.message}${e.context != null ? ` (${e.context})` : ''}`)
              .join('\n')}`;
          }
          return message;
        }),
      ],
    });
    if (ignoreVersion !== true) {
      const versionPromise = this.api.apiVersion()
        .then(({ apiVersion }) => apiVersion, (error) => error);
      this.api.pipeline.addPolicy(
        genVersionCheckPolicy('compiler', '/api-version', versionPromise, '7.3.0', '8.0.0'),
      );
    }
  }

  async compileBySourceCode(
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): Promise<{ bytecode: Encoded.ContractBytearray; aci: Aci }> {
    try {
      const res = await this.api.compileContract({ code: sourceCode, options: { fileSystem } });
      // TODO: should be fixed when the compiledAci interface gets updated
      return res as { bytecode: Encoded.ContractBytearray; aci: Aci };
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 400) {
        throw new CompilerError(error.message);
      }
      throw error;
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  async compile(path: string): Promise<{ bytecode: Encoded.ContractBytearray; aci: Aci }> {
    throw new NotImplementedError('File system access, use CompilerHttpNode instead');
  }

  async generateAciBySourceCode(
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): Promise<Aci> {
    try {
      return await this.api.generateACI({ code: sourceCode, options: { fileSystem } });
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 400) {
        throw new CompilerError(error.message);
      }
      throw error;
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  async generateAci(path: string): Promise<Aci> {
    throw new NotImplementedError('File system access, use CompilerHttpNode instead');
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

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  async validate(bytecode: Encoded.ContractBytearray, path: string): Promise<boolean> {
    throw new NotImplementedError('File system access, use CompilerHttpNode instead');
  }

  async version(): Promise<string> {
    return (await this.api.version()).version;
  }
}
