import { readFile } from 'fs/promises';
import HttpBrowser from './Http';
import { Aci } from './Base';
import { Encoded } from '../../utils/encoder';
import getFileSystem from './getFileSystem';

/**
 * Contract Compiler over HTTP for Nodejs
 *
 * Inherits CompilerHttp and implements `compile`, `validate` methods
 * @category contract
 * @example CompilerHttpNode('COMPILER_URL')
 */
export default class CompilerHttpNode extends HttpBrowser {
  override async compile(path: string): Promise<{ bytecode: Encoded.ContractBytearray; aci: Aci }> {
    const fileSystem = await getFileSystem(path);
    const sourceCode = await readFile(path, 'utf8');
    return this.compileBySourceCode(sourceCode, fileSystem);
  }

  override async generateAci(path: string): Promise<Aci> {
    const fileSystem = await getFileSystem(path);
    const sourceCode = await readFile(path, 'utf8');
    return this.generateAciBySourceCode(sourceCode, fileSystem);
  }

  override async validate(bytecode: Encoded.ContractBytearray, path: string): Promise<boolean> {
    const fileSystem = await getFileSystem(path);
    const sourceCode = await readFile(path, 'utf8');
    return this.validateBySourceCode(bytecode, sourceCode, fileSystem);
  }
}
