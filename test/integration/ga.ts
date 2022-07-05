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

import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { getSdk } from '.';
import { generateKeyPair } from '../../src/utils/crypto';
import { encode } from '../../src/utils/encoder';
import MemoryAccount from '../../src/account/Memory';
import { unpackTx } from '../../src/tx/builder';
import { ContractInstance } from '../../src/contract/aci';
import { AeSdk, TX_TYPE, UnexpectedTsError } from '../../src';

const authContractSource = `contract BlindAuth =
  record state = { txHash: option(hash) }
  entrypoint init() : state = { txHash = None }

  entrypoint getTxHash() : option(hash) = state.txHash

  stateful entrypoint authorize(r: int) : bool =
    // r is a random number only used to make tx hashes unique
    put(state{ txHash = Auth.tx_hash })
    switch(Auth.tx_hash)
      None          => abort("Not in Auth context")
      Some(tx_hash) => true
`;
describe('Generalized Account', () => {
  let aeSdk: AeSdk;
  const gaAccount = generateKeyPair();
  let authContract: ContractInstance;

  before(async () => {
    aeSdk = await getSdk();
    await aeSdk.spend('100000000000000000000', gaAccount.publicKey);
    if (aeSdk.selectedAddress == null) throw new UnexpectedTsError();
    aeSdk.removeAccount(aeSdk.selectedAddress);
    await aeSdk.addAccount(new MemoryAccount({ keypair: gaAccount }), { select: true });
  });

  it('Make account GA', async () => {
    const { gaContractId } = await aeSdk.createGeneralizedAccount('authorize', authContractSource, []);
    const isGa = await aeSdk.isGA(gaAccount.publicKey);
    isGa.should.be.equal(true);
    authContract = await aeSdk.getContractInstance({
      source: authContractSource, contractAddress: gaContractId,
    });
  });

  it('Fail on make GA on already GA', async () => {
    await aeSdk.createGeneralizedAccount('authorize', authContractSource, [])
      .should.be.rejectedWith(`Account ${gaAccount.publicKey} is already GA`);
  });

  const r = (): string => Math.floor(Math.random() * 20).toString();
  const { publicKey } = generateKeyPair();

  it('Init MemoryAccount for GA and Spend using GA', async () => {
    aeSdk.removeAccount(gaAccount.publicKey);
    await aeSdk.addAccount(new MemoryAccount({ gaId: gaAccount.publicKey }), { select: true });

    const callData = authContract.calldata.encode('BlindAuth', 'authorize', [r()]);
    await aeSdk.spend(10000, publicKey, { authData: { callData } });
    await aeSdk.spend(10000, publicKey, { authData: { source: authContractSource, args: [r()] } });
    const balanceAfter = await aeSdk.getBalance(publicKey);
    balanceAfter.should.be.equal('20000');
  });

  it('buildAuthTxHash generates a proper hash', async () => {
    const { rawTx } = await aeSdk
      .spend(10000, publicKey, { authData: { source: authContractSource, args: [r()] } });
    const spendTx = encode(unpackTx(rawTx, TX_TYPE.signed).tx.encodedTx.tx.tx.tx.encodedTx.rlpEncoded, 'tx');
    expect(await aeSdk.buildAuthTxHash(spendTx)).to.be
      .eql((await authContract.methods.getTxHash()).decodedResult);
  });
});