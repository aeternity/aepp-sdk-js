import { before, describe, it } from 'mocha';
import { expect } from 'chai';
import { getSdk } from '.';
import {
  AeSdk,
  generateKeyPair,
  genSalt,
  MemoryAccount,
  AccountGeneralized,
  Tag,
  unpackTx,
  buildTx,
  Contract,
} from '../../src';
import { Encoded } from '../../src/utils/encoder';
import { ContractMethodsBase } from '../../src/contract/Contract';
import { ensureEqual } from '../utils';

const sourceCode = `contract BlindAuth =
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

interface ContractApi extends ContractMethodsBase {
  init: () => void;
  getTxHash: () => Uint8Array | undefined;
  authorize: (r: number) => boolean;
}

describe('Generalized Account', () => {
  let aeSdk: AeSdk;
  let accountBeforeGa: MemoryAccount;
  let gaAccountAddress: Encoded.AccountAddress;
  let authContract: Contract<ContractApi>;

  before(async () => {
    aeSdk = await getSdk();
    gaAccountAddress = aeSdk.address;
  });

  it('Make account GA', async () => {
    accountBeforeGa = Object.values(aeSdk.accounts)[0] as MemoryAccount;
    const { gaContractId } = await aeSdk.createGeneralizedAccount('authorize', [], { sourceCode });
    expect((await aeSdk.getAccount(gaAccountAddress)).kind).to.be.equal('generalized');
    authContract = await aeSdk.initializeContract({ sourceCode, address: gaContractId });
  });

  it('Fail on make GA on already GA', async () => {
    await aeSdk.createGeneralizedAccount('authorize', [], { sourceCode })
      .should.be.rejectedWith(`Account ${gaAccountAddress} is already GA`);
  });

  const { publicKey } = generateKeyPair();

  it('Init MemoryAccount for GA and Spend using GA', async () => {
    aeSdk.removeAccount(gaAccountAddress);
    aeSdk.addAccount(new AccountGeneralized(gaAccountAddress), { select: true });

    const callData = authContract._calldata.encode('BlindAuth', 'authorize', [genSalt()]);
    await aeSdk.spend(10000, publicKey, { authData: { callData } });
    await aeSdk.spend(10000, publicKey, { authData: { sourceCode, args: [genSalt()] } });
    expect(await aeSdk.getBalance(publicKey)).to.be.equal(20000n);
  });

  it('throws error if gasLimit exceeds the maximum value', async () => {
    const authData = { sourceCode, args: [genSalt()], gasLimit: 50001 };
    await expect(aeSdk.spend(10000, publicKey, { authData }))
      .to.be.rejectedWith('Gas limit 50001 must be less or equal to 50000');
  });

  it('buildAuthTxHash generates a proper hash', async () => {
    const { rawTx } = await aeSdk
      .spend(10000, publicKey, { authData: { sourceCode, args: [genSalt()] } });
    const gaMetaTxParams = unpackTx(rawTx, Tag.SignedTx).encodedTx;
    if (gaMetaTxParams.tag !== Tag.GaMetaTx) throw new Error('Unexpected nested transaction');
    const spendTx = buildTx(gaMetaTxParams.tx.encodedTx);
    expect(await aeSdk.buildAuthTxHash(spendTx)).to.be
      .eql((await authContract.getTxHash()).decodedResult);
  });

  it('accepts a function in authData', async () => {
    let spendTx;
    const { rawTx } = await aeSdk.spend(10000, publicKey, {
      authData: async (tx) => {
        spendTx = tx;
        return { sourceCode, args: [genSalt()] };
      },
    });
    const txParams = unpackTx(rawTx, Tag.SignedTx);
    ensureEqual<Tag.GaMetaTx>(txParams.encodedTx.tag, Tag.GaMetaTx);
    expect(buildTx(txParams.encodedTx.tx.encodedTx)).to.be.equal(spendTx);
  });

  it('fails trying to send SignedTx using generalized account', async () => {
    await expect(aeSdk.spend(1, gaAccountAddress, { onAccount: accountBeforeGa })).to.be
      .rejectedWith('Generalized account can\'t be used to generate SignedTx with signatures');
  });

  it('fails trying to send GaMeta using basic account', async () => {
    const options = {
      onAccount: new AccountGeneralized(publicKey),
      authData: { callData: 'cb_KxFs8lcLG2+HEPb2FOjjZ2DqRd4=' },
    } as const;
    await expect(aeSdk.spend(1, gaAccountAddress, options))
      .to.be.rejectedWith('Basic account can\'t be used to generate GaMetaTx');
  });
});
