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
import BigNumber from 'bignumber.js';
import { getSdk, BaseAe } from '.';
import {
  AeSdk, generateKeyPair, MemoryAccount, TX_TYPE, UnexpectedTsError,
} from '../../src';
import { ContractInstance } from '../../src/contract/aci';
import { EncodedData } from '../../src/utils/encoder';

describe('Paying for transaction of another account', () => {
  let aeSdk: AeSdk;

  before(async () => {
    aeSdk = await getSdk();
  });

  it('pays for spend transaction', async () => {
    const sender = new MemoryAccount({ keypair: generateKeyPair() });
    const receiver = new MemoryAccount({ keypair: generateKeyPair() });
    await aeSdk.spend(1e4, await sender.address());
    const spendTx = await aeSdk.buildTx(TX_TYPE.spend, {
      senderId: await sender.address(),
      recipientId: await receiver.address(),
      amount: 1e4,
    });
    const signedSpendTx = await aeSdk.signTransaction(spendTx, { onAccount: sender, innerTx: true });
    const payerBalanceBefore = await aeSdk.getBalance(await aeSdk.address());

    const { tx } = await aeSdk.payForTransaction(signedSpendTx);
    const outerFee = tx?.fee;
    const innerFee = tx?.tx?.tx.fee;
    if (outerFee == null || innerFee == null) throw new UnexpectedTsError();
    expect(await aeSdk.getBalance(await aeSdk.address())).to.equal(
      new BigNumber(payerBalanceBefore)
        .minus(outerFee.toString()).minus(innerFee.toString()).toFixed(),
    );
    expect(await aeSdk.getBalance(await sender.address())).to.equal('0');
    expect(await aeSdk.getBalance(await receiver.address())).to.equal('10000');
  });

  const contractSource = `
    contract Test =
      record state = { value: int }
      entrypoint init(x: int): state = { value = x }
      entrypoint getValue(): int = state.value
      stateful entrypoint setValue(x: int) = put(state{ value = x })`;
  let contractAddress: EncodedData<'ct'>;
  let aeSdkNotPayingFee: any;
  let payingContract: ContractInstance;

  it('pays for contract deployment', async () => {
    aeSdkNotPayingFee = await BaseAe({
      withoutGenesisAccount: true,
      accounts: [new MemoryAccount({ keypair: generateKeyPair() })],
      waitMined: false,
      innerTx: true,
    });
    const contract = await aeSdkNotPayingFee.getContractInstance({ source: contractSource });
    const { rawTx: contractDeployTx, address } = await contract.deploy([42]);
    contractAddress = address;
    await aeSdk.payForTransaction(contractDeployTx);
    payingContract = await aeSdkNotPayingFee.getContractInstance(
      { source: contractSource, contractAddress },
    );
    expect((await payingContract.methods.getValue()).decodedResult).to.be.equal(42n);
  });

  it('pays for contract call', async () => {
    const contract = await aeSdkNotPayingFee.getContractInstance(
      { source: contractSource, contractAddress },
    );
    const { rawTx: contractCallTx } = await contract.methods.setValue(43);
    await aeSdk.payForTransaction(contractCallTx);
    expect((await payingContract.methods.getValue()).decodedResult).to.be.equal(43n);
  });
});
