import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { getSdk } from '.';
import { assertNotNull, randomName, randomString } from '../utils';
import {
  AeSdk, generateKeyPair, buildContractId, computeBidFee, ensureName, produceNameId, Contract,
  AensPointerContextError, UnexpectedTsError, encode, decode, Encoding, ContractMethodsBase,
} from '../../src';
import { pause } from '../../src/utils/other';

describe('Aens', () => {
  let aeSdk: AeSdk;
  const name = randomName(13); // 13 name length doesn't trigger auction

  before(async () => {
    aeSdk = await getSdk(2);
  });

  it('claims a name', async () => {
    const preclaim = await aeSdk.aensPreclaim(name);
    expect(preclaim.commitmentId).to.satisfy((s: string) => s.startsWith('cm_'));

    const claimed = await preclaim.claim();
    expect(claimed.id).to.be.a('string');
    expect(claimed.ttl).to.be.an('number');
  });

  it('claims a unicode name', async () => {
    const n = `испытаниЕ-æpP-${randomString(4)}.chain`;
    ensureName(n);
    const preclaim = await aeSdk.aensPreclaim(n);
    const claimed = await preclaim.claim();

    expect(claimed.ttl).to.be.a('number');
    expect(claimed.update).to.be.a('function');
    expect(claimed.transfer).to.be.a('function');
    expect(claimed.revoke).to.be.a('function');
    expect(claimed.extendTtl).to.be.a('function');
    assertNotNull(claimed.tx);
    assertNotNull(claimed.signatures);
    expect(claimed).to.be.eql({
      tx: {
        fee: 16960000000000n,
        nonce: claimed.tx.nonce,
        accountId: aeSdk.address,
        name: n,
        nameSalt: claimed.tx.nameSalt,
        nameFee: 300000000000000n,
        version: 2,
        type: 'NameClaimTx',
      },
      blockHeight: claimed.blockHeight,
      blockHash: claimed.blockHash,
      hash: claimed.hash,
      signatures: [claimed.signatures[0]],
      rawTx: claimed.rawTx,
      id: produceNameId(n),
      owner: aeSdk.address,
      ttl: claimed.ttl,
      pointers: [],
      update: claimed.update,
      transfer: claimed.transfer,
      revoke: claimed.revoke,
      extendTtl: claimed.extendTtl,
    });

    const queried = await aeSdk.api.getNameEntryByName(n);
    expect(queried).to.eql({
      id: produceNameId(n),
      owner: aeSdk.address,
      ttl: claimed.ttl,
      pointers: [],
    });
  });

  it('queries names', async () => {
    // For some reason the node will return 404 when name is queried
    // just right after claim tx has been mined so we wait 0.5s
    await pause(500);
    await aeSdk.aensQuery(name).should.eventually.be.an('object');
  });

  it('throws error on querying non-existent name', () => aeSdk
    .aensQuery(randomName(13)).should.eventually.be.rejected);

  it('Spend using name with invalid pointers', async () => {
    const onAccount = aeSdk.addresses().find((acc) => acc !== aeSdk.address);
    const { pointers } = await aeSdk.getName(name);
    pointers.length.should.be.equal(0);
    await expect(aeSdk.spend(100, name, { onAccount }))
      .to.be.rejectedWith(AensPointerContextError, `Name ${name} don't have pointers for account_pubkey`);
  });

  it('Call contract using AENS name', async () => {
    const sourceCode = 'contract Identity ='
      + '  entrypoint getArg(x : int) = x';
    interface ContractApi extends ContractMethodsBase {
      getArg: (x: number) => bigint;
    }
    let contract = await Contract.initialize<ContractApi>({ ...aeSdk.getContext(), sourceCode });
    await contract.$deploy([]);
    const nameObject = await aeSdk.aensQuery(name);
    assertNotNull(contract.$options.address);
    await nameObject.update({ contract_pubkey: contract.$options.address });

    contract = await Contract.initialize<ContractApi>({
      ...aeSdk.getContext(), sourceCode, address: name,
    });
    expect((await contract.getArg(42)).decodedResult).to.be.equal(42n);
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
    const nameObject = await aeSdk.aensQuery(name);
    expect(await nameObject.update(pointers)).to.deep.include({ pointers: pointersNode });
  });

  it('throws error on updating names not owned by the account', async () => {
    const preclaim = await aeSdk.aensPreclaim(randomName(13));
    await preclaim.claim();
    const onAccount = aeSdk.addresses().find((acc) => acc !== aeSdk.address);
    if (onAccount == null) throw new UnexpectedTsError();
    await aeSdk.aensUpdate(name, {}, { onAccount, blocks: 1 }).should.eventually.be.rejected;
  });

  it('updates extending pointers', async () => {
    const nameObject = await aeSdk.aensQuery(name);
    const anotherContract = buildContractId(address, 12);
    expect(await nameObject.update({ contract_pubkey: anotherContract }, { extendPointers: true }))
      .to.deep.include({
        pointers: [
          ...pointersNode.filter((pointer) => pointer.key !== 'contract_pubkey'),
          { key: 'contract_pubkey', id: anotherContract },
        ],
      });
  });

  it('throws error on setting 33 pointers', async () => {
    const nameObject = await aeSdk.aensQuery(name);
    const pointers33 = Object.fromEntries(
      new Array(33).fill(undefined).map((v, i) => [`pointer-${i}`, address]),
    );
    await expect(nameObject.update(pointers33))
      .to.be.rejectedWith('Expected 32 pointers or less, got 33 instead');
  });

  it('Extend name ttl', async () => {
    const nameObject = await aeSdk.aensQuery(name);
    const extendResult: Awaited<ReturnType<typeof aeSdk.aensUpdate>> = await nameObject
      .extendTtl(10000);
    if (extendResult.blockHeight == null) throw new UnexpectedTsError();
    return extendResult.should.be.deep.include({
      ttl: extendResult.blockHeight + 10000,
    });
  });

  it('Spend by name', async () => {
    const onAccount = aeSdk.addresses().find((acc) => acc !== aeSdk.address);
    await aeSdk.spend(100, name, { onAccount });
  });

  it('transfers names', async () => {
    const claim = await aeSdk.aensQuery(name);
    const onAccount = aeSdk.addresses().find((acc) => acc !== aeSdk.address);
    if (onAccount == null) throw new UnexpectedTsError();
    await claim.transfer(onAccount);

    const claim2 = await aeSdk.aensQuery(name);
    expect(
      await claim2.update({ account_pubkey: onAccount }, { onAccount: aeSdk.accounts[onAccount] }),
    ).to.deep.include({ pointers: [{ key: 'account_pubkey', id: onAccount }] });
  });

  it('revoke names', async () => {
    const onAccountIndex = aeSdk.addresses().find((acc) => acc !== aeSdk.address);
    if (onAccountIndex == null) throw new UnexpectedTsError();
    const onAccount = aeSdk.accounts[onAccountIndex];
    const aensName = await aeSdk.aensQuery(name);

    const revoke = await aensName.revoke({ onAccount });
    revoke.should.be.an('object');

    await aeSdk.aensQuery(name).should.be.rejectedWith(Error);
  });

  it('PreClaim name using specific account', async () => {
    const onAccount = aeSdk.addresses().find((acc) => acc !== aeSdk.address);

    const preclaim = await aeSdk.aensPreclaim(name, { onAccount });
    preclaim.should.be.an('object');
    if (preclaim.tx?.accountId == null) throw new UnexpectedTsError();
    preclaim.tx.accountId.should.be.equal(onAccount);
  });

  describe('name auctions', () => {
    it('claims a name', async () => {
      const onAccount = aeSdk.addresses().find((acc) => acc !== aeSdk.address);
      const nameShort = randomName(12);

      const preclaim = await aeSdk.aensPreclaim(nameShort);
      preclaim.should.be.an('object');

      const claim = await preclaim.claim();
      claim.should.be.an('object');

      const bidFee = computeBidFee(nameShort);
      const bid: Awaited<ReturnType<typeof aeSdk.aensClaim>> = await aeSdk
        .aensBid(nameShort, bidFee, { onAccount });
      bid.should.be.an('object');

      await expect(aeSdk.getName(nameShort)).to.be.rejectedWith('error: Name not found');
    });

    it('claims a unicode name', async () => {
      const onAccount = aeSdk.addresses().find((acc) => acc !== aeSdk.address);
      const nameShort = `æ${randomString(4)}.chain`;
      ensureName(nameShort);

      const preclaim = await aeSdk.aensPreclaim(nameShort);
      await preclaim.claim();
      await aeSdk.aensBid(nameShort, computeBidFee(nameShort), { onAccount });

      await expect(aeSdk.getName(nameShort)).to.be.rejectedWith('error: Name not found');
    });
  });
});
