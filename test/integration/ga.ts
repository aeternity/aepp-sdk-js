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

import { before, describe, it } from 'mocha';
import { expect } from 'chai';
import { getSdk } from '.';
import {
  AeSdk, generateKeyPair, genSalt, MemoryAccount, AccountGeneralized, Tag, unpackTx, createMetaTx,
} from '../../src';
import { encode, Encoded, Encoding } from '../../src/utils/encoder';
import { ContractInstance } from '../../src/contract/aci';

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
  let accountBeforeGa: MemoryAccount;
  let gaAccountAddress: Encoded.AccountAddress;
  let authContract: ContractInstance;

  before(async () => {
    aeSdk = await getSdk();
    gaAccountAddress = await aeSdk.address();
  });

  it('Make account GA', async () => {
    accountBeforeGa = Object.values(aeSdk.accounts)[0] as MemoryAccount;
    const { gaContractId } = await aeSdk.createGeneralizedAccount('authorize', authContractSource, []);
    expect((await aeSdk.getAccount(gaAccountAddress)).kind).to.be.equal('generalized');
    authContract = await aeSdk.getContractInstance({
      source: authContractSource, contractAddress: gaContractId,
    });
  });

  it('Fail on make GA on already GA', async () => {
    await aeSdk.createGeneralizedAccount('authorize', authContractSource, [])
      .should.be.rejectedWith(`Account ${gaAccountAddress} is already GA`);
  });

  const { publicKey, secretKey } = generateKeyPair();

  it('Init MemoryAccount for GA and Spend using GA', async () => {
    aeSdk.removeAccount(gaAccountAddress);
    aeSdk.addAccount(new AccountGeneralized(gaAccountAddress), { select: true });

    const callData = authContract.calldata.encode('BlindAuth', 'authorize', [genSalt()]);
    await aeSdk.spend(10000, publicKey, { authData: { callData } });
    await aeSdk
      .spend(10000, publicKey, { authData: { source: authContractSource, args: [genSalt()] } });
    const balanceAfter = await aeSdk.getBalance(publicKey);
    balanceAfter.should.be.equal('20000');
  });

  it('buildAuthTxHash generates a proper hash', async () => {
    const { rawTx } = await aeSdk
      .spend(10000, publicKey, { authData: { source: authContractSource, args: [genSalt()] } });
    const spendTx = encode(
      unpackTx(rawTx, Tag.SignedTx).tx.encodedTx.tx.tx.tx.encodedTx.rlpEncoded,
      Encoding.Transaction,
    );
    expect(await aeSdk.buildAuthTxHash(spendTx)).to.be
      .eql((await authContract.methods.getTxHash()).decodedResult);
  });

  it('fails trying to send SignedTx using generalized account', async () => {
    await expect(aeSdk.spend(1, gaAccountAddress, { onAccount: accountBeforeGa })).to.be
      .rejectedWith('Generalized account can\'t be used to generate SignedTx with signatures');
  });

  it('fails trying to send GaMeta using basic account', async () => {
    const onAccount = new MemoryAccount(secretKey);
    const spendTx = await aeSdk.buildTx(Tag.SpendTx, {
      amount: 1,
      senderId: onAccount.address,
      recipientId: gaAccountAddress,
    });
    const signedTx = await createMetaTx(
      spendTx,
      { source: authContractSource, args: [genSalt()] },
      'authorize',
      { onNode: aeSdk.api, onCompiler: aeSdk.compilerApi, onAccount },
    );
    await expect(aeSdk.sendTransaction(signedTx)).to.be
      .rejectedWith('Basic account can\'t be used to generate GaMetaTx');
  });
});
