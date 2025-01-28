import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { RestError } from '@azure/core-rest-pipeline';
import { getSdk, isLimitedCoins, timeoutBlock } from '.';
import { assertNotNull, ensureEqual, indent, randomName, randomString } from '../utils';
import {
  AeSdk,
  Name,
  MemoryAccount,
  buildContractId,
  computeBidFee,
  ensureName,
  produceNameId,
  Contract,
  AensPointerContextError,
  encode,
  decode,
  Encoding,
  ContractMethodsBase,
  IllegalArgumentError,
  Tag,
  unpackTx,
  buildTxHash,
} from '../../src';

// TODO: avoid extra `assertNotNull` calls

describe('Aens', () => {
  let aeSdk: AeSdk;
  let name: Name;

  before(async () => {
    aeSdk = await getSdk(3);
    name = new Name(randomName(30), aeSdk.getContext());
  });

  it('gives name id', () => {
    expect(name.id).to.satisfies((id: string) => id.startsWith(Encoding.Name));
    expect(name.id).to.equal(produceNameId(name.value));
  });

  it('claims a name', async () => {
    const preclaimRes = await name.preclaim();
    assertNotNull(preclaimRes.tx);
    assertNotNull(preclaimRes.signatures);
    expect(preclaimRes.tx.fee).to.satisfy((fee: bigint) => fee >= 16620000000000n);
    expect(preclaimRes.tx.fee).to.satisfy((fee: bigint) => fee < 16860000000000n);
    expect(preclaimRes).to.eql({
      tx: {
        fee: preclaimRes.tx.fee,
        nonce: preclaimRes.tx.nonce,
        accountId: aeSdk.address,
        commitmentId: preclaimRes.tx.commitmentId,
        version: 1,
        ttl: preclaimRes.tx.ttl,
        type: 'NamePreclaimTx',
      },
      blockHeight: preclaimRes.blockHeight,
      blockHash: preclaimRes.blockHash,
      encodedTx: preclaimRes.encodedTx,
      hash: preclaimRes.hash,
      signatures: [preclaimRes.signatures[0]],
      rawTx: preclaimRes.rawTx,
    });
    expect(preclaimRes.tx?.commitmentId).to.satisfy((s: string) => s.startsWith('cm_'));

    const claimRes = await name.claim();
    assertNotNull(claimRes.tx);
    assertNotNull(claimRes.signatures);
    expect(claimRes.tx.fee).to.satisfy((fee: bigint) => fee >= 16660000000000n);
    expect(claimRes.tx.fee).to.satisfy((fee: bigint) => fee <= 17080000000000n);
    expect(claimRes).to.eql({
      tx: {
        fee: claimRes.tx.fee,
        nonce: claimRes.tx.nonce,
        accountId: aeSdk.address,
        name: name.value,
        nameSalt: claimRes.tx.nameSalt,
        nameFee: 500000000000000n,
        version: 2,
        ttl: claimRes.tx.ttl,
        type: 'NameClaimTx',
      },
      blockHeight: claimRes.blockHeight,
      blockHash: claimRes.blockHash,
      encodedTx: claimRes.encodedTx,
      hash: claimRes.hash,
      signatures: [claimRes.signatures[0]],
      rawTx: claimRes.rawTx,
    });

    assertNotNull(claimRes.blockHeight);
    expect(await aeSdk.api.getNameEntryByName(name.value)).to.eql({
      id: name.id,
      owner: aeSdk.address,
      pointers: [],
      ttl: claimRes.blockHeight + 180000,
    });
  }).timeout(timeoutBlock);

  it('claims a long name without preclaim', async () => {
    const nameString = randomName(30);
    const n = new Name(nameString, aeSdk.getContext());
    const claimed = await n.claim();
    assertNotNull(claimed.tx);
    assertNotNull(claimed.blockHeight);
    assertNotNull(claimed.signatures);
    expect(claimed.tx.fee).to.satisfy((fee: bigint) => fee >= 16860000000000n);
    expect(claimed.tx.fee).to.satisfy((fee: bigint) => fee < 17000000000000n);
    expect(claimed).to.eql({
      tx: {
        fee: claimed.tx.fee,
        nonce: claimed.tx.nonce,
        accountId: aeSdk.address,
        name: nameString,
        ttl: claimed.tx.ttl,
        nameSalt: 0,
        nameFee: 500000000000000n,
        version: 2,
        type: 'NameClaimTx',
      },
      blockHeight: claimed.blockHeight,
      blockHash: claimed.blockHash,
      encodedTx: claimed.encodedTx,
      hash: claimed.hash,
      signatures: [claimed.signatures[0]],
      rawTx: claimed.rawTx,
    });
  });

  it('claims a unicode name', async () => {
    const nameString = `испытаниЕ-æpP-${randomString(4)}.chain`;
    ensureName(nameString);
    const n = new Name(nameString, aeSdk.getContext());

    const preclaimRes = await n.preclaim();
    assertNotNull(preclaimRes.tx);
    expect(preclaimRes.tx.fee).to.satisfy((fee: bigint) => fee >= 16620000000000n);
    expect(preclaimRes.tx.fee).to.satisfy((fee: bigint) => fee < 16860000000000n);

    const claimRes = await n.claim();

    assertNotNull(claimRes.tx);
    expect(claimRes.tx.fee).to.satisfy((fee: bigint) => fee >= 16940000000000n);
    expect(claimRes.tx.fee).to.satisfy((fee: bigint) => fee < 17100000000000n);
    expect(claimRes.tx.name).to.equal(n.value);
    expect(claimRes.tx.nameFee).to.equal(300000000000000n);

    assertNotNull(claimRes.blockHeight);
    expect(await aeSdk.api.getNameEntryByName(n.value)).to.eql({
      id: n.id,
      owner: aeSdk.address,
      pointers: [],
      ttl: claimRes.blockHeight + 180000,
    });
  }).timeout(timeoutBlock);

  it('preclaims name using specific account', async () => {
    const onAccount = Object.values(aeSdk.accounts)[1];
    const n = new Name(randomName(30), aeSdk.getContext());
    const preclaimRes = await n.preclaim({ onAccount });
    assertNotNull(preclaimRes.tx);
    expect(preclaimRes.tx.accountId).to.equal(onAccount.address);
  });

  (isLimitedCoins ? describe.skip : describe)('Auction', () => {
    let auction: Name;

    before(() => {
      const nameShortString = `æ${randomString(4)}.chain` as const;
      auction = new Name(nameShortString, aeSdk.getContext());
    });

    it('starts a unicode name auction', async () => {
      await auction.preclaim();
      await auction.claim();
    });

    it('gets auction details', async () => {
      await expect(auction.getState()).to.be.rejectedWith(
        RestError,
        `v3/names/%C3%A6${auction.value.slice(1)} error: Name not found`,
      );
      const auctionDetails = await aeSdk.api.getAuctionEntryByName(auction.value);
      expect(auctionDetails).to.eql({
        id: auction.id,
        startedAt: auctionDetails.startedAt,
        endsAt: 480 + auctionDetails.startedAt,
        highestBidder: aeSdk.address,
        highestBid: 2865700000000000000n,
      });
    });

    it('makes a bid', async () => {
      const bidFee = computeBidFee(auction.value);
      const onAccount = Object.values(aeSdk.accounts)[1];
      const bidRes = await auction.bid(bidFee, { onAccount });
      assertNotNull(bidRes.tx);
      assertNotNull(bidRes.signatures);
      expect(bidRes).to.eql({
        tx: {
          fee: bidRes.tx.fee,
          nonce: bidRes.tx.nonce,
          accountId: onAccount.address,
          name: auction.value,
          nameSalt: 0,
          nameFee: 3008985000000000000n,
          version: 2,
          ttl: bidRes.tx.ttl,
          type: 'NameClaimTx',
        },
        blockHeight: bidRes.blockHeight,
        blockHash: bidRes.blockHash,
        encodedTx: bidRes.encodedTx,
        hash: bidRes.hash,
        signatures: [bidRes.signatures[0]],
        rawTx: bidRes.rawTx,
      });
    });
  });

  it('queries state from the node', async () => {
    const state = await name.getState();
    expect(state).to.eql(await aeSdk.api.getNameEntryByName(name.value));
  });

  it('throws error on querying non-existent name', async () => {
    const n = new Name(randomName(30), aeSdk.getContext());
    await expect(n.getState()).to.be.rejectedWith(
      RestError,
      `v3/names/${n.value} error: Name not found`,
    );
  });

  it('fails to spend to name with invalid pointers', async () => {
    const { pointers } = await name.getState();
    expect(pointers).to.have.length(0);
    await expect(aeSdk.spend(100, name.value)).to.be.rejectedWith(
      AensPointerContextError,
      `Name ${name.value} don't have pointers for account_pubkey`,
    );
  });

  it('calls contract using AENS name', async () => {
    const sourceCode = indent`
      contract Identity =
        entrypoint getArg(x : int) = x`;
    interface ContractApi extends ContractMethodsBase {
      getArg: (x: number) => bigint;
    }
    const contract = await Contract.initialize<ContractApi>({ ...aeSdk.getContext(), sourceCode });
    await contract.$deploy([]);
    assertNotNull(contract.$options.address);
    await name.update({ contract_pubkey: contract.$options.address });

    const contractName = await Contract.initialize<ContractApi>({
      ...aeSdk.getContext(),
      sourceCode,
      address: name.value,
    });
    // TODO: should be name id instead
    expect(contractName.$options.address).to.equal(contract.$options.address);
    expect((await contract.getArg(42, { callStatic: true })).decodedResult).to.equal(42n);
    expect((await contract.getArg(42, { callStatic: false })).decodedResult).to.equal(42n);
  });

  const { address } = MemoryAccount.generate();
  let pointers: Parameters<Name['update']>[0];
  let pointersNode: Array<{ key: string; id: (typeof pointers)[string] }>;

  before(async () => {
    pointers = {
      myKey: address,
      'my raw key': encode(Buffer.from('my raw value'), Encoding.Bytearray),
      account_pubkey: address,
      oracle_pubkey: encode(decode(address), Encoding.OracleAddress),
      channel: encode(decode(address), Encoding.Channel),
      contract_pubkey: buildContractId(address, 13),
    };
    pointersNode = Object.entries(pointers).map(([key, id]) => ({
      key,
      id,
      encodedKey: encode(Buffer.from(key), Encoding.Bytearray),
    }));
  });

  it('updates', async () => {
    const updateRes = await name.update(pointers);
    assertNotNull(updateRes.tx);
    assertNotNull(updateRes.signatures);
    expect(updateRes.tx.fee).to.satisfy((fee: bigint) => fee >= 22140000000000n);
    expect(updateRes.tx.fee).to.satisfy((fee: bigint) => fee <= 22240000000000n);
    expect(updateRes).to.eql({
      tx: {
        fee: updateRes.tx.fee,
        nonce: updateRes.tx.nonce,
        accountId: aeSdk.address,
        nameId: name.id,
        nameTtl: 180000,
        pointers: pointersNode,
        clientTtl: 3600,
        version: 2,
        ttl: updateRes.tx.ttl,
        type: 'NameUpdateTx',
      },
      blockHeight: updateRes.blockHeight,
      blockHash: updateRes.blockHash,
      encodedTx: updateRes.encodedTx,
      hash: updateRes.hash,
      signatures: [updateRes.signatures[0]],
      rawTx: updateRes.rawTx,
    });
  });

  it('throws error on updating names not owned by the account', async () => {
    const n = new Name(randomName(30), aeSdk.getContext());
    await n.preclaim();
    await n.claim();
    const onAccount = Object.values(aeSdk.accounts)[1];
    const promise = n.update({}, { onAccount, blocks: 1 });
    await expect(promise).to.be.rejectedWith(
      /(Giving up after 1 blocks mined|Transaction not found)/,
    );

    const { rawTx } = await promise.catch((e) => e);
    const { encodedTx } = unpackTx(rawTx, Tag.SignedTx);
    ensureEqual(encodedTx.tag, Tag.NameUpdateTx);
    await aeSdk.spend(0, aeSdk.address, { nonce: encodedTx.nonce, onAccount });
    const txHash = buildTxHash(rawTx);
    await expect(aeSdk.poll(txHash)).to.be.rejectedWith(
      new RegExp(`v3/transactions/${txHash} error: (Transaction not found|412 status code)`),
    );
  }).timeout(timeoutBlock);

  it('updates extending pointers', async () => {
    const anotherContract = buildContractId(address, 12);
    const updateRes = await name.update(
      { contract_pubkey: anotherContract },
      { extendPointers: true },
    );
    assertNotNull(updateRes.tx);
    expect(updateRes.tx.pointers).to.eql([
      ...pointersNode.filter((pointer) => pointer.key !== 'contract_pubkey'),
      {
        key: 'contract_pubkey',
        id: anotherContract,
        encodedKey: 'ba_Y29udHJhY3RfcHVia2V5OCcARA==',
      },
    ]);
  });

  it('throws error on setting 33 pointers', async () => {
    const pointers33 = Object.fromEntries(
      new Array(33).fill(undefined).map((v, i) => [`pointer-${i}`, address]),
    );
    await expect(name.update(pointers33)).to.be.rejectedWith(
      IllegalArgumentError,
      'Expected 32 pointers or less, got 33 instead',
    );
  });

  it('throws error on setting too long raw pointer', async () => {
    const pointersRaw = { raw: encode(Buffer.from('t'.repeat(1025)), Encoding.Bytearray) };
    await expect(name.update(pointersRaw)).to.be.rejectedWith(
      'Raw pointer should be shorter than 1025 bytes, got 1025 bytes instead',
    );
  });

  it('extends name ttl', async () => {
    const extendRes = await name.extendTtl(10000);
    assertNotNull(extendRes.blockHeight);
    const { ttl } = await name.getState();
    expect(ttl).to.equal(extendRes.blockHeight + 10000);
  });

  it('spends by name', async () => {
    const onAccount = Object.values(aeSdk.accounts)[1];
    const spendRes = await aeSdk.spend(100, name.value, { onAccount });
    assertNotNull(spendRes.tx);
    expect(spendRes.tx.recipientId).to.equal(name.id);
  });

  it('transfers name', async () => {
    const recipient = aeSdk.addresses()[1];
    const transferRes = await name.transfer(recipient);
    assertNotNull(transferRes.tx);
    assertNotNull(transferRes.signatures);
    expect(transferRes.tx.fee).to.satisfy((fee: bigint) => fee >= 17300000000000n);
    expect(transferRes.tx.fee).to.satisfy((fee: bigint) => fee <= 17400000000000n);
    expect(transferRes).to.eql({
      tx: {
        fee: transferRes.tx.fee,
        nonce: transferRes.tx.nonce,
        accountId: aeSdk.address,
        nameId: name.id,
        recipientId: recipient,
        version: 1,
        ttl: transferRes.tx.ttl,
        type: 'NameTransferTx',
      },
      blockHeight: transferRes.blockHeight,
      blockHash: transferRes.blockHash,
      encodedTx: transferRes.encodedTx,
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
    expect(revokeRes.tx.fee).to.satisfy((fee: bigint) => fee >= 16620000000000n);
    expect(revokeRes.tx.fee).to.satisfy((fee: bigint) => fee <= 16700000000000n);
    expect(revokeRes).to.eql({
      tx: {
        fee: revokeRes.tx.fee,
        nonce: revokeRes.tx.nonce,
        accountId: onAccount.address,
        nameId: name.id,
        version: 1,
        ttl: revokeRes.tx.ttl,
        type: 'NameRevokeTx',
      },
      blockHeight: revokeRes.blockHeight,
      blockHash: revokeRes.blockHash,
      encodedTx: revokeRes.encodedTx,
      hash: revokeRes.hash,
      signatures: [revokeRes.signatures[0]],
      rawTx: revokeRes.rawTx,
    });
    await expect(name.getState()).to.be.rejectedWith(
      RestError,
      `v3/names/${name.value} error: Name revoked`,
    );
  });
});
