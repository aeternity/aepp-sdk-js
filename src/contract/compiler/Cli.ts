import { execFile } from 'child_process';
import { tmpdir } from 'os';
import { resolve, dirname, basename } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';
import CompilerBase, { Aci } from './Base';
import { Encoded } from '../../utils/encoder';
import { CompilerError, InternalError, UnsupportedVersionError } from '../../utils/errors';
import semverSatisfies from '../../utils/semver-satisfies';
import { ensureError } from '../../utils/other';

const getPackagePath = (): string => {
  const path = dirname(fileURLToPath(import.meta.url));
  if (basename(path) === 'dist') return resolve(path, '..');
  if (basename(path) === 'compiler') return resolve(path, '../../..');
  throw new InternalError('Can\'t get package path');
};

/**
 * A wrapper around aesophia_cli, available only in Node.js.
 * Requires Erlang installed, assumes that `escript` is available in PATH.
 */
export default class CompilerCli extends CompilerBase {
  #path: string;

  #ensureCompatibleVersion = Promise.resolve();

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
        const versions = [version, '7.2.1', '8.0.0'] as const;
        if (!semverSatisfies(...versions)) throw new UnsupportedVersionError('compiler', ...versions);
      });
    }
  }

  async #run(...parameters: string[]): Promise<string> {
    return new Promise((pResolve, pReject) => {
      execFile('escript', [this.#path, ...parameters], (error, stdout, stderr) => {
        if (error != null) pReject(error);
        else if (stderr !== '') pReject(new CompilerError(stderr));
        else pResolve(stdout);
      });
    });
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
    await Promise.all(Object.entries(fileSystem)
      .map(async ([name, src]) => {
        const p = resolve(path, name);
        await mkdir(dirname(p), { recursive: true });
        return writeFile(p, src);
      }));
    return sourceCodePath;
  }

  async compile(path: string): Promise<{
    bytecode: Encoded.ContractBytearray;
    aci: Aci;
  }> {
    await this.#ensureCompatibleVersion;
    try {
      const [bytecode, aci] = await Promise.all([
        this.#run(path),
        this.#run('--create_json_aci', path).then((res) => JSON.parse(res)),
      ]);
      return {
        bytecode: bytecode.trimEnd() as Encoded.ContractBytearray,
        aci,
      };
    } catch (error) {
      ensureError(error);
      throw new CompilerError(error.message);
    }
  }

  async compileBySourceCode(sourceCode: string, fileSystem?: Record<string, string>): Promise<{
    bytecode: Encoded.ContractBytearray;
    aci: Aci;
  }> {
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
    const ver = verMessage.match(/Sophia compiler version ([\d.]+)\n/)?.[1];
    if (ver == null) throw new CompilerError('Can\'t get compiler version');
    return ver;
  }
}
