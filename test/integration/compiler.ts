import { expect } from 'chai';
import { describe, it } from 'mocha';
import { readFile } from 'fs/promises';
import { compilerUrl, ignoreVersion } from '.';
import {
  CompilerBase, CompilerHttpNode, CompilerCli, CompilerError, getFileSystem,
} from '../../src';
import { Encoded } from '../../src/utils/encoder';

function testCompiler(compiler: CompilerBase): void {
  const inclSourceCodePath = './test/integration/contracts/Includes.aes';
  let inclSourceCode: string;
  let inclFileSystem: Record<string, string>;
  const inclBytecode = 'cb_+QEGRgOg7BH1sCv+p2IrS0Pn3/i6AfE8lOGUuC71lLPn6mbUm9PAuNm4cv4AWolkAjcCBwcHFBQAAgD+RNZEHwA3ADcAGg6CPwEDP/5Nt4A5AjcCBwcHDAECDAEABAMRAFqJZP6SiyA2ADcBBwcMAwgMAQAEAxFNt4A5/pSgnxIANwF3BwwBAAQDEarAwob+qsDChgI3AXcHPgQAALhgLwYRAFqJZD0uU3VibGlicmFyeS5zdW0RRNZEHxFpbml0EU23gDkxLkxpYnJhcnkuc3VtEZKLIDYRdGVzdBGUoJ8SJWdldExlbmd0aBGqwMKGOS5TdHJpbmcubGVuZ3Rogi8AhTcuMS4wAGHgFTw=';
  // TODO: use Includes.aes after fixing https://github.com/aeternity/aesophia_cli/issues/74
  const incSourceCodePath = './test/integration/contracts/Increment.aes';
  let incSourceCode: string;
  const incBytecode = 'cb_+G1GA6Cln3BxyOo1iNITGseMS58ZfBbRNB0x8Ix7Bh54qZlSOcC4QKD+Er1R0wA3AQcHFDQAAgD+RNZEHwA3ADcAGg6CPwEDP5svAhESvVHTJWluY3JlbWVudBFE1kQfEWluaXSCLwCFNy4wLjEAfImpuQ==';
  const testBytecode = 'cb_+GhGA6BgYgXqYB9ctBcQ8mJ0+we5OXhb9PpsSQWP2DhPx9obn8C4O57+RNZEHwA3ADcAGg6CPwEDP/6AeCCSADcBd3cBAQCYLwIRRNZEHxFpbml0EYB4IJIZZ2V0QXJngi8AhTcuMC4xAMXqWXc=';

  before(async () => {
    inclSourceCode = await readFile(inclSourceCodePath, 'utf8');
    inclFileSystem = await getFileSystem(inclSourceCodePath);
    incSourceCode = await readFile(incSourceCodePath, 'utf8');
  });

  it('returns version', async () => {
    expect(await compiler.version()).to.be.equal('7.1.0');
  });

  it('compiles and generates aci by path', async () => {
    const { bytecode, aci } = await compiler.compile(inclSourceCodePath);
    expect(bytecode).to.equal(inclBytecode);
    expect(aci).to.have.property('encodedAci');
    expect(aci).to.have.property('externalEncodedAci');
  });

  it('compiles and generates aci by source code', async () => {
    const { bytecode, aci } = await compiler.compileBySourceCode(inclSourceCode, inclFileSystem);
    expect(bytecode).to.equal(inclBytecode);
    expect(aci).to.have.property('encodedAci');
    expect(aci).to.have.property('externalEncodedAci');
  });

  it('throws clear exception if compile broken contract', async () => {
    await expect(compiler.compileBySourceCode(
      'contract Foo =\n'
      + '  entrypoint getArg(x : bar) = x\n'
      + '  entrypoint getArg(x : int) = baz\n'
      + '  entrypoint getArg1(x : int) = baz\n',
    )).to.be.rejectedWith(
      CompilerError,
      compiler instanceof CompilerCli
        ? /Command failed: escript [\w-/]+\/bin\/aesophia_cli( --create_json_aci)? [\w-/]+\.aes\nType error( in '[\w-/]+\.aes')? at line 3, col 3:\nDuplicate definitions of `getArg` at\n {2}- line 2, column 3\n {2}- line 3, column 3\n\n/m
        : 'compile error:\n'
        + 'type_error:3:3: Duplicate definitions of `getArg` at\n'
        + '  - line 2, column 3\n'
        + '  - line 3, column 3\n'
        + 'type_error:3:32: Unbound variable `baz`\n'
        + 'type_error:4:33: Unbound variable `baz`',
    );
  });

  it('validates bytecode by path', async () => {
    expect(await compiler.validate(incBytecode, incSourceCodePath))
      .to.be.equal(true);
    expect(await compiler.validate(testBytecode, incSourceCodePath)).to.be.equal(false);
    const invalidBytecode = `${testBytecode}test` as Encoded.ContractBytearray;
    expect(await compiler.validate(invalidBytecode, incSourceCodePath))
      .to.be.equal(false);
  });

  it('validates bytecode by source code', async () => {
    expect(await compiler.validateBySourceCode(incBytecode, incSourceCode))
      .to.be.equal(true);
    expect(await compiler.validateBySourceCode(testBytecode, incSourceCode)).to.be.equal(false);
    const invalidBytecode = `${testBytecode}test` as Encoded.ContractBytearray;
    expect(await compiler.validateBySourceCode(invalidBytecode, incSourceCode))
      .to.be.equal(false);
  });
}

describe('CompilerHttp', () => {
  const compiler = new CompilerHttpNode(compilerUrl, { ignoreVersion });
  testCompiler(compiler);

  it('throws exception if used invalid compiler url', async () => {
    const c = new CompilerHttpNode('https://compiler.aepps.comas');
    await expect(c.compileBySourceCode('test'))
      .to.be.rejectedWith('getaddrinfo ENOTFOUND compiler.aepps.comas');
  });

  describe('getFileSystem', () => {
    it('reads file system', async () => {
      expect(await getFileSystem('./test/integration/contracts/Includes.aes')).to.be.eql({
        './lib/Library.aes':
          'include"lib/Sublibrary.aes"\n\n'
          + 'namespace Library =\n'
          + '  function sum(x: int, y: int): int = Sublibrary.sum(x, y)\n',
        'lib/Sublibrary.aes':
          'namespace Sublibrary =\n'
          + '  function sum(x: int, y: int): int = x + y\n',
      });
    });
  });
});

describe('CompilerCli', () => {
  const compiler = new CompilerCli();
  testCompiler(compiler);

  it('throws exception if used invalid compiler path', async () => {
    const c = new CompilerCli('not-existing');
    await expect(c.compileBySourceCode('test')).to.be.rejectedWith(
      'Command failed: escript not-existing --version\nescript: Failed to open file: not-existing',
    );
  });
});
