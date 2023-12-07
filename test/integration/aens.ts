import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { RestError } from '@azure/core-rest-pipeline';
import { getSdk } from '.';
import { assertNotNull, randomName, randomString } from '../utils';
import {
  AeSdk, Name, generateKeyPair, buildContractId, computeBidFee, ensureName, produceNameId,
  AensPointerContextError, encode, decode, Encoding, ContractMethodsBase, IllegalArgumentError,
  TxTimedOutError,
} from '../../src';

// TODO: avoid extra `assertNotNull` calls

describe('Aens', () => {
  let aeSdk: AeSdk;
  let name: Name;

  before(async () => {
    aeSdk = await getSdk(2);
    name = new Name(randomName(13), aeSdk.getContext()); // 13 name length doesn't trigger auction)
  });

  it('claims a name', async () => {
    const preclaimRes = await name.preclaim();
    assertNotNull(preclaimRes.tx);
    assertNotNull(preclaimRes.signatures);
    expect(preclaimRes).to.be.eql({
      tx: {
        fee: 16620000000000n,
        nonce: preclaimRes.tx.nonce,
        accountId: aeSdk.address,
        commitmentId: preclaimRes.tx.commitmentId,
        version: 1,
        type: 'NamePreclaimTx',
      },
      blockHeight: preclaimRes.blockHeight,
      blockHash: preclaimRes.blockHash,
      hash: preclaimRes.hash,
      signatures: [preclaimRes.signatures[0]],
      rawTx: preclaimRes.rawTx,
    });
    expect(preclaimRes.tx?.commitmentId).to.satisfy((s: string) => s.startsWith('cm_'));

    const claimRes = await name.claim();
    assertNotNull(claimRes.tx);
    assertNotNull(claimRes.signatures);
    expect(claimRes).to.be.eql({
      tx: {
        fee: claimRes.tx.fee,
        nonce: claimRes.tx.nonce,
        accountId: aeSdk.address,
        name: name.value,
        nameSalt: claimRes.tx.nameSalt,
        nameFee: 1771100000000000000n,
        version: 2,
        type: 'NameClaimTx',
      },
      blockHeight: claimRes.blockHeight,
      blockHash: claimRes.blockHash,
      hash: claimRes.hash,
      signatures: [claimRes.signatures[0]],
      rawTx: claimRes.rawTx,
    });
    expect(claimRes.tx.fee).to.be.oneOf([16660000000000n, 16680000000000n]);

    assertNotNull(claimRes.blockHeight);
    expect(await aeSdk.api.getNameEntryByName(name.value)).to.be.eql({
      id: produceNameId(name.value),
      owner: aeSdk.address,
      pointers: [],
      ttl: claimRes.blockHeight + 180000,
    });
  });

  it('claims a unicode name', async () => {
    const nameString = `испытаниЕ-æpP-${randomString(4)}.chain`;
    ensureName(nameString);
    const n = new Name(nameString, aeSdk.getContext());

    const preclaimRes = await n.preclaim();
    assertNotNull(preclaimRes.tx);
    expect(preclaimRes.tx?.fee).to.be.equal(16620000000000n);

    const claimRes = await n.claim();

    assertNotNull(claimRes.tx);
    expect(claimRes.tx.fee).to.be.oneOf([16940000000000n, 16960000000000n]);
    expect(claimRes.tx.name).to.be.equal(n.value);
    expect(claimRes.tx.nameFee).to.be.equal(300000000000000n);

    assertNotNull(claimRes.blockHeight);
    expect(await aeSdk.api.getNameEntryByName(n.value)).to.be.eql({
      id: produceNameId(n.value),
      owner: aeSdk.address,
      pointers: [],
      ttl: claimRes.blockHeight + 180000,
    });
  });

  it('preclaims name using specific account', async () => {
    const onAccount = Object.values(aeSdk.accounts)[1];
    const n = new Name(randomName(13), aeSdk.getContext());
    const preclaimRes = await n.preclaim({ onAccount });
    assertNotNull(preclaimRes.tx);
    expect(preclaimRes.tx.accountId).to.be.equal(onAccount.address);
  });

  it('starts a unicode name auction and makes a bid', async () => {
    const nameShortString = `æ${randomString(4)}.chain`;
    ensureName(nameShortString);
    const n = new Name(nameShortString, aeSdk.getContext());
    await n.preclaim();
    await n.claim();

    const bidFee = computeBidFee(n.value);
    const onAccount = Object.values(aeSdk.accounts)[1];
    const bidRes = await n.bid(bidFee, { onAccount });
    assertNotNull(bidRes.tx);
    assertNotNull(bidRes.signatures);
    expect(bidRes).to.be.eql({
      tx: {
        fee: bidRes.tx.fee,
        nonce: bidRes.tx.nonce,
        accountId: onAccount.address,
        name: nameShortString,
        nameSalt: 0,
        nameFee: 3008985000000000000n,
        version: 2,
        type: 'NameClaimTx',
      },
      blockHeight: bidRes.blockHeight,
      blockHash: bidRes.blockHash,
      hash: bidRes.hash,
      signatures: [bidRes.signatures[0]],
      rawTx: bidRes.rawTx,
    });
    await expect(n.getNodeState())
      .to.be.rejectedWith(RestError, `v3/names/%C3%A6${n.value.slice(1)} error: Name not found`);
  });

  it('queries state from the node', async () => {
    const state = await name.getNodeState();
    expect(state).to.be.eql(await aeSdk.api.getNameEntryByName(name.value));
  });

  it('throws error on querying non-existent name', async () => {
    const n = new Name(randomName(13), aeSdk.getContext());
    await expect(n.getNodeState())
      .to.be.rejectedWith(RestError, `v3/names/${n.value} error: Name not found`);
  });

  it('fails to spend to name with invalid pointers', async () => {
    const { pointers } = await name.getNodeState();
    pointers.length.should.be.equal(0);
    await expect(aeSdk.spend(100, name.value))
      .to.be.rejectedWith(AensPointerContextError, `Name ${name.value} don't have pointers for account_pubkey`);
  });

  it('calls contract using AENS name', async () => {
    const sourceCode = 'contract Identity ='
      + '  entrypoint getArg(x : int) = x';
    interface ContractApi extends ContractMethodsBase {
      getArg: (x: number) => bigint;
    }
    const contract = await aeSdk.initializeContract<ContractApi>({ sourceCode });
    await contract.$deploy([]);
    assertNotNull(contract.$options.address);
    await name.update({ contract_pubkey: contract.$options.address });

    const contractName = await aeSdk
      .initializeContract<ContractApi>({ sourceCode, address: name.value });
    // TODO: should be name id instead
    expect(contractName.$options.address).to.be.equal(contract.$options.address);
    expect((await contractName.getArg(42)).decodedResult).to.be.equal(42n);
  });

  const address = generateKeyPair().publicKey;
  const pointers = {
    myKey: address,
    account_pubkey: address,
    oracle_pubkey: encode(decode(address), Encoding.OracleAddress),
    channel: encode(decode(address), Encoding.Channel),
    contract_pubkey: buildContractId(address, 13),
  };
  const pointersNode = Object.entries(pointers).map(([key, id]) => ({ key, id }));

  it('updates', async () => {
    const updateRes = await name.update(pointers);
    assertNotNull(updateRes.tx);
    assertNotNull(updateRes.signatures);
    expect(updateRes).to.be.eql({
      tx: {
        fee: 21500000000000n,
        nonce: updateRes.tx.nonce,
        accountId: aeSdk.address,
        nameId: produceNameId(name.value),
        nameTtl: 180000,
        pointers: pointersNode,
        clientTtl: 3600,
        version: 1,
        type: 'NameUpdateTx',
      },
      blockHeight: updateRes.blockHeight,
      blockHash: updateRes.blockHash,
      hash: updateRes.hash,
      signatures: [updateRes.signatures[0]],
      rawTx: updateRes.rawTx,
    });
  });

  it('throws error on updating names not owned by the account', async () => {
    const n = new Name(randomName(13), aeSdk.getContext());
    await n.preclaim();
    await n.claim();
    const onAccount = Object.values(aeSdk.accounts)[1];
    await expect(n.update({}, { onAccount, blocks: 1 }))
      .to.be.rejectedWith(TxTimedOutError, 'Giving up after 1 blocks mined, transaction hash: th_');
  });

  it('updates extending pointers', async () => {
    const anotherContract = buildContractId(address, 12);
    const updateRes = await name
      .update({ contract_pubkey: anotherContract }, { extendPointers: true });
    assertNotNull(updateRes.tx);
    expect(updateRes.tx.pointers).to.be.eql([
      ...pointersNode.filter((pointer) => pointer.key !== 'contract_pubkey'),
      { key: 'contract_pubkey', id: anotherContract },
    ]);
  });

  it('throws error on setting 33 pointers', async () => {
    const pointers33 = Object.fromEntries(
      new Array(33).fill(undefined).map((v, i) => [`pointer-${i}`, address]),
    );
    await expect(name.update(pointers33))
      .to.be.rejectedWith(IllegalArgumentError, 'Expected 32 pointers or less, got 33 instead');
  });

  it('extends name ttl', async () => {
    const extendRes = await name.extendTtl(10000);
    assertNotNull(extendRes.blockHeight);
    const { ttl } = await name.getNodeState();
    expect(ttl).to.be.equal(extendRes.blockHeight + 10000);
  });

  it('spends by name', async () => {
    const onAccount = Object.values(aeSdk.accounts)[1];
    const spendRes = await aeSdk.spend(100, name.value, { onAccount });
    assertNotNull(spendRes.tx);
    expect(spendRes.tx.recipientId).to.be.equal(produceNameId(name.value));
  });

  it('transfers name', async () => {
    const recipient = aeSdk.addresses()[1];
    const transferRes = await name.transfer(recipient);
    assertNotNull(transferRes.tx);
    assertNotNull(transferRes.signatures);
    expect(transferRes).to.be.eql({
      tx: {
        fee: 17300000000000n,
        nonce: transferRes.tx.nonce,
        accountId: aeSdk.address,
        nameId: produceNameId(name.value),
        recipientId: recipient,
        version: 1,
        type: 'NameTransferTx',
      },
      blockHeight: transferRes.blockHeight,
      blockHash: transferRes.blockHash,
      hash: transferRes.hash,
      signatures: [transferRes.signatures[0]],
      rawTx: transferRes.rawTx,
    });
    await name.update({ account_pubkey: recipient }, { onAccount: aeSdk.accounts[recipient] });
  });

  it('revokes name', async () => {
    const onAccount = Object.values(aeSdk.accounts)[1];
    const revokeRes = await name.revoke({ onAccount });
    assertNotNull(revokeRes.tx);
    assertNotNull(revokeRes.signatures);
    expect(revokeRes).to.be.eql({
      tx: {
        fee: 16620000000000n,
        nonce: revokeRes.tx.nonce,
        accountId: onAccount.address,
        nameId: produceNameId(name.value),
        version: 1,
        type: 'NameRevokeTx',
      },
      blockHeight: revokeRes.blockHeight,
      blockHash: revokeRes.blockHash,
      hash: revokeRes.hash,
      signatures: [revokeRes.signatures[0]],
      rawTx: revokeRes.rawTx,
    });
    await expect(name.getNodeState())
      .to.be.rejectedWith(RestError, `v3/names/${name.value} error: Name revoked`);
  });
});
