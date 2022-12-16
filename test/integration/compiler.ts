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
import { compilerUrl, ignoreVersion } from '.';
import { CompilerError, CompilerHttp } from '../../src';
import { Encoded } from '../../src/utils/encoder';

const identitySourceCode = `
contract Identity =
 entrypoint getArg(x : int) = x
`;

describe('Sophia Compiler', () => {
  const compiler = new CompilerHttp(compilerUrl, { ignoreVersion });
  let identityBytecode: Encoded.ContractBytearray;

  it('returns version', async () => {
    expect(await compiler.version()).to.be.equal('7.0.1');
  });

  it('compiles and generates aci', async () => {
    const { bytecode, aci } = await compiler.compileBySourceCode(identitySourceCode);
    expect(bytecode).to.satisfy((b: string) => b.startsWith('cb_'));
    expect(aci).to.have.property('encodedAci');
    expect(aci).to.have.property('externalEncodedAci');
    expect(aci).to.have.property('interface');
    identityBytecode = bytecode;
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

  it('validates bytecode', async () => {
    expect(await compiler.validateBySourceCode(identityBytecode, identitySourceCode))
      .to.be.equal(true);
    const { bytecode } = await compiler.compileBySourceCode(
      'contract Identity =\n'
      + '  entrypoint getArg(x : string) = x',
    );
    expect(await compiler.validateBySourceCode(bytecode, identitySourceCode)).to.be.equal(false);
    const invalidBytecode = `${bytecode}test` as Encoded.ContractBytearray;
    expect(await compiler.validateBySourceCode(invalidBytecode, identitySourceCode))
      .to.be.equal(false);
  });

  it('throws exception if used invalid compiler url', async () => {
    const c = new CompilerHttp('https://compiler.aepps.comas');
    await expect(c.compileBySourceCode('test'))
      .to.be.rejectedWith('getaddrinfo ENOTFOUND compiler.aepps.comas');
  });
});
