import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import BigNumber from 'bignumber.js';
import { getSdk } from '.';
import {
  AeSdk, Contract, MemoryAccount, Tag, UnexpectedTsError, Encoded,
} from '../../src';
import { InputNumber, assertNotNull } from '../utils';

describe('Paying for transaction of another account', () => {
  let aeSdk: AeSdk;

  before(async () => {
    aeSdk = await getSdk();
  });

  it('pays for spend transaction', async () => {
    const sender = MemoryAccount.generate();
    const receiver = MemoryAccount.generate();
    await aeSdk.spend(1e4, sender.address);
    const spendTx = await aeSdk.buildTx({
      tag: Tag.SpendTx,
      senderId: sender.address,
      recipientId: receiver.address,
      amount: 1e4,
    });
    const signedSpendTx = await aeSdk
      .signTransaction(spendTx, { onAccount: sender, innerTx: true });
    const payerBalanceBefore = await aeSdk.getBalance(aeSdk.address);

    const { tx } = await aeSdk.payForTransaction(signedSpendTx);
    const outerFee = tx?.fee;
    const innerFee = tx?.tx?.tx.fee;
    if (outerFee == null || innerFee == null) throw new UnexpectedTsError();
    expect(await aeSdk.getBalance(aeSdk.address)).to.equal(
      new BigNumber(payerBalanceBefore)
        .minus(outerFee.toString()).minus(innerFee.toString()).toFixed(),
    );
    expect(await aeSdk.getBalance(sender.address)).to.equal('0');
    expect(await aeSdk.getBalance(receiver.address)).to.equal('10000');
  });

  const sourceCode = `
    contract Test =
      record state = { value: int }
      entrypoint init(x: int): state = { value = x }
      entrypoint getValue(): int = state.value
      stateful entrypoint setValue(x: int) = put(state{ value = x })`;

  let contractAddress: Encoded.ContractAddress;
  let aeSdkNotPayingFee: AeSdk;
  type TestContract = Contract<{
    init: (x: InputNumber) => void;
    getValue: () => bigint;
    setValue: (x: InputNumber) => void;
  }>;
  let payingContract: TestContract;

  it('pays for contract deployment', async () => {
    aeSdkNotPayingFee = await getSdk(0);
    aeSdkNotPayingFee.addAccount(MemoryAccount.generate(), { select: true });
    Object.assign(aeSdkNotPayingFee._options, {
      waitMined: false,
      innerTx: true,
    });
    const contract: TestContract = await Contract.initialize({
      ...aeSdkNotPayingFee.getContext(), sourceCode,
    });
    const { rawTx: contractDeployTx, address } = await contract.$deploy([42]);
    assertNotNull(address);
    contractAddress = address;
    await aeSdk.payForTransaction(contractDeployTx);
    payingContract = await Contract.initialize({
      ...aeSdkNotPayingFee.getContext(), sourceCode, address,
    });
    expect((await payingContract.getValue()).decodedResult).to.be.equal(42n);
  });

  it('pays for contract call', async () => {
    const contract = await Contract.initialize({
      ...aeSdkNotPayingFee.getContext(), sourceCode, address: contractAddress,
    });
    const { rawTx: contractCallTx } = await contract.setValue(43);
    await aeSdk.payForTransaction(contractCallTx);
    expect((await payingContract.getValue()).decodedResult).to.be.equal(43n);
  });
});
