import { before, describe, it } from 'mocha';
import { expect } from 'chai';
import { getSdk } from '.';
import {
  AeSdk,
  genSalt,
  AccountMemory,
  AccountGeneralized,
  Tag,
  unpackTx,
  buildTx,
  Contract,
  ContractMethodsBase,
  MIN_GAS_PRICE,
  Encoded,
  ArgumentError,
} from '../../src';
import { ensureEqual, indent } from '../utils';

const sourceCode = `
contract BlindAuth =
  record state = { txHash: option(hash) }
  entrypoint init() : state = { txHash = None }

  entrypoint getTxHash() : option(hash) = state.txHash

  stateful entrypoint authorize(r: int) : bool =
    // r is a random number only used to make call arguments unique
    put(state{ txHash = Auth.tx_hash })
    switch(Auth.tx_hash)
      None          => abort("Not in Auth context")
      Some(tx_hash) => true
`;

interface ContractApi extends ContractMethodsBase {
  init: () => void;
  getTxHash: () => Uint8Array | undefined;
  authorize: (r: number) => boolean;
}

describe('Generalized Account', () => {
  let aeSdk: AeSdk;
  let accountBeforeGa: AccountMemory;
  let gaAccountAddress: Encoded.AccountAddress;
  let authContract: Contract<ContractApi>;

  before(async () => {
    aeSdk = await getSdk();
    gaAccountAddress = aeSdk.address;
  });

  it('Make account GA', async () => {
    accountBeforeGa = Object.values(aeSdk.accounts)[0] as AccountMemory;
    const { gaContractId } = await aeSdk.createGeneralizedAccount('authorize', [], { sourceCode });
    expect((await aeSdk.getAccount(gaAccountAddress)).kind).to.equal('generalized');
    authContract = await Contract.initialize({
      ...aeSdk.getContext(),
      sourceCode,
      address: gaContractId,
    });
  });

  it('Fail on make GA on already GA', async () => {
    await expect(
      aeSdk.createGeneralizedAccount('authorize', [], { sourceCode }),
    ).to.be.rejectedWith(`Account ${gaAccountAddress} is already GA`);
  });

  it('fails to build GaAttachTx with non-1 nonce', () => {
    expect(() =>
      buildTx({
        tag: Tag.GaAttachTx,
        version: 1,
        ownerId: 'ak_Yd9EiaBy8GNXWLkMuH53H9hiCyEuL3RKxN4wYKhN8xDnjKRpb',
        nonce: 2,
        code: 'cb_+LJGA6BFoqzc6YC/ewZLk3eumqCWL/K7O2Wqy+x14Zbcx4rB0MC4hbhV/kTWRB8ANwA3ABoOgq+CAAEAPwEDP/5s8lcLADcBBxd3AoJ3AAg8AgT7A01Ob3QgaW4gQXV0aCBjb250ZXh0AQP//qsVVmEANwCHAjcANwGXQAECgqovAxFE1kQfEWluaXQRbPJXCyVhdXRob3JpemURqxVWYSVnZXRUeEhhc2iCLwCFOC4wLjAAdzf5cQ==',
        authFun: Buffer.from(
          '6cf2570b0a1599b708291e50aa3daf13d0c7f2484bc337ddad2413a37fd4a009',
          'hex',
        ),
        ctVersion: { vmVersion: 8, abiVersion: 3 },
        fee: '80620000000000',
        ttl: 0,
        gasLimit: 107,
        gasPrice: '1000000000',
        callData: 'cb_KxFE1kQfP4oEp9E=',
      }),
    ).to.throw(ArgumentError, 'nonce should be equal 1 if GaAttachTx, got 2 instead');
  });

  const recipient = AccountMemory.generate().address;

  it('Init AccountMemory for GA and Spend using GA', async () => {
    aeSdk.removeAccount(gaAccountAddress);
    aeSdk.addAccount(new AccountGeneralized(gaAccountAddress), { select: true });

    const callData = authContract._calldata.encode('BlindAuth', 'authorize', [genSalt()]);
    await aeSdk.spend(10000, recipient, { authData: { callData } });
    await aeSdk.spend(10000, recipient, { authData: { sourceCode, args: [genSalt()] } });
    const balanceAfter = await aeSdk.getBalance(recipient);
    expect(balanceAfter).to.equal('20000');
  });

  it('throws error if gasLimit exceeds the maximum value', async () => {
    const authData = { sourceCode, args: [genSalt()], gasLimit: 50001 };
    await expect(aeSdk.spend(10000, recipient, { authData })).to.be.rejectedWith(
      'Gas limit 50001 must be less or equal to 50000',
    );
  });

  it('buildAuthTxHash generates a proper hash', async () => {
    const { rawTx } = await aeSdk.spend(10000, recipient, {
      authData: { sourceCode, args: [genSalt()] },
    });

    expect(new Uint8Array(await aeSdk.buildAuthTxHashByGaMetaTx(rawTx))).to.eql(
      (await authContract.getTxHash()).decodedResult,
    );

    const gaMetaTxParams = unpackTx(rawTx, Tag.SignedTx).encodedTx;
    ensureEqual<Tag.GaMetaTx>(gaMetaTxParams.tag, Tag.GaMetaTx);
    const spendTx = buildTx(gaMetaTxParams.tx.encodedTx);
    const { fee, gasPrice } = gaMetaTxParams;
    expect(new Uint8Array(await aeSdk.buildAuthTxHash(spendTx, { fee, gasPrice }))).to.eql(
      (await authContract.getTxHash()).decodedResult,
    );
  });

  it('accepts a function in authData', async () => {
    let spendTx;
    const fee = 1e15;
    const gasPrice = MIN_GAS_PRICE + 1;
    const { rawTx } = await aeSdk.spend(10000, recipient, {
      authData: async (tx) => {
        spendTx = tx;
        return {
          sourceCode,
          args: [genSalt()],
          fee,
          gasPrice,
        };
      },
    });
    const txParams = unpackTx(rawTx, Tag.SignedTx);
    ensureEqual<Tag.GaMetaTx>(txParams.encodedTx.tag, Tag.GaMetaTx);
    expect(buildTx(txParams.encodedTx.tx.encodedTx)).to.equal(spendTx);
    expect(txParams.encodedTx.fee).to.equal(fee.toString());
    expect(txParams.encodedTx.gasPrice).to.equal(gasPrice.toString());
  });

  it('fails trying to send SignedTx using generalized account', async () => {
    await expect(
      aeSdk.spend(1, gaAccountAddress, { onAccount: accountBeforeGa }),
    ).to.be.rejectedWith("Generalized account can't be used to generate SignedTx with signatures");
  });

  it('fails trying to send GaMeta using basic account', async () => {
    const options = {
      onAccount: new AccountGeneralized(recipient),
      authData: { callData: 'cb_KxFs8lcLG2+HEPb2FOjjZ2DqRd4=' },
    } as const;
    await expect(aeSdk.spend(1, gaAccountAddress, options)).to.be.rejectedWith(
      "Basic account can't be used to generate GaMetaTx",
    );
  });

  // TODO: enable after resolving https://github.com/aeternity/aeternity/issues/4087
  // TODO: copy to examples/node/account-generalized.js
  it.skip('deploys and calls contract', async () => {
    const contract = await Contract.initialize<{
      init: (value: number) => void;
      getState: () => number;
      setState: (value: number) => void;
    }>({
      ...aeSdk.getContext(),
      sourceCode: indent`
        contract Stateful =
          record state = { value: int }
          entrypoint init(_value: int) : state = { value = _value }
          entrypoint getState(): int = state.value
          stateful entrypoint setState(_value: int): unit =
            put(state{ value = _value })`,
    });
    await contract.$deploy([42], { authData: { sourceCode, args: [genSalt()] } });
    expect((await contract.getState()).decodedResult).to.equal(42);
    await contract.setState(43, { authData: { sourceCode, args: [genSalt()] } });
    expect((await contract.getState()).decodedResult).to.equal(43);
  });
});
