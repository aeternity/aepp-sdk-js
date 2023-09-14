import { readFile } from 'fs/promises';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { compilerUrl, ignoreVersion } from '.';
import inclAci from './contracts/Includes.json';
import {
  CompilerBase, CompilerHttpNode, CompilerCli, CompilerError, getFileSystem, Encoded,
} from '../../src';

function testCompiler(compiler: CompilerBase): void {
  const inclSourceCodePath = './test/integration/contracts/Includes.aes';
  let inclSourceCode: string;
  let inclFileSystem: Record<string, string>;
  const inclBytecode = 'cb_+QEGRgOg7BH1sCv+p2IrS0Pn3/i6AfE8lOGUuC71lLPn6mbUm9PAuNm4cv4AWolkAjcCBwcHFBQAAgD+RNZEHwA3ADcAGg6CPwEDP/5Nt4A5AjcCBwcHDAECDAEABAMRAFqJZP6SiyA2ADcBBwcMAwgMAQAEAxFNt4A5/pSgnxIANwF3BwwBAAQDEarAwob+qsDChgI3AXcHPgQAALhgLwYRAFqJZD0uU3VibGlicmFyeS5zdW0RRNZEHxFpbml0EU23gDkxLkxpYnJhcnkuc3VtEZKLIDYRdGVzdBGUoJ8SJWdldExlbmd0aBGqwMKGOS5TdHJpbmcubGVuZ3Rogi8AhTcuNC4wAGqg1h8=';
  const testBytecode = 'cb_+GhGA6BgYgXqYB9ctBcQ8mJ0+we5OXhb9PpsSQWP2DhPx9obn8C4O57+RNZEHwA3ADcAGg6CPwEDP/6AeCCSADcBd3cBAQCYLwIRRNZEHxFpbml0EYB4IJIZZ2V0QXJngi8AhTcuMC4xAMXqWXc=';

  const interfaceSourceCodePath = './test/integration/contracts/Interface.aes';
  let interfaceSourceCode: string;
  let interfaceFileSystem: Record<string, string>;
  const interfaceAci = [
    { namespace: { name: 'ListInternal', typedefs: [] } },
    { namespace: { name: 'List', typedefs: [] } },
    { namespace: { name: 'String', typedefs: [] } },
    {
      contract: {
        functions: [{
          arguments: [{ name: '_1', type: 'int' }],
          name: 'decrement',
          payable: false,
          returns: 'int',
          stateful: false,
        }],
        kind: 'contract_child',
        name: 'Decrement',
        payable: false,
        typedefs: [],
      },
    },
    {
      contract: {
        functions: [{
          arguments: [{ name: '_1', type: 'int' }],
          name: 'increment',
          payable: false,
          returns: 'int',
          stateful: false,
        }],
        kind: 'contract_main',
        name: 'Increment',
        payable: false,
        typedefs: [],
      },
    },
  ];

  before(async () => {
    inclSourceCode = await readFile(inclSourceCodePath, 'utf8');
    inclFileSystem = await getFileSystem(inclSourceCodePath);
    interfaceSourceCode = await readFile(interfaceSourceCodePath, 'utf8');
    interfaceFileSystem = await getFileSystem(interfaceSourceCodePath);
  });

  it('returns version', async () => {
    expect(await compiler.version()).to.be.equal('7.4.0');
  });

  it('compiles and generates aci by path', async () => {
    const { bytecode, aci } = await compiler.compile(inclSourceCodePath);
    expect(bytecode).to.equal(inclBytecode);
    expect(aci).to.eql(inclAci);
  });

  it('compiles and generates aci by source code', async () => {
    const { bytecode, aci } = await compiler.compileBySourceCode(inclSourceCode, inclFileSystem);
    expect(bytecode).to.equal(inclBytecode);
    expect(aci).to.eql(inclAci);
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
        ? /Command failed: escript .+[\\/]bin[\\/]aesophia_cli( --create_json_aci)? .+\.aes\nType error( in '.+\.aes')? at line 3, col 3:\nDuplicate definitions of `getArg` at\n {2}- line 2, column 3\n {2}- line 3, column 3\n\n/m
        : 'compile error:\n'
        + 'type_error:3:3: Duplicate definitions of `getArg` at\n'
        + '  - line 2, column 3\n'
        + '  - line 3, column 3\n'
        + 'type_error:3:32: Unbound variable `baz`\n'
        + 'type_error:4:33: Unbound variable `baz`',
    );
  });

  it('generates aci by path', async () => {
    const aci = await compiler.generateAci(interfaceSourceCodePath);
    expect(aci).to.eql(interfaceAci);
  });

  it('generates aci by source code', async () => {
    const aci = await compiler.generateAciBySourceCode(interfaceSourceCode, interfaceFileSystem);
    expect(aci).to.eql(interfaceAci);
  });

  it('validates bytecode by path', async () => {
    expect(await compiler.validate(inclBytecode, inclSourceCodePath)).to.be.equal(true);
    expect(await compiler.validate(testBytecode, inclSourceCodePath)).to.be.equal(false);
    const invalidBytecode = `${testBytecode}test` as Encoded.ContractBytearray;
    expect(await compiler.validate(invalidBytecode, inclSourceCodePath)).to.be.equal(false);
  });

  it('validates bytecode by source code', async () => {
    expect(await compiler.validateBySourceCode(inclBytecode, inclSourceCode, inclFileSystem))
      .to.be.equal(true);
    expect(await compiler.validateBySourceCode(testBytecode, inclSourceCode, inclFileSystem))
      .to.be.equal(false);
    const invalidBytecode = `${testBytecode}test` as Encoded.ContractBytearray;
    expect(await compiler.validateBySourceCode(invalidBytecode, inclSourceCode, inclFileSystem))
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
