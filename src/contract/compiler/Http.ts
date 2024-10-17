import {
  RestError,
  userAgentPolicyName,
  setClientRequestIdPolicyName,
} from '@azure/core-rest-pipeline';
import { OperationOptions } from '@azure/core-client';
import {
  Compiler as CompilerApi,
  ErrorModel,
  CompilerError as CompilerErrorApi,
} from '../../apis/compiler/index.js';
import { genErrorFormatterPolicy, genVersionCheckPolicy } from '../../utils/autorest.js';
import CompilerBase, { Aci, CompileResult } from './Base.js';
import { Encoded } from '../../utils/encoder.js';
import { CompilerError, NotImplementedError } from '../../utils/errors.js';

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
  constructor(compilerUrl: string, { ignoreVersion = false }: { ignoreVersion?: boolean } = {}) {
    super();

    let version: string | undefined;
    const getVersion = async (opts: OperationOptions): Promise<string> => {
      if (version != null) return version;
      version = (await this.api.apiVersion(opts)).apiVersion;
      return version;
    };

    this.api = new CompilerApi(compilerUrl, {
      allowInsecureConnection: true,
      additionalPolicies: [
        ...(ignoreVersion ? [] : [genVersionCheckPolicy('compiler', getVersion, '8.0.0', '9.0.0')]),
        genErrorFormatterPolicy((body: GeneralCompilerError | CompilerErrorApi[]) => {
          let message = '';
          if ('reason' in body) {
            message += ` ${body.reason}${
              body.parameter != null ? ` in ${body.parameter}` : ''
              // TODO: revising after improving documentation https://github.com/aeternity/aesophia_http/issues/78
            }${body.info != null ? ` (${JSON.stringify(body.info)})` : ''}`;
          }
          if (Array.isArray(body)) {
            message += `\n${body
              .map(
                (e) =>
                  `${e.type}:${e.pos.line}:${e.pos.col}: ${e.message}${e.context != null ? ` (${e.context})` : ''}`,
              )
              .join('\n')}`;
          }
          return message;
        }),
      ],
    });
    this.api.pipeline.removePolicy({ name: userAgentPolicyName });
    this.api.pipeline.removePolicy({ name: setClientRequestIdPolicyName });
  }

  async compileBySourceCode(
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): CompileResult {
    try {
      const cmpOut = await this.api.compileContract({ code: sourceCode, options: { fileSystem } });
      const warnings = cmpOut.warnings.map(({ type, ...warning }) => warning);
      const res = { ...cmpOut, warnings };
      // TODO: should be fixed when the compiledAci interface gets updated
      return res as Awaited<CompileResult>;
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 400) {
        throw new CompilerError(error.message);
      }
      throw error;
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  async compile(path: string): CompileResult {
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
