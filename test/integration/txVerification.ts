import { before, describe, it } from 'mocha';
import { expect } from 'chai';
import { getSdk } from '.';
import {
  AeSdk, Node, InvalidTxError, ArgumentError, Tag, MemoryAccount, verifyTransaction, buildTxAsync,
} from '../../src';

describe('Verify Transaction', () => {
  let aeSdk: AeSdk;
  let node: Node;

  before(async () => {
    aeSdk = await getSdk();
    node = aeSdk.api;
    await aeSdk.spend(1234, 'ak_LAqgfAAjAbpt4hhyrAfHyVg9xfVQWsk1kaHaii6fYXt6AJAGe');
  });

  it('validates params in buildRawTx', async () => {
    await expect(aeSdk.buildTx({ tag: Tag.SpendTx } as any)).to.eventually.be
      .rejectedWith(ArgumentError, 'senderId should be provided (or provide `nonce` instead), got undefined instead');
  });

  it('returns errors', async () => {
    const spendTx = await aeSdk.buildTx({
      tag: Tag.SpendTx,
      senderId: aeSdk.address,
      recipientId: aeSdk.address,
      amount: 1e50,
      nonce: 1,
      ttl: 2,
      absoluteTtl: true,
    });
    const signedTx = await aeSdk.signTransaction(spendTx, { onAccount: MemoryAccount.generate() });
    const errors = await verifyTransaction(signedTx, node);
    expect(errors.map(({ key }) => key)).to.be.eql(['InvalidSignature', 'ExpiredTTL']);
  });

  it.skip('returns NonceHigh error', async () => {
    const spendTx = await aeSdk.buildTx({
      tag: Tag.SpendTx,
      senderId: aeSdk.address,
      recipientId: aeSdk.address,
      amount: 100,
      nonce: 100,
    });
    const errors = await verifyTransaction(spendTx, node);
    expect(errors.map(({ key }) => key)).to.be.eql(['NonceHigh']);
  });

  it('verifies transactions before broadcasting', async () => {
    const spendTx = await aeSdk.buildTx({
      tag: Tag.SpendTx,
      senderId: aeSdk.address,
      recipientId: aeSdk.address,
      amount: 1,
      ttl: 2,
      absoluteTtl: true,
    });
    const error = await aeSdk.sendTransaction(spendTx)
      .catch((e: InvalidTxError) => e) as InvalidTxError;
    expect(error.validation).to.have.lengthOf(1);
  });

  it('verifies vmVersion/abiVersion for contract transactions', async () => {
    // Contract create transaction with wrong abi/vm version (vm: 3, abi: 0)
    const contractCreateTx = 'tx_+QSaKgGhASLDuRmSBJZv91HE219uqXb2L0adh+bilzBWUi93m5blArkD+PkD9UYCoI2tdssfNdXZOclcaOwkTNB2S/SXIVsLDi7KUoxJ3Jki+QL7+QEqoGjyZ2M4/1CIOaukd0nv+ovofvKE8gf7PZmYcBzVOIfFhG1haW64wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACg//////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPkBy6C5yVbyizFJqfWYeqUF89obIgnMVzkjQAYrtsG9n5+Z6oRpbml0uGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////+5AUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAP//////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////////////////////////////////7jMYgAAZGIAAISRgICAUX+5yVbyizFJqfWYeqUF89obIgnMVzkjQAYrtsG9n5+Z6hRiAADAV1CAUX9o8mdjOP9QiDmrpHdJ7/qL6H7yhPIH+z2ZmHAc1TiHxRRiAACvV1BgARlRAFtgABlZYCABkIFSYCCQA2ADgVKQWWAAUVlSYABSYADzW2AAgFJgAPNbWVlgIAGQgVJgIJADYAAZWWAgAZCBUmAgkANgA4FSgVKQVltgIAFRUVlQgJFQUICQUJBWW1BQgpFQUGIAAIxWhTIuMS4wgwMAAIcF9clYKwgAAAAAgxgX+IQ7msoAuGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAILnJVvKLMUmp9Zh6pQXz2hsiCcxXOSNABiu2wb2fn5nqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkansY';
    const errors = await verifyTransaction(contractCreateTx, node);
    expect(errors.map(({ key }) => key)).to.include('VmAndAbiVersionMismatch');
  });

  it('verifies channel create tx', async () => {
    const channelCreate = 'tx_+IgyAqEBA36iFX3O+BMXMZJbffeT423KLpEuFsISUTsGu8Sb10eJBWvHXi1jEAAAoQGTnVZ1Jow5NGyBOg3NAf+ie3mV8qDj/wBwyKBHFNdhT4kFa8deLWMQAAAAAQCGECcSfcAAwMCgGAbROhx5lfoSkXsM5MQLw+EAWei3pcUGj/zWSO8RGkAKfIRASg==';
    const errors = await verifyTransaction(channelCreate, node);
    expect(errors).to.have.lengthOf(1);
  });

  it('verifies nameFee for nameClaim transaction', async () => {
    const nameClaim = await buildTxAsync({
      tag: Tag.NameClaimTx,
      accountId: aeSdk.address,
      name: 'someAuction.chain',
      nameSalt: 42,
      nameFee: 1e20,
      onNode: node,
    });
    const nameClaimSigned = await aeSdk.signTransaction(nameClaim);
    const errors = await verifyTransaction(nameClaimSigned, node);
    expect(errors.map(({ key }) => key)).to.eql(['InsufficientBalance']);
  });

  it('verifies contractId for contractCall transaction', async () => {
    const contractCall = 'tx_+GIrAaEBSzqoqjLLKO9NzXLgIBsTC+sNe5ronuTV/lr8IBJNlAECoQVsu3CPls4zVNRpYBFsOpvTFqgOE181MuyfIhOyaTAbZQOGpYctWWAAAACCE4iEO5rKAIgrEYB4IJIbCjOz7+M=';
    const errors = await verifyTransaction(contractCall, node);
    expect(errors.map(({ key }) => key)).to.include('ContractNotFound');
  });
});
