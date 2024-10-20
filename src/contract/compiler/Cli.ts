import { execFile } from 'child_process';
import { tmpdir } from 'os';
import { resolve, dirname, basename } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';
import CompilerBase, { Aci, CompileResult } from './Base.js';
import { Encoded } from '../../utils/encoder.js';
import { CompilerError, InternalError, UnsupportedVersionError } from '../../utils/errors.js';
import semverSatisfies from '../../utils/semver-satisfies.js';
import { ensureError } from '../../utils/other.js';

export const getPackagePath = (): string => {
  const path = dirname(fileURLToPath(import.meta.url));
  if (basename(path) === 'dist') return resolve(path, '..');
  if (basename(path) === 'compiler') return resolve(path, '../../..');
  throw new InternalError("Can't get package path");
};

/**
 * A wrapper around aesophia_cli, available only in Node.js.
 * Requires Erlang installed, assumes that `escript` is available in PATH.
 * @category contract
 */
export default class CompilerCli extends CompilerBase {
  readonly #path: string;

  readonly #ensureCompatibleVersion = Promise.resolve();

  /**
   * @param compilerPath - A path to aesophia_cli binary, by default uses the integrated one
   * @param options - Options
   * @param options.ignoreVersion - Don't ensure that the compiler is supported
   */
  constructor(
    compilerPath = resolve(getPackagePath(), './bin/aesophia_cli'),
    { ignoreVersion }: { ignoreVersion?: boolean } = {},
  ) {
    super();
    this.#path = compilerPath;
    if (ignoreVersion !== true) {
      this.#ensureCompatibleVersion = this.version().then((version) => {
        const versions = [version, '8.0.0', '9.0.0'] as const;
        if (!semverSatisfies(...versions))
          throw new UnsupportedVersionError('compiler', ...versions);
      });
    }
  }

  async #runWithStderr(...parameters: string[]): Promise<{ stderr: string; stdout: string }> {
    return new Promise((pResolve, pReject) => {
      execFile('escript', [this.#path, ...parameters], (error, stdout, stderr) => {
        if (error != null) pReject(error);
        else pResolve({ stdout, stderr });
      });
    });
  }

  async #run(...parameters: string[]): Promise<string> {
    const { stderr, stdout } = await this.#runWithStderr(...parameters);
    if (stderr !== '') throw new CompilerError(stderr);
    return stdout;
  }

  static async #saveContractToTmpDir(
    sourceCode: string,
    fileSystem: Record<string, string> = {},
  ): Promise<string> {
    const randomName = (): string => Math.random().toString(36).slice(2);
    const path = resolve(tmpdir(), `aepp-sdk-js-${randomName()}`);
    await mkdir(path);
    const sourceCodePath = resolve(path, `${randomName()}.aes`);
    await writeFile(sourceCodePath, sourceCode);
    await Promise.all(
      Object.entries(fileSystem).map(async ([name, src]) => {
        const p = resolve(path, name);
        await mkdir(dirname(p), { recursive: true });
        return writeFile(p, src);
      }),
    );
    return sourceCodePath;
  }

  async compile(path: string): CompileResult {
    await this.#ensureCompatibleVersion;
    try {
      const [compileRes, aci] = await Promise.all([
        this.#runWithStderr(path),
        this.generateAci(path),
      ]);
      return {
        bytecode: compileRes.stdout.trimEnd() as Encoded.ContractBytearray,
        aci,
        warnings: compileRes.stderr
          .split('Warning in ')
          .slice(1)
          .map((warning) => {
            const reg = /^'(.+)' at line (\d+), col (\d+):\n(.+)$/s;
            const match = warning.match(reg);
            if (match == null) throw new InternalError(`Can't parse compiler output: "${warning}"`);
            return {
              message: match[4].trimEnd(),
              pos: {
                ...(match[1] !== path && { file: match[1] }),
                line: +match[2],
                col: +match[3],
              },
            };
          }),
      };
    } catch (error) {
      ensureError(error);
      throw new CompilerError(error.message);
    }
  }

  async compileBySourceCode(
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): CompileResult {
    const tmp = await CompilerCli.#saveContractToTmpDir(sourceCode, fileSystem);
    try {
      return await this.compile(tmp);
    } finally {
      await rm(dirname(tmp), { recursive: true });
    }
  }

  async generateAci(path: string): Promise<Aci> {
    await this.#ensureCompatibleVersion;
    try {
      return JSON.parse(await this.#run('--no_code', '--create_json_aci', path));
    } catch (error) {
      ensureError(error);
      throw new CompilerError(error.message);
    }
  }

  async generateAciBySourceCode(
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): Promise<Aci> {
    const tmp = await CompilerCli.#saveContractToTmpDir(sourceCode, fileSystem);
    try {
      return await this.generateAci(tmp);
    } finally {
      await rm(dirname(tmp), { recursive: true });
    }
  }

  async validate(bytecode: Encoded.ContractBytearray, path: string): Promise<boolean> {
    await this.#ensureCompatibleVersion;
    try {
      return (await this.#run(path, '--validate', bytecode)).includes('Validation successful.');
    } catch (error) {
      return false;
    }
  }

  async validateBySourceCode(
    bytecode: Encoded.ContractBytearray,
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): Promise<boolean> {
    const tmp = await CompilerCli.#saveContractToTmpDir(sourceCode, fileSystem);
    try {
      return await this.validate(bytecode, tmp);
    } finally {
      await rm(dirname(tmp), { recursive: true });
    }
  }

  async version(): Promise<string> {
    const verMessage = await this.#run('--version');
    const ver = verMessage.match(/Sophia compiler version ([\d.]+.*)\n/)?.[1];
    if (ver == null) throw new CompilerError("Can't get compiler version");
    return ver;
  }
}
