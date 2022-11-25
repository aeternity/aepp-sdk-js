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
import { Compiler } from '../../src';
import { Encoded } from '../../src/utils/encoder';

const identitySourceCode = `
contract Identity =
 entrypoint getArg(x : int) = x
`;

describe('Sophia Compiler', () => {
  const compiler = new Compiler(compilerUrl, { ignoreVersion });
  let bytecode: Encoded.ContractBytearray;

  it('compiles', async () => {
    bytecode = (await compiler.compileContract({ code: identitySourceCode }))
      .bytecode as Encoded.ContractBytearray;
    expect(bytecode).to.satisfy((b: string) => b.startsWith('cb_'));
  });

  it('throws clear exception if compile broken contract', async () => {
    await expect(compiler.compileContract({
      code:
        'contract Foo =\n'
        + '  entrypoint getArg(x : bar) = x\n'
        + '  entrypoint getArg(x : int) = baz\n'
        + '  entrypoint getArg1(x : int) = baz\n',
    })).to.be.rejectedWith(
      'compile error:\n'
      + 'type_error:3:3: Duplicate definitions of `getArg` at\n'
      + '  - line 2, column 3\n'
      + '  - line 3, column 3\n'
      + 'type_error:3:32: Unbound variable `baz`\n'
      + 'type_error:4:33: Unbound variable `baz`',
    );
  });

  it('generates contract ACI', async () => {
    const aci = await compiler.generateACI({ code: identitySourceCode });
    expect(aci).to.have.property('encodedAci');
    expect(aci).to.have.property('externalEncodedAci');
    expect(aci).to.have.property('interface');
  });

  it('throws clear exception if generating ACI with no arguments', async () => {
    await expect(compiler.generateACI({} as any))
      .to.be.rejectedWith('Error "body.code cannot be null or undefined." occurred in serializing the payload - undefined');
  });

  it('validates bytecode', async () => {
    expect(await compiler.validateByteCode({ bytecode, source: identitySourceCode }))
      .to.be.eql({ body: {} });
  });

  it('throws exception if used invalid compiler url', async () => {
    const c = new Compiler('https://compiler.aepps.comas');
    await expect(c.generateACI({ code: 'test' }))
      .to.be.rejectedWith('getaddrinfo ENOTFOUND compiler.aepps.comas');
  });
});
