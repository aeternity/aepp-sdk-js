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
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { readFile } from 'fs/promises';
import { compilerUrl, ignoreVersion } from '.';
import { CompilerError, CompilerHttp, getFileSystem } from '../../src';
import { Encoded } from '../../src/utils/encoder';

describe('Sophia Compiler', () => {
  const compiler = new CompilerHttp(compilerUrl, { ignoreVersion });
  const testSourceCodePath = './test/integration/contracts/Includes.aes';
  let testSourceCode: string;
  let testFileSystem: Record<string, string>;
  const testBytecode = 'cb_+QEGRgOg7BH1sCv+p2IrS0Pn3/i6AfE8lOGUuC71lLPn6mbUm9PAuNm4cv4AWolkAjcCBwcHFBQAAgD+RNZEHwA3ADcAGg6CPwEDP/5Nt4A5AjcCBwcHDAECDAEABAMRAFqJZP6SiyA2ADcBBwcMAwgMAQAEAxFNt4A5/pSgnxIANwF3BwwBAAQDEarAwob+qsDChgI3AXcHPgQAALhgLwYRAFqJZD0uU3VibGlicmFyeS5zdW0RRNZEHxFpbml0EU23gDkxLkxpYnJhcnkuc3VtEZKLIDYRdGVzdBGUoJ8SJWdldExlbmd0aBGqwMKGOS5TdHJpbmcubGVuZ3Rogi8AhTcuMC4xAGzn9fM=';
  const testBytecode2 = 'cb_+GhGA6BgYgXqYB9ctBcQ8mJ0+we5OXhb9PpsSQWP2DhPx9obn8C4O57+RNZEHwA3ADcAGg6CPwEDP/6AeCCSADcBd3cBAQCYLwIRRNZEHxFpbml0EYB4IJIZZ2V0QXJngi8AhTcuMC4xAMXqWXc=';

  before(async () => {
    testSourceCode = await readFile(testSourceCodePath, 'utf8');
    testFileSystem = await getFileSystem(testSourceCodePath);
  });

  it('returns version', async () => {
    expect(await compiler.version()).to.be.equal('7.0.1');
  });

  it('compiles and generates aci by path', async () => {
    const { bytecode, aci } = await compiler.compile(testSourceCodePath);
    expect(bytecode).to.equal(testBytecode);
    expect(aci).to.have.property('encodedAci');
    expect(aci).to.have.property('externalEncodedAci');
    expect(aci).to.have.property('interface');
  });

  it('compiles and generates aci by source code', async () => {
    const { bytecode, aci } = await compiler.compileBySourceCode(testSourceCode, testFileSystem);
    expect(bytecode).to.equal(testBytecode);
    expect(aci).to.have.property('encodedAci');
    expect(aci).to.have.property('externalEncodedAci');
    expect(aci).to.have.property('interface');
  });

  it('throws clear exception if compile broken contract', async () => {
    await expect(compiler.compileBySourceCode(
      'contract Foo =\n'
      + '  entrypoint getArg(x : bar) = x\n'
      + '  entrypoint getArg(x : int) = baz\n'
      + '  entrypoint getArg1(x : int) = baz\n',
    )).to.be.rejectedWith(
      CompilerError,
      'compile error:\n'
      + 'type_error:3:3: Duplicate definitions of `getArg` at\n'
      + '  - line 2, column 3\n'
      + '  - line 3, column 3\n'
      + 'type_error:3:32: Unbound variable `baz`\n'
      + 'type_error:4:33: Unbound variable `baz`',
    );
  });

  it('validates bytecode by path', async () => {
    expect(await compiler.validate(testBytecode, testSourceCodePath))
      .to.be.equal(true);
    expect(await compiler.validate(testBytecode2, testSourceCodePath)).to.be.equal(false);
    const invalidBytecode = `${testBytecode2}test` as Encoded.ContractBytearray;
    expect(await compiler.validate(invalidBytecode, testSourceCodePath))
      .to.be.equal(false);
  });

  it('validates bytecode by source code', async () => {
    expect(await compiler.validateBySourceCode(testBytecode, testSourceCode, testFileSystem))
      .to.be.equal(true);
    expect(await compiler.validateBySourceCode(testBytecode2, testSourceCode)).to.be.equal(false);
    const invalidBytecode = `${testBytecode2}test` as Encoded.ContractBytearray;
    expect(await compiler.validateBySourceCode(invalidBytecode, testSourceCode))
      .to.be.equal(false);
  });

  it('throws exception if used invalid compiler url', async () => {
    const c = new CompilerHttp('https://compiler.aepps.comas');
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
