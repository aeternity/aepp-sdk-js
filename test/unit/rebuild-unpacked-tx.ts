import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  buildTx,
  rebuildUnpackedTx,
  unpackTx,
  encode,
  Encoding,
  EntryTag,
  Tag,
  AbiVersion,
  VmVersion,
} from '../../src';
import { txSchema } from '../../src/tx/builder/schema';

type Params = Parameters<typeof buildTx>[0];

const address = 'ak_xw6vb7yJfajDdfcXzjg6Q5bH23bSUJrud6iBBfMdegZJFbQmc';
const contractId = 'ct_ECdrEy2NJKq3qK3xraPtcDP7vfdi56SQXYAH3bVVSTmpqpYyW';
const callData = 'cb_KxFE1kQfP4oEp9E=';
const bytes32 = Buffer.alloc(32);
const stateHash = encode(bytes32, Encoding.State);
const emptyPoi = {
  tag: EntryTag.TreesPoi,
  accounts: [],
  calls: [],
  channels: [],
  contracts: [],
  ns: [],
  oracles: [],
} as const;

// Values the SDK release refuses to build a transaction with — a fee and a gas price below the
// consensus minimum, a gas limit above the block gas limit, a name fee below the minimum of the
// name, a name ttl and a pointer count above the maximum. A node running other consensus
// parameters produces transactions holding them, and the SDK has to serialize such a transaction
// back without repricing it — see `serializeAsIsParam`.
const fee = 1;
const gasPrice = 1;
const gasLimit = 9e6;
const nameFee = 1;
const nameTtl = 200000;
const pointers = new Array(40)
  .fill(undefined)
  .map((_, index) => ({ key: `key-${index}`, id: address }));

const spendTx = {
  tag: Tag.SpendTx,
  version: 1,
  senderId: address,
  recipientId: address,
  amount: 1,
  fee,
  ttl: 0,
  nonce: 1,
  payload: 'ba_Xfbg4g==',
};
const signedSpendTx = { tag: Tag.SignedTx, version: 1, signatures: [], encodedTx: spendTx };

/**
 * A transaction of every type and version the builder implements, each carrying values the SDK
 * release considers invalid. Not a fixture of what node produces — the point is that
 * re-serialization doesn't look at these values at all.
 */
const transactions: Array<{ params: Params; checked?: false }> = [
  { params: signedSpendTx },
  { params: spendTx },
  {
    params: {
      tag: Tag.NamePreclaimTx,
      version: 1,
      accountId: address,
      nonce: 1,
      commitmentId: encode(bytes32, Encoding.Commitment),
      fee,
      ttl: 0,
    },
  },
  {
    params: {
      tag: Tag.NameClaimTx,
      version: 2,
      accountId: address,
      nonce: 1,
      name: 'test.chain',
      nameSalt: 0,
      nameFee,
      fee,
      ttl: 0,
    },
  },
  ...([1, 2] as const).map((version) => ({
    params: {
      tag: Tag.NameUpdateTx,
      version,
      accountId: address,
      nonce: 1,
      nameId: 'test.chain',
      nameTtl,
      pointers,
      clientTtl: 0,
      fee,
      ttl: 0,
    } as unknown as Params,
  })),
  {
    params: {
      tag: Tag.NameTransferTx,
      version: 1,
      accountId: address,
      nonce: 1,
      nameId: 'test.chain',
      recipientId: address,
      fee,
      ttl: 0,
    },
  },
  {
    params: {
      tag: Tag.NameRevokeTx,
      version: 1,
      accountId: address,
      nonce: 1,
      nameId: 'test.chain',
      fee,
      ttl: 0,
    },
  },
  {
    params: {
      tag: Tag.ContractCreateTx,
      version: 1,
      ownerId: address,
      nonce: 1,
      code: callData,
      ctVersion: { vmVersion: VmVersion.Fate3, abiVersion: AbiVersion.Fate },
      fee,
      ttl: 0,
      deposit: 0,
      amount: 0,
      gasLimit,
      gasPrice,
      callData,
    },
  },
  {
    params: {
      tag: Tag.ContractCallTx,
      version: 1,
      callerId: address,
      nonce: 1,
      contractId,
      abiVersion: AbiVersion.Fate,
      fee,
      ttl: 0,
      amount: 0,
      gasLimit,
      gasPrice,
      callData,
    },
  },
  {
    params: {
      tag: Tag.OracleRegisterTx,
      version: 1,
      accountId: address,
      nonce: 1,
      queryFormat: 'string',
      responseFormat: 'string',
      queryFee: 0,
      oracleTtlValue: 500,
      fee,
      ttl: 0,
      abiVersion: AbiVersion.NoAbi,
    },
  },
  {
    params: {
      tag: Tag.OracleExtendTx,
      version: 1,
      oracleId: encode(bytes32, Encoding.OracleAddress),
      nonce: 1,
      oracleTtlValue: 500,
      fee,
      ttl: 0,
    },
  },
  {
    params: {
      tag: Tag.OracleQueryTx,
      version: 1,
      senderId: address,
      nonce: 1,
      oracleId: encode(bytes32, Encoding.OracleAddress),
      query: 'question',
      queryFee: 0,
      fee,
      ttl: 0,
    },
  },
  {
    params: {
      tag: Tag.OracleRespondTx,
      version: 1,
      oracleId: encode(bytes32, Encoding.OracleAddress),
      nonce: 1,
      queryId: encode(bytes32, Encoding.OracleQueryId),
      response: 'answer',
      fee,
      ttl: 0,
    },
  },
  {
    params: {
      tag: Tag.ChannelCreateTx,
      version: 2,
      initiator: address,
      initiatorAmount: 1,
      responder: address,
      responderAmount: 1,
      channelReserve: 0,
      lockPeriod: 0,
      ttl: 0,
      fee,
      initiatorDelegateIds: [],
      responderDelegateIds: [],
      stateHash,
      nonce: 1,
    },
  },
  {
    params: {
      tag: Tag.ChannelCloseMutualTx,
      version: 1,
      channelId: encode(bytes32, Encoding.Channel),
      fromId: address,
      initiatorAmountFinal: 0,
      responderAmountFinal: 0,
      ttl: 0,
      fee,
      nonce: 1,
    },
  },
  ...([Tag.ChannelCloseSoloTx, Tag.ChannelSlashTx] as const).map((tag) => ({
    params: {
      tag,
      version: 1,
      channelId: encode(bytes32, Encoding.Channel),
      fromId: address,
      payload: rebuildUnpackedTx(signedSpendTx as never),
      poi: emptyPoi,
      ttl: 0,
      fee,
      nonce: 1,
    } as unknown as Params,
  })),
  {
    params: {
      tag: Tag.ChannelDepositTx,
      version: 1,
      channelId: encode(bytes32, Encoding.Channel),
      fromId: address,
      amount: 1,
      ttl: 0,
      fee,
      stateHash,
      round: 1,
      nonce: 1,
    },
  },
  {
    params: {
      tag: Tag.ChannelWithdrawTx,
      version: 1,
      channelId: encode(bytes32, Encoding.Channel),
      toId: address,
      amount: 1,
      ttl: 0,
      fee,
      stateHash,
      round: 1,
      nonce: 1,
    },
  },
  {
    params: {
      tag: Tag.ChannelSettleTx,
      version: 1,
      channelId: encode(bytes32, Encoding.Channel),
      fromId: address,
      initiatorAmountFinal: 0,
      responderAmountFinal: 0,
      ttl: 0,
      fee,
      nonce: 1,
    },
  },
  {
    params: {
      tag: Tag.ChannelForceProgressTx,
      version: 1,
      channelId: encode(bytes32, Encoding.Channel),
      fromId: address,
      payload: rebuildUnpackedTx(signedSpendTx as never),
      round: 1,
      update: callData,
      stateHash,
      offChainTrees: encode(Buffer.alloc(1), Encoding.StateTrees),
      ttl: 0,
      fee,
      nonce: 1,
    },
  },
  // the only type that holds no value the SDK release checks against a consensus limit
  {
    checked: false,
    params: {
      tag: Tag.ChannelOffChainTx,
      version: 2,
      channelId: encode(bytes32, Encoding.Channel),
      round: 1,
      stateHash,
    },
  },
  {
    params: {
      tag: Tag.ChannelSnapshotSoloTx,
      version: 1,
      channelId: encode(bytes32, Encoding.Channel),
      fromId: address,
      payload: rebuildUnpackedTx(signedSpendTx as never),
      ttl: 0,
      fee,
      nonce: 1,
    },
  },
  {
    params: {
      tag: Tag.GaAttachTx,
      version: 1,
      ownerId: address,
      nonce: 1,
      code: callData,
      authFun: bytes32,
      ctVersion: { vmVersion: VmVersion.Fate3, abiVersion: AbiVersion.Fate },
      fee,
      ttl: 0,
      gasLimit,
      gasPrice,
      callData,
    },
  },
  {
    params: {
      tag: Tag.GaMetaTx,
      version: 2,
      gaId: address,
      authData: callData,
      abiVersion: AbiVersion.Fate,
      fee,
      gasLimit,
      gasPrice,
      tx: signedSpendTx,
    },
  },
  {
    params: {
      tag: Tag.PayingForTx,
      version: 1,
      payerId: address,
      nonce: 1,
      fee,
      tx: signedSpendTx,
    },
  },
] as unknown as Array<{ params: Params; checked?: false }>;

describe('rebuildUnpackedTx', () => {
  // `buildTx` prices and bounds the values it is given, `rebuildUnpackedTx` serializes them as
  // they are. Every field that checks a value against a consensus limit has to skip that check on
  // re-serialization, and a field added later has to do the same — otherwise a transaction built
  // for a node running other consensus parameters stops round-tripping, which is invisible until
  // somebody runs against such a node. This walks every transaction type the builder implements.
  it('covers every transaction type of the schema', () => {
    const covered = new Set(
      transactions.map(({ params }) => {
        const { tag, version } = params as { tag: Tag; version: number };
        return `${tag}:${version}`;
      }),
    );
    const missing = txSchema
      .map((schema) => ({
        tag: schema.tag.constValue as Tag,
        version: schema.version.constValue,
      }))
      .filter(({ tag, version }) => !covered.has(`${tag}:${version}`))
      .map(({ tag, version }) => `${Tag[tag]}:${version}`);
    expect(missing).to.eql([]);
  });

  transactions.forEach(({ params, checked }) => {
    const { tag, version } = params as unknown as { tag: Tag; version: number };
    const name = `${Tag[tag]} (version ${version})`;

    it(`re-serializes ${name} without checking its values`, () => {
      const transaction = rebuildUnpackedTx(params as never);
      expect(rebuildUnpackedTx(unpackTx(transaction))).to.equal(transaction);
    });

    if (checked === false) return;
    // without this the test above would pass on values the SDK release accepts anyway, and stop
    // proving anything the moment a limit changes
    it(`builds ${name} only after checking its values`, () => {
      expect(() => buildTx(params)).to.throw(Error);
    });
  });
});
