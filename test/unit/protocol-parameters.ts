import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { spy, useFakeTimers, SinonSpy } from 'sinon';
import { RestError } from '@azure/core-rest-pipeline';
import {
  AbiVersion,
  AccountGeneralized,
  buildTx,
  buildTxAsync,
  CompilerBase,
  ConsensusProtocolVersion,
  decode,
  Encoded,
  IllegalArgumentError,
  ArgumentError,
  InternalError,
  Node,
  NodeError,
  Tag,
  unpackTx,
  VmVersion,
} from '../../src';
import { rebuildUnpackedTx } from '../../src/tx/builder/index';
import getTransactionSignerAddress from '../../src/tx/transaction-signer';
import { getExecutionCost } from '../../src/tx/execution-cost';
import {
  convertProtocolParameters,
  defaultProtocolParameters,
  getCachedProtocolParameters,
  getGasPriceDivisor,
  ProtocolParameters,
} from '../../src/tx/builder/protocol-parameters';
import { getCachedIncreasedGasPrice } from '../../src/tx/builder/field-types/gas-price';
import { buildAuthTxHash, buildAuthTxHashByGaMetaTx } from '../../src/contract/ga';
import { wrapWithProxy } from '../../src/utils/wrap-proxy';

const address = 'ak_xw6vb7yJfajDdfcXzjg6Q5bH23bSUJrud6iBBfMdegZJFbQmc';
const contractId = 'ct_ECdrEy2NJKq3qK3xraPtcDP7vfdi56SQXYAH3bVVSTmpqpYyW';
const callData = 'cb_KxFE1kQfP4oEp9E=';

type NodeResponse = Awaited<ReturnType<Node['getProtocolParameters']>>;
type NodeSettingsResponse = Awaited<ReturnType<Node['getNodeSettings']>>;

/**
 * The parameters as they were at the moment of the SDK release, in the shape node reports them.
 * `defaultProtocolParameters` is expected to be the conversion of exactly this.
 */
const releaseConsensusParameters: NodeResponse['protocols'][number] = {
  version: 6,
  effectiveAtHeight: 0,
  minimumGasPrice: 1000000000n,
  gasPerByte: 20,
  storeByteGas: 20,
  txBaseGas: {
    SpendTx: 15000,
    OracleRegisterTx: 15000,
    OracleExtendTx: 15000,
    OracleQueryTx: 15000,
    OracleRespondTx: 15000,
    NamePreclaimTx: 15000,
    NameClaimTx: 15000,
    NameTransferTx: 15000,
    NameUpdateTx: 15000,
    NameRevokeTx: 15000,
    ChannelCreateTx: 15000,
    ChannelDepositTx: 15000,
    ChannelWithdrawTx: 15000,
    ChannelForceProgressTx: 450000,
    ChannelCloseSoloTx: 15000,
    ChannelCloseMutualTx: 15000,
    ChannelSlashTx: 15000,
    ChannelSettleTx: 15000,
    ChannelSnapshotSoloTx: 15000,
    // a transaction type the SDK doesn't build
    ChannelSetDelegatesTx: 15000,
    PayingForTx: 3000,
  },
  contractTxBaseGas: [
    { txType: 'ContractCreateTx', abiVersion: AbiVersion.Sophia, txBaseGas: 75000 },
    { txType: 'ContractCreateTx', abiVersion: AbiVersion.Fate, txBaseGas: 75000 },
    { txType: 'ContractCallTx', abiVersion: AbiVersion.Sophia, txBaseGas: 180000 },
    { txType: 'ContractCallTx', abiVersion: AbiVersion.Fate, txBaseGas: 180000 },
    { txType: 'GAAttachTx', abiVersion: AbiVersion.Sophia, txBaseGas: 75000 },
    { txType: 'GAAttachTx', abiVersion: AbiVersion.Fate, txBaseGas: 75000 },
    { txType: 'GAMetaTx', abiVersion: AbiVersion.Sophia, txBaseGas: 75000 },
    { txType: 'GAMetaTx', abiVersion: AbiVersion.Fate, txBaseGas: 75000 },
  ],
  stateGasPerBlock: {
    OracleRegisterTx: { part: 32000, whole: 175200 },
    OracleExtendTx: { part: 32000, whole: 175200 },
    OracleQueryTx: { part: 32000, whole: 175200 },
    OracleRespondTx: { part: 32000, whole: 175200 },
  },
  nameClaimFees: [570288700000000000000n, 352457800000000000000n],
  nameAuctionTimeouts: [{ length: 1, bidTimeout: 2400, bidExtension: 120 }],
  nameClaimBidIncrement: 5,
  nameMaxLengthStartingAuction: 12,
  nameClaimMaxExpiration: 180000,
  nameRegistrars: ['chain'],
  namePreclaimExpiration: 300,
  nameClaimPreclaimDelta: 1,
  nameProtectionPeriod: 2400,
  nameClaimLockedFee: 0n,
  allowedContractVersions: [{ vmVersion: VmVersion.Fate3, abiVersion: AbiVersion.Fate }],
  allowedOracleAbiVersions: [AbiVersion.NoAbi, AbiVersion.Fate],
};

const releaseResponse: NodeResponse = {
  networkId: 'ae_uat',
  currentProtocolVersion: 6,
  lockedCoinsHolderAccount: 'ak_11111111111111111111111111111111273Yts',
  expectedBlockMineRate: 180000,
  microBlockCycle: 3000,
  protocols: [releaseConsensusParameters],
};

/**
 * The node policy settings as they were at the moment of the SDK release. Node reports them on
 * `/v3/node-settings`, apart from the consensus parameters of `/v3/protocol-parameters` — they are
 * not consensus rules and two nodes of the same network may report different ones.
 */
const releaseNodeSettings: NodeSettingsResponse = {
  minMinerGasPrice: 1000000000n,
  maxAuthFunGas: 50000,
  mempoolTxTtl: 256,
  mempoolNonceOffset: 5,
  dryRunGasLimit: 6000000,
  blockGasLimit: 6000000,
};

/**
 * The same response with every value the SDK reads set apart from its default and from the
 * neighbouring fields it could be confused with, so that a value taken from the wrong place fails
 * the test instead of accidentally matching.
 */
const response: NodeResponse = {
  ...releaseResponse,
  protocols: [
    {
      ...releaseConsensusParameters,
      minimumGasPrice: 3000000000n,
      gasPerByte: 21,
      // must not be confused with `gasPerByte`
      storeByteGas: 22,
      txBaseGas: { ...releaseConsensusParameters.txBaseGas, SpendTx: 15001, PayingForTx: 3001 },
      contractTxBaseGas: [
        { txType: 'ContractCreateTx', abiVersion: AbiVersion.Sophia, txBaseGas: 75002 },
        { txType: 'ContractCreateTx', abiVersion: AbiVersion.Fate, txBaseGas: 75003 },
        { txType: 'ContractCallTx', abiVersion: AbiVersion.Sophia, txBaseGas: 180004 },
        { txType: 'ContractCallTx', abiVersion: AbiVersion.Fate, txBaseGas: 180005 },
        { txType: 'GAAttachTx', abiVersion: AbiVersion.Sophia, txBaseGas: 75006 },
        { txType: 'GAAttachTx', abiVersion: AbiVersion.Fate, txBaseGas: 75007 },
        { txType: 'GAMetaTx', abiVersion: AbiVersion.Sophia, txBaseGas: 75008 },
        { txType: 'GAMetaTx', abiVersion: AbiVersion.Fate, txBaseGas: 75009 },
        // a transaction type the SDK doesn't know
        { txType: 'FutureTx', abiVersion: AbiVersion.Fate, txBaseGas: 42 },
      ],
      stateGasPerBlock: {
        ...releaseConsensusParameters.stateGasPerBlock,
        OracleRegisterTx: { part: 33000, whole: 100000 },
      },
    },
  ],
};

/** The same settings with every value the SDK reads set apart, see {@link response} */
const nodeSettings: NodeSettingsResponse = {
  ...releaseNodeSettings,
  minMinerGasPrice: 4000000000n,
  maxAuthFunGas: 60000,
  blockGasLimit: 5000000,
  // must not be confused with `blockGasLimit`
  dryRunGasLimit: 6000000,
};

/**
 * The conversion reads the two responses node returns. The fixtures here patch them as one object
 * so that a test names the field it is about and nothing else — this hands each half to the
 * argument it belongs to, and defaults the settings of a test that only patches the parameters.
 */
function convert({
  nodeSettings: settings = releaseNodeSettings,
  ...protocolParameters
}: NodeResponse & { nodeSettings?: NodeSettingsResponse }): ProtocolParameters {
  return convertProtocolParameters(protocolParameters, settings);
}

function genNode(overrides: Partial<Record<keyof Node, unknown>>): Node {
  return {
    // the two endpoints again — a test that patches one of them usually has nothing to say about
    // the other, so the node policy settings default to the ones of the SDK release
    getNodeSettings: async () => releaseNodeSettings,
    // the abi version field and `buildAuthTxHash` ask node which protocol and network it runs
    getNodeInfo: async () => ({
      nodeNetworkId: 'ae_uat',
      consensusProtocolVersion: ConsensusProtocolVersion.Ceres,
    }),
    ...overrides,
  } as unknown as Node;
}

function genNodeReturning(getProtocolParameters: () => Promise<NodeResponse>): Node {
  return genNode({ getProtocolParameters });
}

/** Runs `cb` with `console.warn` replaced, returns the messages it produced */
async function collectWarnings(cb: () => Promise<void>): Promise<string[]> {
  const warn = spy() as SinonSpy;
  const original = console.warn;
  console.warn = warn;
  try {
    await cb();
  } finally {
    console.warn = original;
  }
  return warn.args.map((args) => String(args[0]));
}

const spendTxParams = {
  tag: Tag.SpendTx,
  nonce: 1,
  amount: 1,
  senderId: address,
  recipientId: address,
} as const;

/** Parameters of a node running a tenth of the minimum gas price of the SDK release */
const cheapParameters: ProtocolParameters = {
  ...defaultProtocolParameters,
  minGasPrice: 100000000n,
  minMinerGasPrice: 100000000n,
};

/** A signed transaction built against `defaultProtocolParameters` */
function genSignedSpendTx(): Encoded.Transaction {
  const encodedTx = buildTx(spendTxParams);
  return buildTx({ tag: Tag.SignedTx, encodedTx, signatures: [Buffer.alloc(64)] });
}

describe('Protocol parameters', () => {
  describe('convertProtocolParameters', () => {
    it('converts the values of the SDK release to the shipped defaults', () => {
      expect(convert(releaseResponse)).to.eql(defaultProtocolParameters);

      // The conversion starts from `defaultProtocolParameters` and overlays what node reports onto
      // it, so the assertion above holds for the three table fields whether or not anything was
      // read out of the response — it is a real assertion only for the scalars. Check that the
      // tables are read as well, otherwise a conversion that dropped them all would pass here.
      const withTables = (
        protocol: Partial<NodeResponse['protocols'][number]>,
      ): ProtocolParameters =>
        convert({
          ...releaseResponse,
          protocols: [{ ...releaseConsensusParameters, ...protocol }],
        });
      expect(
        withTables({
          txBaseGas: { ...releaseConsensusParameters.txBaseGas, SpendTx: 15001 },
        }).txBaseGas[Tag.SpendTx],
      ).to.equal(15001);
      expect(
        withTables({
          contractTxBaseGas: [
            { txType: 'ContractCallTx', abiVersion: AbiVersion.Fate, txBaseGas: 180001 },
          ],
        }).contractTxBaseGas[Tag.ContractCallTx]?.[AbiVersion.Fate],
      ).to.equal(180001);
      expect(
        withTables({
          stateGasPerBlock: {
            ...releaseConsensusParameters.stateGasPerBlock,
            OracleQueryTx: { part: 32001, whole: 175200 },
          },
        }).stateGasPerBlock[Tag.OracleQueryTx],
      ).to.eql({ part: 32001, whole: 175200 });
    });

    it('takes each value from the field node reports it in', () => {
      const parameters = convert({ ...response, nodeSettings });
      expect(parameters.minGasPrice).to.equal(3000000000n);
      expect(parameters.minMinerGasPrice).to.equal(4000000000n);
      // not `storeByteGas`
      expect(parameters.gasPerByte).to.equal(21);
      // not `nodeSettings.dryRunGasLimit`
      expect(parameters.blockGasLimit).to.equal(5000000);
      expect(parameters.maxAuthFunGas).to.equal(60000);
      expect(parameters.txBaseGas[Tag.SpendTx]).to.equal(15001);
      expect(parameters.txBaseGas[Tag.PayingForTx]).to.equal(3001);
      expect(parameters.txBaseGas[Tag.ChannelForceProgressTx]).to.equal(450000);
      // node doesn't report it, a transaction that never reaches the chain is free
      expect(parameters.txBaseGas[Tag.ChannelOffChainTx]).to.equal(0);
      expect(parameters.contractTxBaseGas[Tag.ContractCallTx]).to.eql({
        [AbiVersion.Sophia]: 180004,
        [AbiVersion.Fate]: 180005,
      });
      // node names these two apart from the rest
      expect(parameters.contractTxBaseGas[Tag.GaAttachTx]).to.eql({
        [AbiVersion.Sophia]: 75006,
        [AbiVersion.Fate]: 75007,
      });
      expect(parameters.contractTxBaseGas[Tag.GaMetaTx]).to.eql({
        [AbiVersion.Sophia]: 75008,
        [AbiVersion.Fate]: 75009,
      });
      expect(parameters.stateGasPerBlock[Tag.OracleRegisterTx]).to.eql({
        part: 33000,
        whole: 100000,
      });
      expect(parameters.stateGasPerBlock[Tag.OracleQueryTx]).to.eql({
        part: 32000,
        whole: 175200,
      });
    });

    it("drops transaction types the sdk doesn't know", () => {
      const parameters = convert({ ...response, nodeSettings });
      // `ChannelSetDelegatesTx` and `FutureTx` are reported by node and not implemented in the sdk
      const tags = [
        ...Object.keys(parameters.txBaseGas),
        ...Object.keys(parameters.contractTxBaseGas),
        ...Object.keys(parameters.stateGasPerBlock),
      ];
      expect(tags.every((tag) => typeof Tag[+tag] === 'string')).to.equal(true);
      expect(Object.keys(parameters.contractTxBaseGas).length).to.equal(4);
    });

    it("doesn't take prototype members for transaction types", () => {
      const parameters = convert({
        ...response,
        protocols: [
          {
            ...response.protocols[0],
            // `__proto__` in an object literal is the prototype setter and never becomes an own
            // property, node sends json — parse it the same way the api client does
            txBaseGas: JSON.parse(
              '{"12": 1, "constructor": 2, "toString": 3, "__proto__": {"12": 4}}',
            ) as NodeResponse['protocols'][number]['txBaseGas'],
          },
        ],
      });
      // not a single one of them is taken: `Tag['12']` is the string `'SpendTx'` (the reverse
      // mapping of a numeric enum), the rest are members of `Object.prototype`
      expect(parameters.txBaseGas).to.eql({
        ...defaultProtocolParameters.txBaseGas,
        [Tag.ChannelOffChainTx]: 0,
      });
      expect(parameters.txBaseGas[Tag.SpendTx]).to.equal(15000);
      const untouched: { toString?: unknown } = {};
      expect(untouched.toString).to.equal(Object.prototype.toString);
    });

    it("doesn't take a prototype member for an abi version", () => {
      const parameters = convert({
        ...response,
        protocols: [
          {
            ...response.protocols[0],
            contractTxBaseGas: JSON.parse(
              '[{"txType": "ContractCallTx", "abiVersion": "__proto__",' +
                ' "txBaseGas": {"3": 1000000000000}}]',
            ) as NodeResponse['protocols'][number]['contractTxBaseGas'],
          },
        ],
      });
      // an `abiVersion` of `__proto__` would be written into the prototype of the map: invisible
      // to the `Object.values` the plausibility check iterates, and still returned by the lookup
      // the fee is calculated from
      const byAbiVersion = parameters.contractTxBaseGas[Tag.ContractCallTx];
      expect(byAbiVersion).to.eql(defaultProtocolParameters.contractTxBaseGas[Tag.ContractCallTx]);
      expect(byAbiVersion?.[AbiVersion.Fate]).to.equal(180000);
    });

    it('takes parameters of the current protocol', () => {
      const parameters = convert({
        ...response,
        currentProtocolVersion: 7,
        protocols: [
          releaseConsensusParameters,
          { ...releaseConsensusParameters, version: 7, minimumGasPrice: 2000000000n },
        ],
      });
      expect(parameters.minGasPrice).to.equal(2000000000n);
    });

    it('fails if the current protocol is not reported', () => {
      expect(() => convert({ ...releaseResponse, currentProtocolVersion: 7 })).to.throw(
        InternalError,
        "Node doesn't provide parameters of the current protocol 7",
      );
    });

    it('keeps the miner minimum apart from the consensus one', () => {
      const parameters = convert({
        ...releaseResponse,
        nodeSettings: { ...releaseNodeSettings, minMinerGasPrice: 3000000000n },
      });
      expect(parameters.minGasPrice).to.equal(1000000000n);
      expect(parameters.minMinerGasPrice).to.equal(3000000000n);
    });

    it('accepts a base gas for a type the sdk release charges nothing for', () => {
      // `ChannelOffChainTx` is 0 in the sdk release, and a budget of `0 * maxRaiseFactor` would
      // refuse every value but 0 — refusing the whole response, and with it every transaction of
      // every type, the moment node starts charging for a type it used to charge nothing for
      const parameters = convert({
        ...releaseResponse,
        protocols: [
          {
            ...releaseConsensusParameters,
            txBaseGas: { ...releaseConsensusParameters.txBaseGas, ChannelOffChainTx: 15000 },
          },
        ],
      });
      expect(parameters.txBaseGas[Tag.ChannelOffChainTx]).to.equal(15000);
      // and it is counted as an ordinary raise, so it doesn't lower the gas price ceiling either
      expect(getGasPriceDivisor(parameters)).to.equal(1);
    });

    it('rejects an implausible base gas for a type the sdk release charges nothing for', () => {
      // it gets the budget of an ordinary type, not an unbounded one
      expect(() =>
        convert({
          ...releaseResponse,
          protocols: [
            {
              ...releaseConsensusParameters,
              txBaseGas: { ...releaseConsensusParameters.txBaseGas, ChannelOffChainTx: 15000001 },
            },
          ],
        }),
      ).to.throw(NodeError, 'Node reports the base gas of ChannelOffChainTx as 15000001,');
    });

    it('returns frozen parameters', () => {
      const parameters = convert(releaseResponse);
      expect(Object.isFrozen(parameters)).to.equal(true);
      expect(Object.isFrozen(parameters.txBaseGas)).to.equal(true);
      expect(Object.isFrozen(parameters.contractTxBaseGas)).to.equal(true);
      expect(Object.isFrozen(parameters.contractTxBaseGas[Tag.ContractCallTx])).to.equal(true);
      expect(Object.isFrozen(parameters.stateGasPerBlock[Tag.OracleQueryTx])).to.equal(true);
    });

    [
      {
        name: 'minimum gas price',
        message: 'Node reports the minimum gas price as 2000000000000,',
        patch: { minimumGasPrice: 2000000000000n },
      },
      {
        name: 'gas per byte',
        message: 'Node reports the gas per byte as 20001,',
        patch: { gasPerByte: 20001 },
      },
      {
        name: 'base gas of a transaction type',
        message: 'Node reports the base gas of SpendTx as 450000001,',
        patch: { txBaseGas: { SpendTx: 450000001 } },
      },
      {
        name: 'state gas fraction',
        message: 'Node reports the state gas per block of OracleQueryTx as 32000/1,',
        patch: { stateGasPerBlock: { OracleQueryTx: { part: 32000, whole: 1 } } },
      },
      {
        name: 'state gas fraction with a zero denominator',
        message: 'Node reports the state gas per block of OracleQueryTx as 32000/0,',
        patch: { stateGasPerBlock: { OracleQueryTx: { part: 32000, whole: 0 } } },
      },
      {
        name: 'state gas fraction that is not a number',
        message: 'Node reports the state gas per block of OracleQueryTx as 0/0,',
        patch: { stateGasPerBlock: { OracleQueryTx: { part: 0, whole: 0 } } },
      },
      {
        // the base gas of every type used to be checked against the biggest default of all types
        // (`ChannelForceProgressTx`, 30 times a `SpendTx`), which is not a budget for a `SpendTx`
        name: 'base gas of a transaction type against the default of that type',
        message: 'Node reports the base gas of SpendTx as 15000001,',
        patch: { txBaseGas: { SpendTx: 15000001 } },
      },
      {
        name: 'base gas of a contract transaction type',
        message: 'Node reports the base gas of ContractCallTx at abi version 3 as 180000001,',
        patch: {
          contractTxBaseGas: [
            { txType: 'ContractCallTx', abiVersion: AbiVersion.Fate, txBaseGas: 180000001 },
          ],
        },
      },
      {
        name: 'negative gas per byte',
        message: 'Node reports the gas per byte as -1,',
        patch: { gasPerByte: -1 },
      },
    ].forEach(({ name, message, patch }) => {
      it(`rejects an implausible ${name}`, () => {
        expect(() =>
          convert({
            ...releaseResponse,
            protocols: [{ ...releaseConsensusParameters, ...patch }],
          }),
        ).to.throw(NodeError, message);
      });
    });

    // the api client passes a value that doesn't match the schema node declares through as it is.
    // Such a value is not a refusal to build — node is running an api this SDK release can't read,
    // so `getCachedProtocolParameters` falls back to the parameters of the SDK release on it
    [
      {
        name: 'fractional',
        message: 'Node reports the gas per byte as 20.5,',
        patch: { gasPerByte: 20.5 },
      },
      {
        name: 'not a number',
        message: 'Node reports the gas per byte as null,',
        patch: { gasPerByte: null as unknown as number },
      },
      {
        name: 'a string',
        message: 'Node reports the gas per byte as 20,',
        patch: { gasPerByte: '20' as unknown as number },
      },
    ].forEach(({ name, message, patch }) => {
      it(`doesn't read a gas per byte that is ${name}`, () => {
        expect(() =>
          convert({
            ...releaseResponse,
            protocols: [{ ...releaseConsensusParameters, ...patch }],
          }),
        ).to.throw(InternalError, `${message} which doesn't match the schema it declares for it`);
      });
    });

    it("doesn't read a state gas fraction that is not a ratio of integers", () => {
      expect(() =>
        convert({
          ...releaseResponse,
          protocols: [
            {
              ...releaseConsensusParameters,
              stateGasPerBlock: {
                OracleQueryTx: { part: 32000, whole: null as unknown as number },
              },
            },
          ],
        }),
      ).to.throw(
        InternalError,
        'Node reports the state gas per block of OracleQueryTx as 32000/null,' +
          " which doesn't match the schema it declares for it",
      );
    });

    it('rejects a minimum gas price too big to be counted in', () => {
      // a bigint matches the schema whatever its magnitude, so it is implausible and not unreadable
      expect(() =>
        convert({
          ...releaseResponse,
          protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 10n ** 30n }],
        }),
      ).to.throw(
        NodeError,
        'Node reports the minimum gas price as 1000000000000000000000000000000,',
      );
    });

    it('rejects an implausible block gas limit', () => {
      expect(() =>
        convert({
          ...releaseResponse,
          nodeSettings: { ...releaseNodeSettings, blockGasLimit: 6000000001 },
        }),
      ).to.throw(NodeError, 'Node reports the block gas limit as 6000000001,');
    });

    it('rejects an implausible max auth fun gas', () => {
      expect(() =>
        convert({
          ...releaseResponse,
          nodeSettings: { ...releaseNodeSettings, maxAuthFunGas: 50000001 },
        }),
      ).to.throw(NodeError, 'Node reports the max auth fun gas as 50000001,');
    });

    it('rejects parameters that multiply into an implausible fee', () => {
      // each of them on its own is at the limit the SDK considers plausible, together they raise
      // the minimum fee a million times
      expect(() =>
        convert({
          ...releaseResponse,
          protocols: [
            {
              ...releaseConsensusParameters,
              minimumGasPrice: 1000000000000n,
              gasPerByte: 20000,
              txBaseGas: { ...releaseConsensusParameters.txBaseGas, SpendTx: 15000000 },
            },
          ],
        }),
      ).to.throw(NodeError, 'raising the minimum transaction fee 1000000 times');
    });

    it('counts the miner minimum gas price into the fee the parameters multiply into', () => {
      // the miner minimum is the floor `getCachedIncreasedGasPrice` lifts the gas price to, so it
      // raises the fee exactly like the consensus minimum does. Checking it on its own — as this
      // used to — left node the product of the two, a million times the fee of the SDK release,
      // while the consensus minimum stayed at its default and let every gas value go to the limit
      expect(() =>
        convert({
          ...releaseResponse,
          nodeSettings: { ...releaseNodeSettings, minMinerGasPrice: 1000000000000n },
          protocols: [
            {
              ...releaseConsensusParameters,
              gasPerByte: 20000,
              txBaseGas: { ...releaseConsensusParameters.txBaseGas, SpendTx: 15000000 },
            },
          ],
        }),
      ).to.throw(NodeError, 'raising the minimum transaction fee 1000000 times');
    });

    it('rejects parameters that multiply into an implausible contract transaction cost', () => {
      // the gas limit a contract transaction defaults to is the block gas limit less its fee gas,
      // so a raised block gas limit multiplies with the gas price just like the fee gas does
      expect(() =>
        convert({
          ...releaseResponse,
          nodeSettings: { ...releaseNodeSettings, blockGasLimit: 6000000000 },
          protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 1000000000000n }],
        }),
      ).to.throw(NodeError, 'raising the cost of a contract transaction 1000000 times');
    });

    it('counts the max auth fun gas into the contract transaction cost', () => {
      expect(() =>
        convert({
          ...releaseResponse,
          nodeSettings: { ...releaseNodeSettings, maxAuthFunGas: 50000000 },
          protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 1000000000000n }],
        }),
      ).to.throw(NodeError, 'raising the cost of a contract transaction 1000000 times');
    });

    it('checks a contract base gas against the default of that very type', () => {
      // `getTxBaseGas` reads `contractTxBaseGas` before `txBaseGas`, so this entry overrides the
      // base gas of a `PayingForTx` — 3000, not the 15000 a type-independent constant would use
      expect(() =>
        convert({
          ...releaseResponse,
          protocols: [
            {
              ...releaseConsensusParameters,
              contractTxBaseGas: [
                ...releaseConsensusParameters.contractTxBaseGas,
                { txType: 'PayingForTx', abiVersion: AbiVersion.Fate, txBaseGas: 3000001 },
              ],
            },
          ],
        }),
      ).to.throw(NodeError, 'Node reports the base gas of PayingForTx at abi version 3 as 3000001');
    });

    it('rejects a minimum gas price of zero', () => {
      // it makes every fee 0, and the fee based on the network demand a division by zero
      expect(() =>
        convert({
          ...releaseResponse,
          protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 0n }],
        }),
      ).to.throw(NodeError, 'Node reports the minimum gas price as 0');
    });

    it("doesn't overflow the stack on a long list of contract base gas entries", () => {
      const contractTxBaseGas = new Array(200000).fill(null).map(() => ({
        txType: 'ContractCallTx',
        abiVersion: AbiVersion.Fate,
        txBaseGas: 180000,
      }));
      expect(
        convert({
          ...releaseResponse,
          protocols: [{ ...releaseConsensusParameters, contractTxBaseGas }],
        }),
      ).to.eql(defaultProtocolParameters);
    });

    it('accepts parameters raising the fee by the factor it considers plausible', () => {
      const parameters = convert({
        ...releaseResponse,
        protocols: [
          {
            ...releaseConsensusParameters,
            minimumGasPrice: 100000000000n,
            gasPerByte: 200,
            txBaseGas: { ...releaseConsensusParameters.txBaseGas, SpendTx: 150000 },
          },
        ],
      });
      expect(parameters.minGasPrice).to.equal(100000000000n);
      expect(parameters.gasPerByte).to.equal(200);
    });

    it('keeps the values of the sdk release for a type node does not report', () => {
      const { OracleRegisterTx, ...txBaseGas } = releaseConsensusParameters.txBaseGas;
      const parameters = convert({
        ...releaseResponse,
        protocols: [
          {
            ...releaseConsensusParameters,
            txBaseGas,
            contractTxBaseGas: releaseConsensusParameters.contractTxBaseGas.filter(
              ({ txType }) => txType !== 'ContractCallTx',
            ),
            stateGasPerBlock: {},
          },
        ],
      });
      // building against the values of the SDK release is what the SDK did before this endpoint
      // existed, failing to build the transaction at all would be worse
      expect(parameters.txBaseGas[Tag.OracleRegisterTx]).to.equal(15000);
      expect(parameters.contractTxBaseGas[Tag.ContractCallTx]).to.eql({
        [AbiVersion.Sophia]: 180000,
        [AbiVersion.Fate]: 180000,
      });
      expect(parameters.stateGasPerBlock[Tag.OracleRegisterTx]).to.eql({
        part: 32000,
        whole: 175200,
      });
    });

    it('rejects an implausible miner minimum gas price', () => {
      expect(() =>
        convert({
          ...releaseResponse,
          nodeSettings: { ...releaseNodeSettings, minMinerGasPrice: 10n ** 20n },
        }),
      ).to.throw(NodeError, 'Node reports the miner minimum gas price as 100000000000000000000,');
    });

    it('accepts a raise within the plausible range', () => {
      const parameters = convert({
        ...releaseResponse,
        protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 999000000000n }],
      });
      expect(parameters.minGasPrice).to.equal(999000000000n);
    });
  });

  describe('getCachedProtocolParameters', () => {
    it('converts the response of node', async () => {
      const node = genNodeReturning(async () => response);
      expect((await getCachedProtocolParameters(node)).minGasPrice).to.equal(3000000000n);
    });

    it('reads the node policy settings from the endpoint that reports them', async () => {
      // the consensus parameters and this node's own policy are two endpoints, and the builder
      // needs both — a transaction is priced by the consensus minimum gas price and lifted to the
      // miner's, and the gas limit of a contract transaction comes from this node's block gas limit
      const node = genNode({
        getProtocolParameters: async () => response,
        getNodeSettings: async () => nodeSettings,
      });
      const parameters = await getCachedProtocolParameters(node);
      expect(parameters.minGasPrice).to.equal(3000000000n);
      expect(parameters.minMinerGasPrice).to.equal(4000000000n);
      expect(parameters.blockGasLimit).to.equal(5000000);
      expect(parameters.maxAuthFunGas).to.equal(60000);
    });

    it('falls back to defaults if the node policy settings cannot be requested', async () => {
      // half the parameters from node and half from the SDK release would be neither ones node
      // accepts nor ones the SDK was tested against — the two responses are taken as a set
      const node = genNode({
        getProtocolParameters: async () => response,
        getNodeSettings: async () => {
          throw new RestError('node-settings error: 404 status code', { statusCode: 404 });
        },
      });
      let parameters;
      const warnings = await collectWarnings(async () => {
        parameters = await getCachedProtocolParameters(node);
      });
      expect(parameters).to.equal(defaultProtocolParameters);
      expect(warnings).to.eql([]);
    });

    it("falls back to defaults if the node object doesn't have the settings endpoint", async () => {
      const node = { getProtocolParameters: async () => response } as unknown as Node;
      let parameters;
      const warnings = await collectWarnings(async () => {
        parameters = await getCachedProtocolParameters(node);
      });
      expect(parameters).to.equal(defaultProtocolParameters);
      expect(warnings.length).to.equal(0);
    });

    [403, 404].forEach((statusCode) => {
      it(`falls back to defaults silently on ${statusCode}`, async () => {
        const node = genNodeReturning(async () => {
          throw new RestError(`protocol-parameters error: ${statusCode} status code`, {
            statusCode,
          });
        });
        let parameters;
        const warnings = await collectWarnings(async () => {
          parameters = await getCachedProtocolParameters(node);
        });
        expect(parameters).to.equal(defaultProtocolParameters);
        expect(warnings).to.eql([]);
      });
    });

    [
      { name: 'node is syncing', error: new RestError('service unavailable', { statusCode: 503 }) },
      { name: 'a proxy is down', error: new RestError('bad gateway', { statusCode: 502 }) },
      { name: 'the connection failed', error: new Error('getaddrinfo ENOTFOUND') },
    ].forEach(({ name, error }) => {
      it(`falls back to defaults with a warning if ${name}`, async () => {
        const node = genNodeReturning(async () => {
          throw error;
        });
        let parameters;
        const warnings = await collectWarnings(async () => {
          parameters = await getCachedProtocolParameters(node);
        });
        expect(parameters).to.equal(defaultProtocolParameters);
        expect(warnings.length).to.equal(1);
        expect(warnings[0]).to.include("Can't get protocol parameters from node");
        expect(warnings[0]).to.include(error.message);
      });
    });

    // a response this SDK release can't read means node runs an api it doesn't know — the same
    // situation as a node without the endpoint, which the SDK built transactions through before
    // this endpoint existed. Failing instead would make every transaction unbuildable, and the
    // schema node reports these parameters by is younger than this feature
    [
      {
        name: "doesn't provide the current protocol",
        response: { ...releaseResponse, currentProtocolVersion: 7 },
        message: "Node doesn't provide parameters of the current protocol 7",
      },
      {
        name: 'reports a value the SDK release cannot read',
        response: {
          ...releaseResponse,
          protocols: [{ ...releaseConsensusParameters, gasPerByte: null as unknown as number }],
        },
        message: 'Node reports the gas per byte as null',
      },
      {
        name: 'renamed a field the SDK release reads',
        response: {
          ...releaseResponse,
          protocols: [{ ...releaseConsensusParameters, txBaseGas: undefined as never }],
        },
        message: '',
      },
      {
        name: 'answers something that is not a protocol parameters response',
        response: 'not a response' as never,
        message: '',
      },
    ].forEach(({ name, response: badResponse, message }) => {
      it(`falls back to defaults with a warning if node ${name}`, async () => {
        const node = genNodeReturning(async () => badResponse);
        let parameters;
        const warnings = await collectWarnings(async () => {
          parameters = await getCachedProtocolParameters(node);
        });
        expect(parameters).to.equal(defaultProtocolParameters);
        expect(warnings.length).to.equal(1);
        expect(warnings[0]).to.include("Can't get protocol parameters from node");
        expect(warnings[0]).to.include(message);
      });
    });

    it('remembers an unreadable response for a short time', async () => {
      const clock = useFakeTimers({ toFake: ['Date'] });
      try {
        let requests = 0;
        const node = genNodeReturning(async () => {
          requests += 1;
          return { ...releaseResponse, currentProtocolVersion: 7 };
        });
        await collectWarnings(async () => {
          // the same response converts the same way, retrying it per transaction built can't do
          // better than warn a round trip later
          expect(await getCachedProtocolParameters(node)).to.equal(defaultProtocolParameters);
          expect(await getCachedProtocolParameters(node)).to.equal(defaultProtocolParameters);
          expect(requests).to.equal(1);
          // but not for the whole cache ttl, the node operator may be fixing it right now
          clock.tick(30 * 1000 + 1);
          expect(await getCachedProtocolParameters(node)).to.equal(defaultProtocolParameters);
          expect(requests).to.equal(2);
        });
      } finally {
        clock.restore();
      }
    });

    it('rejects parameters that would price a transaction far above the SDK release', async () => {
      const node = genNodeReturning(async () => ({
        ...releaseResponse,
        protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 2000000000000n }],
      }));
      await expect(getCachedProtocolParameters(node)).to.be.rejectedWith(
        NodeError,
        'Node reports the minimum gas price as 2000000000000,',
      );
    });

    it('remembers a refusal for a short time', async () => {
      const clock = useFakeTimers({ toFake: ['Date'] });
      try {
        let requests = 0;
        const node = genNodeReturning(async () => {
          requests += 1;
          return {
            ...releaseResponse,
            protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 2000000000000n }],
          };
        });
        await expect(getCachedProtocolParameters(node)).to.be.rejectedWith(NodeError);
        await expect(getCachedProtocolParameters(node)).to.be.rejectedWith(NodeError);
        expect(requests).to.equal(1);
        clock.tick(30 * 1000 + 1);
        await expect(getCachedProtocolParameters(node)).to.be.rejectedWith(NodeError);
        expect(requests).to.equal(2);
      } finally {
        clock.restore();
      }
    });

    it("falls back to defaults if the node object doesn't have the endpoint", async () => {
      // a test double, or a `Node` of another copy of the SDK in the dependency tree
      const node = { getRecentGasPrices: async () => [] } as unknown as Node;
      let parameters;
      const warnings = await collectWarnings(async () => {
        parameters = await getCachedProtocolParameters(node);
      });
      expect(parameters).to.equal(defaultProtocolParameters);
      // silent, and cached for the full interval: a node object won't grow the method, so this is
      // the 404 of a node too old for the endpoint rather than a request that may work next time
      expect(warnings.length).to.equal(0);
    });

    it("doesn't warn per transient interval for a node object without the endpoint", async () => {
      const clock = useFakeTimers({ toFake: ['Date'] });
      try {
        const node = { getRecentGasPrices: async () => [] } as unknown as Node;
        const warnings = await collectWarnings(async () => {
          await getCachedProtocolParameters(node);
          // past the transient interval a failed request would be retried at, and past the full
          // one — neither may turn into a warning for a node object that has no such method
          clock.tick(31 * 1000);
          await getCachedProtocolParameters(node);
          clock.tick(11 * 60 * 1000);
          expect(await getCachedProtocolParameters(node)).to.equal(defaultProtocolParameters);
        });
        expect(warnings.length).to.equal(0);
      } finally {
        clock.restore();
      }
    });

    it('retries a node that failed to respond sooner than a node that answered', async () => {
      const clock = useFakeTimers({ toFake: ['Date'] });
      try {
        let requests = 0;
        const node = genNodeReturning(async () => {
          requests += 1;
          throw new RestError('service unavailable', { statusCode: 503 });
        });
        await collectWarnings(async () => {
          await getCachedProtocolParameters(node);
          clock.tick(30 * 1000 - 1);
          await getCachedProtocolParameters(node);
          expect(requests).to.equal(1);
          clock.tick(2);
          await getCachedProtocolParameters(node);
          expect(requests).to.equal(2);
        });
      } finally {
        clock.restore();
      }
    });

    it("doesn't retry a node without the endpoint until the cache expires", async () => {
      const clock = useFakeTimers({ toFake: ['Date'] });
      try {
        let requests = 0;
        const node = genNodeReturning(async () => {
          requests += 1;
          throw new RestError('not found', { statusCode: 404 });
        });
        await getCachedProtocolParameters(node);
        clock.tick(10 * 60 * 1000 - 1);
        await getCachedProtocolParameters(node);
        expect(requests).to.equal(1);
      } finally {
        clock.restore();
      }
    });

    it('requests node once', async () => {
      let requests = 0;
      const node = genNodeReturning(async () => {
        requests += 1;
        return releaseResponse;
      });
      expect(await getCachedProtocolParameters(node)).to.eql(defaultProtocolParameters);
      expect(await getCachedProtocolParameters(node)).to.eql(defaultProtocolParameters);
      expect(requests).to.equal(1);
    });

    it('shares a single request between concurrent callers', async () => {
      let requests = 0;
      let resolveRequest = (value: NodeResponse): void => {
        throw new Error(`not expected to be called with ${value.networkId}`);
      };
      const node = genNodeReturning(async () => {
        requests += 1;
        return new Promise<NodeResponse>((resolve) => {
          resolveRequest = resolve;
        });
      });
      const parameters = Promise.all([
        getCachedProtocolParameters(node),
        getCachedProtocolParameters(node),
        getCachedProtocolParameters(node),
      ]);
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      resolveRequest(releaseResponse);
      expect(await parameters).to.eql(new Array(3).fill(defaultProtocolParameters));
      expect(requests).to.equal(1);
    });

    it('requests node again after the cache expires', async () => {
      const clock = useFakeTimers({ toFake: ['Date'] });
      try {
        let requests = 0;
        const node = genNodeReturning(async () => {
          requests += 1;
          return releaseResponse;
        });
        await getCachedProtocolParameters(node);
        clock.tick(10 * 60 * 1000 - 1);
        await getCachedProtocolParameters(node);
        expect(requests).to.equal(1);
        clock.tick(2);
        await getCachedProtocolParameters(node);
        expect(requests).to.equal(2);
      } finally {
        clock.restore();
      }
    });

    it("doesn't apply parameters of one node on another", async () => {
      let selected = genNodeReturning(async () => response);
      // the same way `AeSdkMethods` passes node around, its identity doesn't change on `selectNode`
      const onNode = wrapWithProxy(() => selected);
      expect((await getCachedProtocolParameters(onNode)).minGasPrice).to.equal(3000000000n);
      selected = genNodeReturning(async () => releaseResponse);
      expect((await getCachedProtocolParameters(onNode)).minGasPrice).to.equal(1000000000n);
    });
  });

  describe('gas price', () => {
    const recentGasPrices = [{ minGasPrice: 1000000000n, utilization: 10 }];

    it('retries a demand gas price request that failed on the next build', async () => {
      let requests = 0;
      const node = genNode({
        getRecentGasPrices: async () => {
          requests += 1;
          if (requests === 1) throw new Error('Node is down');
          return recentGasPrices;
        },
        getProtocolParameters: async () => releaseResponse,
      });
      // caching the request rather than its result must not keep the whole cache interval worth
      // of builds failing on one bad response — unlike the parameters, a gas price that can't be
      // requested fails the build, so retrying is the only thing that can resolve it
      await expect(getCachedIncreasedGasPrice(node)).to.be.rejectedWith('Node is down');
      expect(await getCachedIncreasedGasPrice(node)).to.equal(0n);
      expect(requests).to.equal(2);
    });

    it("doesn't apply the demand gas price of one node on another", async () => {
      // the same fix as for the parameters: `onNode` is a proxy whose identity doesn't change on
      // `selectNode`, keying the cache by it would price a transaction by another network's demand
      let selected = genNode({
        getRecentGasPrices: async () => [{ minGasPrice: 5000000000n, utilization: 90 }],
        getProtocolParameters: async () => releaseResponse,
      });
      const onNode = wrapWithProxy(() => selected);
      expect(await getCachedIncreasedGasPrice(onNode)).to.equal(5050000000n);
      selected = genNode({
        getRecentGasPrices: async () => [{ minGasPrice: 7000000000n, utilization: 90 }],
        getProtocolParameters: async () => releaseResponse,
      });
      expect(await getCachedIncreasedGasPrice(onNode)).to.equal(7070000000n);
    });

    it('keeps the demand gas price for the whole interval after it arrives', async () => {
      const clock = useFakeTimers({ toFake: ['Date'] });
      try {
        let requests = 0;
        const node = genNode({
          getRecentGasPrices: async () => {
            requests += 1;
            // the request takes longer than half the interval — the interval is about how long
            // the value stays representative, so it starts when the value is known
            clock.tick(15 * 1000);
            return recentGasPrices;
          },
          getProtocolParameters: async () => releaseResponse,
        });
        await getCachedIncreasedGasPrice(node);
        expect(requests).to.equal(1);
        clock.tick(19 * 1000);
        await getCachedIncreasedGasPrice(node);
        expect(requests).to.equal(1);
        clock.tick(2 * 1000);
        await getCachedIncreasedGasPrice(node);
        expect(requests).to.equal(2);
      } finally {
        clock.restore();
      }
    });

    it("raises the gas price to the miner's minimum", async () => {
      const node = genNode({
        getRecentGasPrices: async () => recentGasPrices,
        getProtocolParameters: async () => releaseResponse,
        getNodeSettings: async () => ({ ...releaseNodeSettings, minMinerGasPrice: 2000000000n }),
      });
      expect(await getCachedIncreasedGasPrice(node)).to.equal(2000000000n);
    });

    it("doesn't raise the gas price if the miner accepts the consensus minimum", async () => {
      const node = genNode({
        getRecentGasPrices: async () => recentGasPrices,
        getProtocolParameters: async () => releaseResponse,
      });
      // 0n means "omit the gas price, the consensus minimum is enough"
      expect(await getCachedIncreasedGasPrice(node)).to.equal(0n);
    });

    // the ceiling is `MIN_GAS_PRICE * 100000`, node reporting a higher minimum doesn't raise it
    const maxSafeGasPrice = 100000000000000n;

    it('limits the gas price to the maximum safe value', async () => {
      const node = genNode({
        getRecentGasPrices: async () => [{ minGasPrice: 10n ** 18n, utilization: 90 }],
        getProtocolParameters: async () => releaseResponse,
      });
      let gasPrice;
      const warnings = await collectWarnings(async () => {
        gasPrice = await getCachedIncreasedGasPrice(node);
      });
      expect(gasPrice).to.equal(maxSafeGasPrice);
      expect(warnings.length).to.equal(1);
      expect(warnings[0]).to.include(`It will be limited to ${maxSafeGasPrice}`);
    });

    it("doesn't let node raise the maximum safe gas price", async () => {
      const node = genNode({
        getRecentGasPrices: async () => [{ minGasPrice: 10n ** 18n, utilization: 90 }],
        getProtocolParameters: async () => ({
          ...releaseResponse,
          protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 999000000000n }],
        }),
        getNodeSettings: async () => ({ ...releaseNodeSettings, minMinerGasPrice: 999000000000n }),
      });
      let gasPrice;
      await collectWarnings(async () => {
        gasPrice = await getCachedIncreasedGasPrice(node);
      });
      // the miner floor is applied before the ceiling, so it can't be used to bypass it either
      expect(gasPrice).to.equal(maxSafeGasPrice);
    });

    // a demand gas price below the ceiling of the sdk release, so that the tests below tell the
    // ceiling lowered by the parameters apart from the flat one
    const demandBelowCeiling = [{ minGasPrice: 10000000000000n, utilization: 90 }];

    it('lowers the gas price ceiling by the raise of the fee gas', async () => {
      // the fee is the gas of a transaction multiplied by the gas price, and node decides a part
      // of both. Reporting the base gas of a SpendTx at the limit the parameter checks consider
      // plausible passes them, and bounding the demand gas price on its own would leave node the
      // product of the two bounds — a thousand times the fee it can ask for otherwise
      const node = genNode({
        getRecentGasPrices: async () => demandBelowCeiling,
        getProtocolParameters: async () => ({
          ...releaseResponse,
          protocols: [
            {
              ...releaseConsensusParameters,
              txBaseGas: { ...releaseConsensusParameters.txBaseGas, SpendTx: 15000000 },
            },
          ],
        }),
      });
      let gasPrice;
      const warnings = await collectWarnings(async () => {
        gasPrice = await getCachedIncreasedGasPrice(node);
      });
      // the base gas is raised a thousand times, so the ceiling goes a thousand times down
      expect(gasPrice).to.equal(maxSafeGasPrice / 1000n);
      expect(warnings.length).to.equal(1);
      expect(warnings[0]).to.include(`exceeds the maximum safe value ${maxSafeGasPrice / 1000n}`);

      // the ceiling is a property of the network and of the parameters, not of the field asking
      // for a gas price — a contract transaction asks twice, once for `gasPrice` and once for the
      // `fee` counted from it, and both land on the same cached demand price. Warn once per
      // refresh rather than once per field
      const again = await collectWarnings(async () => {
        await Promise.all([getCachedIncreasedGasPrice(node), getCachedIncreasedGasPrice(node)]);
      });
      expect(again.length).to.equal(0);
    });

    it("doesn't lower the gas price ceiling by the raise of the block gas limit", async () => {
      // the block gas limit prices no fee — it bounds the gas limit a contract transaction
      // defaults to, and `gas-limit.ts` divides that default by the very same raise. Lowering the
      // ceiling here as well would charge it to the fee of every transaction, including the ones
      // that have no gas limit at all
      const node = genNode({
        getRecentGasPrices: async () => demandBelowCeiling,
        getProtocolParameters: async () => releaseResponse,
        getNodeSettings: async () => ({ ...releaseNodeSettings, blockGasLimit: 600000000 }),
      });
      let gasPrice;
      const warnings = await collectWarnings(async () => {
        gasPrice = await getCachedIncreasedGasPrice(node);
      });
      expect(gasPrice).to.equal(10100000000000n);
      expect(warnings.length).to.equal(0);
    });

    it("doesn't lower the gas price ceiling for the parameters of the sdk release", async () => {
      const node = genNode({
        getRecentGasPrices: async () => demandBelowCeiling,
        getProtocolParameters: async () => releaseResponse,
      });
      let gasPrice;
      const warnings = await collectWarnings(async () => {
        gasPrice = await getCachedIncreasedGasPrice(node);
      });
      expect(gasPrice).to.equal(10100000000000n);
      expect(warnings.length).to.equal(0);
    });

    it("doesn't lower the gas price ceiling by the parameters provided in options", async () => {
      const node = genNode({
        getRecentGasPrices: async () => demandBelowCeiling,
        getProtocolParameters: async () => {
          throw new Error('must not be requested');
        },
      });
      const parameters = {
        ...defaultProtocolParameters,
        txBaseGas: { ...defaultProtocolParameters.txBaseGas, [Tag.SpendTx]: 15000000 },
      };
      let gasPrice;
      const warnings = await collectWarnings(async () => {
        gasPrice = await getCachedIncreasedGasPrice(node, parameters);
      });
      // the parameters a caller provides are used as they are, the checks don't apply to them either
      expect(gasPrice).to.equal(10100000000000n);
      expect(warnings.length).to.equal(0);
    });

    it("doesn't cut the miner floor by the lowered ceiling", async () => {
      const node = genNode({
        getRecentGasPrices: async () => recentGasPrices,
        getProtocolParameters: async () => ({
          ...releaseResponse,
          protocols: [
            {
              ...releaseConsensusParameters,
              txBaseGas: { ...releaseConsensusParameters.txBaseGas, SpendTx: 1500000 },
            },
          ],
        }),
        getNodeSettings: async () => ({ ...releaseNodeSettings, minMinerGasPrice: 10000000000n }),
      });
      // the miner minimum is raised 10 times and the base gas 100 times — their product is the
      // 1000 the parameter checks allow, and the ceiling is 100000 times the minimum gas price. So
      // the lowered ceiling of 1e12 stays above the floor of 1e10, as it does whatever node reports
      expect(await getCachedIncreasedGasPrice(node)).to.equal(10000000000n);
    });

    it('uses the parameters it is given instead of requesting them', async () => {
      let requests = 0;
      const node = genNode({
        getRecentGasPrices: async () => recentGasPrices,
        getProtocolParameters: async () => {
          requests += 1;
          return releaseResponse;
        },
      });
      const parameters = { ...defaultProtocolParameters, minMinerGasPrice: 2000000000n };
      expect(await getCachedIncreasedGasPrice(node, parameters)).to.equal(2000000000n);
      expect(requests).to.equal(0);
    });

    it("doesn't cache a gas price based on the parameters it is given", async () => {
      const node = genNode({
        getRecentGasPrices: async () => recentGasPrices,
        getProtocolParameters: async () => releaseResponse,
      });
      const parameters = { ...defaultProtocolParameters, minMinerGasPrice: 2000000000n };
      expect(await getCachedIncreasedGasPrice(node, parameters)).to.equal(2000000000n);
      // the caller that provided no parameters must not be given the miner floor of the other one
      expect(await getCachedIncreasedGasPrice(node)).to.equal(0n);
    });
  });

  describe('transaction builder', () => {
    const raisedGasPrice = { ...defaultProtocolParameters, minGasPrice: 3000000000n };

    it('computes the minimum fee based on the consensus minimum gas price', () => {
      expect(unpackTx(buildTx(spendTxParams), Tag.SpendTx).fee).to.equal('16660000000000');
      const tx = buildTx({ ...spendTxParams, protocolParameters: raisedGasPrice });
      expect(unpackTx(tx, Tag.SpendTx).fee).to.equal('49980000000000');
    });

    it('computes the minimum fee based on the gas per byte', () => {
      const tx = buildTx({
        ...spendTxParams,
        protocolParameters: { ...defaultProtocolParameters, gasPerByte: 21 },
      });
      // 15000 base gas + 83 bytes * 21
      expect(unpackTx(tx, Tag.SpendTx).fee).to.equal('16743000000000');
    });

    it('computes the minimum fee based on the base gas of the transaction type', () => {
      const tx = buildTx({
        ...spendTxParams,
        protocolParameters: {
          ...defaultProtocolParameters,
          txBaseGas: { ...defaultProtocolParameters.txBaseGas, [Tag.SpendTx]: 16000 },
        },
      });
      expect(unpackTx(tx, Tag.SpendTx).fee).to.equal('17660000000000');
    });

    it("fails if the base gas of the transaction type isn't known", () => {
      expect(
        () =>
        buildTx({ ...spendTxParams, protocolParameters: { ...defaultProtocolParameters, txBaseGas: {} } }), // prettier-ignore
      ).to.throw(InternalError, 'Base gas of SpendTx is not known');
    });

    it('computes the state gas of an oracle transaction based on the reported fraction', () => {
      const params = {
        tag: Tag.OracleExtendTx,
        oracleId: address.replace('ak_', 'ok_') as `ok_${string}`,
        nonce: 1,
        oracleTtlValue: 500,
      } as const;
      // 15000 base gas + 50 bytes * 20 + ceil(32000 * 500 / 175200) = 92
      expect(unpackTx(buildTx(params), Tag.OracleExtendTx).fee).to.equal('16092000000000');
      const tx = buildTx({
        ...params,
        protocolParameters: {
          ...defaultProtocolParameters,
          stateGasPerBlock: {
            ...defaultProtocolParameters.stateGasPerBlock,
            [Tag.OracleExtendTx]: { part: 33000, whole: 100000 },
          },
        },
      });
      // ceil(33000 * 500 / 100000) = 165
      expect(unpackTx(tx, Tag.OracleExtendTx).fee).to.equal('16165000000000');
    });

    // node decides which transaction types report a state gas fraction, and `GaMetaTx`/`PayingForTx`
    // are types whose size gas excludes the inner transaction — it pays for its own bytes in its own
    // fee. Taking the state gas instead of that deduction, rather than on top of it, would charge the
    // whole inner transaction again: a raise proportional to the inner transaction's size, while the
    // fraction itself is bounded to add almost nothing, so no raise factor would account for it
    it('keeps deducting the inner transaction size when node reports a state gas for its type', () => {
      const inner = genSignedSpendTx();
      const { minGasPrice } = defaultProtocolParameters;
      const withStateGas = (tag: Tag, part: number): ProtocolParameters => ({
        ...defaultProtocolParameters,
        stateGasPerBlock: {
          ...defaultProtocolParameters.stateGasPerBlock,
          // the relative ttl of a type that has none is 1, so this adds `ceil(part / whole)` gas
          [tag]: { part, whole: 1 },
        },
      });

      const payingFor = { tag: Tag.PayingForTx, nonce: 1, payerId: address, tx: inner } as const;
      const payingForFee = (part?: number): bigint => {
        const parameters = part != null && { protocolParameters: withStateGas(Tag.PayingForTx, part) }; // prettier-ignore
        return BigInt(unpackTx(buildTx({ ...payingFor, ...parameters }), Tag.PayingForTx).fee);
      };
      // a fraction adding no gas leaves the fee of the SDK release parameters untouched
      expect(payingForFee(0)).to.equal(payingForFee());
      // and one that does add gas adds only that gas, not the size of the inner transaction
      expect(payingForFee(100)).to.equal(payingForFee() + 100n * minGasPrice);

      const gaMeta = {
        tag: Tag.GaMetaTx,
        gaId: address,
        authData: callData,
        abiVersion: AbiVersion.Fate,
        gasLimit: 50000,
        gasPrice: minGasPrice.toString(),
        tx: inner,
      } as const;
      const gaMetaFee = (part?: number): bigint => {
        const parameters = part != null && { protocolParameters: withStateGas(Tag.GaMetaTx, part) };
        return BigInt(unpackTx(buildTx({ ...gaMeta, ...parameters }), Tag.GaMetaTx).fee);
      };
      expect(gaMetaFee(0)).to.equal(gaMetaFee());
      expect(gaMetaFee(100)).to.equal(gaMetaFee() + 100n * minGasPrice);
    });

    it('rejects a fee below the raised minimum', () => {
      expect(() =>
        buildTx({ ...spendTxParams, fee: '16660000000000', protocolParameters: raisedGasPrice }),
      ).to.throw(IllegalArgumentError, 'Fee 16660000000000 must be bigger than 49980000000000');
    });

    const contractCallParams = {
      tag: Tag.ContractCallTx,
      callerId: address,
      nonce: 1,
      contractId,
      abiVersion: AbiVersion.Fate,
      amount: 0,
      callData,
    } as const;

    it('rejects a gas price below the raised minimum', () => {
      expect(() =>
        buildTx({
          ...contractCallParams,
          gasLimit: 100,
          gasPrice: '1000000000',
          protocolParameters: raisedGasPrice,
        }),
      ).to.throw(IllegalArgumentError, 'Gas price 1000000000 must be bigger than 3000000000');
    });

    it('limits the gas limit by the block gas limit', () => {
      expect(() =>
        buildTx({
          ...contractCallParams,
          gasLimit: 1000000,
          gasPrice: '1000000000',
          protocolParameters: { ...defaultProtocolParameters, blockGasLimit: 500000 },
        }),
      ).to.throw(IllegalArgumentError, 'Gas limit 1000000 must be less or equal to 318120');
    });

    it('limits the gas limit of a GaMetaTx by the max auth fun gas', () => {
      expect(() =>
        buildTx({
          tag: Tag.GaMetaTx,
          gaId: address,
          authData: callData,
          abiVersion: AbiVersion.Fate,
          gasLimit: 60001,
          gasPrice: '1000000000',
          tx: genSignedSpendTx(),
          protocolParameters: { ...defaultProtocolParameters, maxAuthFunGas: 60000 },
        }),
      ).to.throw(IllegalArgumentError, 'Gas limit 60001 must be less or equal to 60000');
    });

    it('takes the base gas of a contract transaction by its abi version', () => {
      const genParameters = (fate: number): ProtocolParameters => ({
        ...defaultProtocolParameters,
        contractTxBaseGas: {
          ...defaultProtocolParameters.contractTxBaseGas,
          [Tag.ContractCallTx]: { [AbiVersion.Sophia]: 180000, [AbiVersion.Fate]: fate },
        },
      });
      const genFee = (fate: number): string =>
        unpackTx(
          buildTx({
            ...contractCallParams,
            gasLimit: 100,
            gasPrice: '1000000000',
            protocolParameters: genParameters(fate),
          }),
          Tag.ContractCallTx,
        ).fee;
      // 10000 more base gas at the minimum gas price of 1e9
      expect(BigInt(genFee(190000)) - BigInt(genFee(180000))).to.equal(10000000000000n);
    });

    it('takes the maximum base gas for an abi version node did not report', () => {
      const genFee = (byAbiVersion: Partial<Record<AbiVersion, number>>): string =>
        unpackTx(
          buildTx({
            ...contractCallParams,
            gasLimit: 100,
            gasPrice: '1000000000',
            protocolParameters: {
              ...defaultProtocolParameters,
              contractTxBaseGas: {
                ...defaultProtocolParameters.contractTxBaseGas,
                [Tag.ContractCallTx]: byAbiVersion,
              },
            },
          }),
          Tag.ContractCallTx,
        ).fee;
      // the transaction is built with `AbiVersion.Fate`, node reports only the other one
      expect(genFee({ [AbiVersion.Sophia]: 190000 })).to.equal(genFee({ [AbiVersion.Fate]: 190000 })); // prettier-ignore
      // node charges the maximum of the versions it knows, not the first or the last of them
      expect(genFee({ [AbiVersion.NoAbi]: 180000, [AbiVersion.Sophia]: 190000 })).to.equal(
        genFee({ [AbiVersion.Fate]: 190000 }),
      );
    });

    it("doesn't overflow the stack taking the base gas of a long list of abi versions", () => {
      // node controls how many abi versions it reports, and the maximum of them is what a
      // transaction of an abi version it doesn't report is charged — taking it by passing each of
      // them as an argument of `Math.max` overflows the stack on a list this long
      const genFee = (byAbiVersion: Partial<Record<AbiVersion, number>>): string =>
        unpackTx(
          buildTx({
            ...contractCallParams,
            gasLimit: 100,
            gasPrice: '1000000000',
            protocolParameters: {
              ...defaultProtocolParameters,
              contractTxBaseGas: {
                ...defaultProtocolParameters.contractTxBaseGas,
                [Tag.ContractCallTx]: byAbiVersion,
              },
            },
          }),
          Tag.ContractCallTx,
        ).fee;
      const manyAbiVersions = Object.fromEntries(
        // above the abi versions the SDK knows, so that the transaction is of none of them
        new Array(200000).fill(null).map((_, index) => [index + 1000, 180000]),
      );
      expect(genFee({ ...manyAbiVersions, [AbiVersion.Sophia]: 190000 })).to.equal(
        genFee({ [AbiVersion.Sophia]: 190000 }),
      );
    });

    it("fails if node didn't report a base gas for the abi versions of a contract transaction", () => {
      expect(() =>
        buildTx({
          ...contractCallParams,
          gasLimit: 100,
          gasPrice: '1000000000',
          protocolParameters: {
            ...defaultProtocolParameters,
            contractTxBaseGas: { [Tag.ContractCallTx]: {} },
          },
        }),
      ).to.throw(InternalError, 'Base gas of ContractCallTx is not known');
    });

    // the inner transaction is built and signed already, its fee is below the minimum the outer
    // transaction is built against and can't be changed anymore
    it('builds a PayingForTx wrapping a transaction built against other parameters', () => {
      const inner = genSignedSpendTx();
      const params = { tag: Tag.PayingForTx, nonce: 1, payerId: address, tx: inner } as const;
      const tx = buildTx({ ...params, protocolParameters: raisedGasPrice });
      const unpacked = unpackTx(tx, Tag.PayingForTx);
      // the fee of the outer transaction follows the raised minimum
      expect(BigInt(unpacked.fee)).to.equal(
        BigInt(unpackTx(buildTx(params), Tag.PayingForTx).fee) * 3n,
      );
      // the inner transaction is kept exactly as it was built
      expect(buildTx(unpacked.tx)).to.equal(inner);
    });

    it('builds a GaMetaTx wrapping a transaction built against other parameters', () => {
      const inner = genSignedSpendTx();
      const params = {
        tag: Tag.GaMetaTx,
        gaId: address,
        authData: callData,
        abiVersion: AbiVersion.Fate,
        gasLimit: 50000,
        gasPrice: '3000000000',
        tx: inner,
      } as const;
      const tx = buildTx({ ...params, protocolParameters: raisedGasPrice });
      const unpacked = unpackTx(tx, Tag.GaMetaTx);
      expect(BigInt(unpacked.fee)).to.equal(BigInt(unpackTx(buildTx(params), Tag.GaMetaTx).fee) * 3n); // prettier-ignore
      expect(buildTx(unpacked.tx)).to.equal(inner);
    });

    // the parameters above the ones of the SDK release are the easy direction: the inner
    // transaction is rebuilt to measure its size against the parameters of the SDK release, and it
    // was built against them too. A node running parameters *below* them — a devmode or a local
    // node with a lowered `min_gas_price` — is what the measuring short-circuit is needed for
    const loweredGasPrice = { ...defaultProtocolParameters, minGasPrice: 100000000n };

    it('builds a PayingForTx wrapping a transaction with a fee below the sdk release minimum', () => {
      const encodedTx = buildTx({ ...spendTxParams, protocolParameters: loweredGasPrice });
      const inner = buildTx({ tag: Tag.SignedTx, encodedTx, signatures: [Buffer.alloc(64)] });
      // the inner fee is a tenth of what the parameters of the SDK release require
      expect(unpackTx(encodedTx, Tag.SpendTx).fee).to.equal('1666000000000');
      const tx = buildTx({
        tag: Tag.PayingForTx,
        nonce: 1,
        payerId: address,
        tx: inner,
        protocolParameters: loweredGasPrice,
      });
      // `buildTx(unpackTx(inner))` can't be used to compare: rebuilding a transaction whose values
      // are below the parameters of the SDK release checks them against those parameters again
      expect(unpackTx(tx, Tag.PayingForTx).tx).to.eql(unpackTx(inner, Tag.SignedTx));
      expect(unpackTx(tx, Tag.PayingForTx).fee).to.equal('542000000000');
    });

    it('builds a GaMetaTx wrapping a transaction with a gas price below the sdk release minimum', () => {
      const encodedTx = buildTx({
        ...contractCallParams,
        gasLimit: 100,
        gasPrice: '100000000',
        protocolParameters: loweredGasPrice,
      });
      const inner = buildTx({ tag: Tag.SignedTx, encodedTx, signatures: [Buffer.alloc(64)] });
      const tx = buildTx({
        tag: Tag.GaMetaTx,
        gaId: address,
        authData: callData,
        abiVersion: AbiVersion.Fate,
        gasLimit: 50000,
        gasPrice: '100000000',
        tx: inner,
        protocolParameters: loweredGasPrice,
      });
      expect(unpackTx(tx, Tag.GaMetaTx).tx).to.eql(unpackTx(inner, Tag.SignedTx));
    });

    it('builds a nested transaction that is not built yet against the same parameters', () => {
      const tx = buildTx({
        tag: Tag.PayingForTx,
        nonce: 1,
        payerId: address,
        tx: {
          tag: Tag.SignedTx,
          signatures: [Buffer.alloc(64)],
          encodedTx: spendTxParams,
        },
        protocolParameters: raisedGasPrice,
      } as unknown as Parameters<typeof buildTx>[0]);
      // the inner transaction would be underpriced if it were built against the sdk release
      const { encodedTx } = unpackTx(tx, Tag.PayingForTx).tx;
      expect(unpackTx(buildTx(encodedTx), Tag.SpendTx).fee).to.equal('49980000000000');
    });

    it('builds a PayingForTx wrapping a transaction above the block gas limit', () => {
      const encodedTx = buildTx({ ...contractCallParams, gasPrice: '1000000000' });
      const inner = buildTx({ tag: Tag.SignedTx, encodedTx, signatures: [Buffer.alloc(64)] });
      const tx = buildTx({
        tag: Tag.PayingForTx,
        nonce: 1,
        payerId: address,
        tx: inner,
        protocolParameters: { ...defaultProtocolParameters, blockGasLimit: 500000 },
      });
      expect(buildTx(unpackTx(tx, Tag.PayingForTx).tx)).to.equal(inner);
    });
  });

  describe('buildTxAsync', () => {
    function genBuilderNode(
      getProtocolParameters: () => Promise<NodeResponse>,
      getNodeSettings: () => Promise<NodeSettingsResponse> = async () => releaseNodeSettings,
    ): Node {
      return genNode({
        getProtocolParameters,
        getNodeSettings,
        getRecentGasPrices: async () => [{ minGasPrice: 1000000000n, utilization: 10 }],
      });
    }

    it('builds a transaction against the parameters of node', async () => {
      const onNode = genBuilderNode(async () => ({
        ...releaseResponse,
        protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 3000000000n }],
      }));
      const tx = await buildTxAsync({ ...spendTxParams, ttl: 0, onNode });
      expect(unpackTx(tx, Tag.SpendTx).fee).to.equal('49980000000000');
    });

    it("keeps the fee within the one of the sdk release when node raises the gas it's counted from", async () => {
      const genFee = async (txBaseGas: Record<string, number>): Promise<bigint> => {
        const onNode = genNode({
          // the demand of the network at the ceiling of the gas price
          getRecentGasPrices: async () => [{ minGasPrice: 10n ** 18n, utilization: 90 }],
          getProtocolParameters: async () => ({
            ...releaseResponse,
            protocols: [{ ...releaseConsensusParameters, txBaseGas }],
          }),
        });
        let tx: Encoded.Transaction | undefined;
        await collectWarnings(async () => {
          tx = await buildTxAsync({ ...spendTxParams, ttl: 0, onNode });
        });
        return BigInt(unpackTx(tx as unknown as Encoded.Transaction, Tag.SpendTx).fee);
      };

      const { txBaseGas } = releaseConsensusParameters;
      // node raises the base gas of a SpendTx by the factor the parameter checks allow. Without
      // the gas price ceiling going down by the same factor this fee would be ~1500ae — the
      // ceiling alone bounds the gas price, not the fee the gas multiplies it into
      const raised = await genFee({ ...txBaseGas, SpendTx: 15000000 });
      expect(raised <= (await genFee(txBaseGas))).to.equal(true);
      expect(raised).to.equal(1500168000000000000n);
    });

    it('prefers the parameters provided in options', async () => {
      const onNode = genBuilderNode(async () => ({
        ...releaseResponse,
        protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 3000000000n }],
      }));
      const tx = await buildTxAsync({
        ...spendTxParams,
        ttl: 0,
        onNode,
        protocolParameters: { ...defaultProtocolParameters, minGasPrice: 5000000000n },
      });
      expect(unpackTx(tx, Tag.SpendTx).fee).to.equal('83300000000000');
    });

    it("doesn't write the parameters into the params of the caller", async () => {
      const onNode = genBuilderNode(async () => releaseResponse);
      const params = { ...spendTxParams, ttl: 0, onNode };
      await buildTxAsync(params);
      expect(params).to.not.have.property('protocolParameters');
    });

    it("doesn't write the prepared values into the params of the caller", async () => {
      // `prepare` computes a fee and a nonce, and writing them back would make the next build out
      // of the same object skip the request for the parameters that priced it — and price it by
      // the ones of the SDK release instead
      const onNode = genBuilderNode(async () => ({
        ...releaseResponse,
        protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 3000000000n }],
      }));
      const params = { ...spendTxParams, ttl: 0, onNode };
      const first = await buildTxAsync(params);
      expect(params).to.not.have.property('fee');
      const second = await buildTxAsync(params);
      expect(unpackTx(second, Tag.SpendTx).fee).to.equal(unpackTx(first, Tag.SpendTx).fee);
      // 16660 gas at the 3 gwei minimum node reports, not at the 1 gwei of the SDK release
      expect(unpackTx(second, Tag.SpendTx).fee).to.equal('49980000000000');
    });

    it('rejects when node reports parameters the sdk refuses to build against', async () => {
      // the refusal must reach the caller of `buildTxAsync` — falling back to the parameters of
      // the SDK release would build a transaction this node rejects, and swallowing it in the
      // `catch` that keeps the request from being an unhandled rejection would do exactly that
      const onNode = genBuilderNode(async () => ({
        ...releaseResponse,
        protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 10n ** 18n }],
      }));
      await expect(buildTxAsync({ ...spendTxParams, ttl: 0, onNode })).to.be.rejectedWith(
        NodeError,
        'outside of the range the SDK considers plausible',
      );
    });

    it("doesn't request the parameters for a nested transaction that prices nothing", async () => {
      let requests = 0;
      const onNode = genBuilderNode(async () => {
        requests += 1;
        return releaseResponse;
      });
      // what `AccountGeneralized` nests in its `GaMetaTx`: an object rather than a `tx_` string,
      // so it is built here — but it wraps an already serialized transaction and has no priced
      // field of its own, so nothing in this build reads the parameters
      await buildTxAsync({
        tag: Tag.GaMetaTx,
        tx: { tag: Tag.SignedTx, encodedTx: decode(buildTx(spendTxParams)), signatures: [] },
        gaId: address,
        authData: 'cb_KxFE1kQfP4oEp9E=',
        fee: '100000000000000',
        gasLimit: 10000,
        gasPrice: '1000000000',
        onNode,
      });
      expect(requests).to.equal(0);
    });

    it("doesn't request the parameters if they are provided in options", async () => {
      let requests = 0;
      const onNode = genBuilderNode(async () => {
        requests += 1;
        return releaseResponse;
      });
      await buildTxAsync({
        ...spendTxParams,
        ttl: 0,
        onNode,
        protocolParameters: { ...defaultProtocolParameters, minGasPrice: 5000000000n },
      });
      // neither by the builder itself, nor by the gas price the fee is prepared from
      expect(requests).to.equal(0);
    });

    it('builds against the sdk release parameters if no node is selected', async () => {
      // `onNode` of an sdk instance is a proxy that is not `null` even with no node selected
      const onNode = wrapWithProxy<Node | undefined>(() => undefined);
      const tx = await buildTxAsync({ ...spendTxParams, ttl: 0, fee: '16660000000000', onNode });
      expect(unpackTx(tx, Tag.SpendTx).fee).to.equal('16660000000000');
    });

    it("doesn't request the parameters if every value they price is provided", async () => {
      let requests = 0;
      const onNode = genBuilderNode(async () => {
        requests += 1;
        return releaseResponse;
      });
      const tx = await buildTxAsync({
        ...spendTxParams,
        ttl: 0,
        fee: '16660000000000',
        onNode,
      });
      // such a build produces the same bytes with or without them, requesting them would turn a
      // build that needs no node into one that waits for it
      expect(requests).to.equal(0);
      expect(unpackTx(tx, Tag.SpendTx).fee).to.equal('16660000000000');
    });

    it('requests the parameters for a nested transaction of an unknown version', async () => {
      // `needsProtocolParameters` walks into a nested transaction to see whether anything in it
      // is priced, and can't get a schema for a tag or a version it doesn't know. It asks for the
      // parameters in that case rather than skipping them — the build fails a moment later in
      // `buildTx`, with a message about the tag rather than about a fee priced by the wrong
      // parameters, and a nested transaction that is priced must never build without them
      let requests = 0;
      const onNode = genBuilderNode(async () => {
        requests += 1;
        return releaseResponse;
      });
      await expect(
        buildTxAsync({
          tag: Tag.PayingForTx,
          nonce: 1,
          payerId: address,
          fee: '200000000000000',
          // everything nested is priced, so the unknown version is the only thing left that can
          // ask for the parameters — without the `catch` this build makes no request at all
          tx: {
            tag: Tag.SignedTx,
            version: 999,
            encodedTx: { ...spendTxParams, fee: '16660000000000' },
            signatures: [],
          },
          onNode,
        } as unknown as Parameters<typeof buildTxAsync>[0]),
      ).to.be.rejected;
      expect(requests).to.equal(1);
    });

    it('requests the parameters if a priced value is missing', async () => {
      let requests = 0;
      const onNode = genBuilderNode(async () => {
        requests += 1;
        return releaseResponse;
      });
      // `gasPrice` and `gasLimit` are priced as well, providing only the fee is not enough
      await buildTxAsync({
        tag: Tag.ContractCallTx,
        nonce: 1,
        callerId: address,
        contractId,
        amount: 0,
        callData,
        ttl: 0,
        fee: '200000000000000',
        onNode,
      });
      expect(requests).to.equal(1);
    });

    it('requests the parameters for a nested transaction that is not built yet', async () => {
      let requests = 0;
      const onNode = genBuilderNode(async () => {
        requests += 1;
        return releaseResponse;
      });
      await buildTxAsync({
        tag: Tag.PayingForTx,
        nonce: 1,
        payerId: address,
        fee: '20000000000000',
        // it is priced by these parameters in turn
        tx: { tag: Tag.SignedTx, encodedTx: spendTxParams, signatures: [Buffer.alloc(64)] },
        onNode,
      });
      expect(requests).to.equal(1);
    });

    [
      { name: 'built', genTx: (): unknown => genSignedSpendTx() },
      { name: 'serialized', genTx: (): unknown => decode(genSignedSpendTx()) },
    ].forEach(({ name, genTx }) => {
      it(`doesn't request the parameters for a nested transaction that is already ${name}`, async () => {
        let requests = 0;
        const onNode = genBuilderNode(async () => {
          requests += 1;
          return releaseResponse;
        });
        await buildTxAsync({
          tag: Tag.PayingForTx,
          nonce: 1,
          payerId: address,
          fee: '20000000000000',
          tx: genTx() as Encoded.Transaction,
          onNode,
        });
        // nothing left to price — the inner transaction is serialized as it is
        expect(requests).to.equal(0);
      });
    });

    it('requests the gas price of the network demand once', async () => {
      let requests = 0;
      const onNode = genNode({
        getProtocolParameters: async () => releaseResponse,
        getRecentGasPrices: async () => {
          requests += 1;
          return [{ minGasPrice: 1000000000n, utilization: 10 }];
        },
      });
      // `fee` and `gasPrice` are prepared concurrently and both ask for a gas price, so a cache
      // that holds the result rather than the request lets them both miss and request node twice
      await buildTxAsync({
        tag: Tag.ContractCallTx,
        nonce: 1,
        callerId: address,
        contractId,
        amount: 0,
        callData,
        gasLimit: 100,
        ttl: 0,
        onNode,
      });
      expect(requests).to.equal(1);
    });

    it('reads the base gas of a contract transaction by the abi version of its ct version', async () => {
      // `ContractCreateTx` and `GaAttachTx` hold the abi version in `ctVersion`, the other
      // contract-executing types have it as a field of their own
      const onNode = genBuilderNode(async () => ({
        ...releaseResponse,
        protocols: [
          {
            ...releaseConsensusParameters,
            contractTxBaseGas: [
              { txType: 'ContractCreateTx', abiVersion: AbiVersion.Sophia, txBaseGas: 75000 },
              { txType: 'ContractCreateTx', abiVersion: AbiVersion.Fate, txBaseGas: 750000 },
            ],
          },
        ],
      }));
      const tx = await buildTxAsync({
        tag: Tag.ContractCreateTx,
        nonce: 1,
        ownerId: address,
        code: callData,
        ctVersion: { vmVersion: VmVersion.Fate3, abiVersion: AbiVersion.Fate },
        callData,
        amount: 0,
        deposit: 0,
        gasLimit: 100,
        ttl: 0,
        onNode,
      });
      const { fee } = unpackTx(tx, Tag.ContractCreateTx);
      // the base gas of the abi version in `ctVersion` — reading `AbiVersion.Sophia` instead would
      // charge 75000, ten times less
      expect(BigInt(fee) > 750000n * 1000000000n).to.equal(true);
      expect(BigInt(fee) < 760000n * 1000000000n).to.equal(true);
    });

    it('keeps an explicit gas max over the block gas limit of node', async () => {
      const onNode = genBuilderNode(
        async () => releaseResponse,
        async () => ({ ...releaseNodeSettings, blockGasLimit: 6000000000 }),
      );
      const params = {
        tag: Tag.ContractCallTx,
        nonce: 1,
        callerId: address,
        contractId,
        amount: 0,
        callData,
        ttl: 0,
        onNode,
      } as const;
      // the gas limit defaults to the block gas limit less the fee gas of the transaction,
      // divided by the factor node raised the block gas limit by — the cost of a contract
      // transaction is `gasPrice * gasLimit`, and a caller providing `gasPrice` in options skips
      // the gas price ceiling that would otherwise pay for that raise
      const { gasLimit } = unpackTx(await buildTxAsync(params), Tag.ContractCallTx);
      expect(gasLimit).to.be.greaterThan(5990000);
      expect(gasLimit).to.be.lessThan(6000000);
      // an explicit gas max is the caller's own cap, it is not divided by anything — the gas
      // limit is what is left of it after the fee gas of the transaction (180000 base gas here)
      const capped = await buildTxAsync({ ...params, gasMax: 200000 });
      expect(unpackTx(capped, Tag.ContractCallTx).gasLimit).to.be.greaterThan(10000);
      expect(unpackTx(capped, Tag.ContractCallTx).gasLimit).to.be.lessThan(200000);
    });

    it('bounds the cost of a contract transaction when node raises only the block gas limit', async () => {
      // the raise of the block gas limit is paid for by the gas limit default alone — it doesn't
      // lower the gas price ceiling, so nothing else bounds this. The counterpart of the test
      // below, which prices the transaction itself and so skips the ceiling entirely
      const onNode = genNode({
        // the demand of the network above the ceiling, so the ceiling is what applies
        getRecentGasPrices: async () => [{ minGasPrice: 10n ** 18n, utilization: 90 }],
        getProtocolParameters: async () => releaseResponse,
        getNodeSettings: async () => ({ ...releaseNodeSettings, blockGasLimit: 6000000000 }),
      });
      let tx: Encoded.Transaction | undefined;
      await collectWarnings(async () => {
        tx = await buildTxAsync({
          tag: Tag.ContractCallTx,
          nonce: 1,
          callerId: address,
          contractId,
          amount: 0,
          callData,
          ttl: 0,
          onNode,
        });
      });
      const { gasLimit, gasPrice } = unpackTx(
        tx as unknown as Encoded.Transaction,
        Tag.ContractCallTx,
      );
      // what the parameters of the sdk release cost at the flat gas price ceiling: 6e6 * 1e14
      const releaseCost = 6000000n * 100000000000000n;
      expect(BigInt(gasLimit) * BigInt(gasPrice) <= releaseCost).to.equal(true);
    });

    it("doesn't shrink the gas limit by the raise of the fee gas", async () => {
      // the counterpart of the gas price ceiling: the base gas prices the fee, and the ceiling in
      // `gas-price.ts` pays for its raise. Dividing the gas limit by it as well would shrink the
      // default gas limit of every contract call because node repriced an unrelated type
      const onNode = genBuilderNode(async () => ({
        ...releaseResponse,
        protocols: [
          {
            ...releaseConsensusParameters,
            txBaseGas: {
              ...releaseConsensusParameters.txBaseGas,
              ChannelForceProgressTx: 45000000,
            },
          },
        ],
      }));
      const { gasLimit } = unpackTx(
        await buildTxAsync({
          tag: Tag.ContractCallTx,
          nonce: 1,
          callerId: address,
          contractId,
          amount: 0,
          callData,
          ttl: 0,
          onNode,
        }),
        Tag.ContractCallTx,
      );
      // the block gas limit is the one of the sdk release, so the default is what it always was
      expect(gasLimit).to.be.greaterThan(5800000);
      expect(gasLimit).to.be.lessThan(6000000);
    });

    it("doesn't shrink the gas limit of a contract call by the raise of the max auth fun gas", async () => {
      // `maxAuthFunGas` is the ceiling of an authentication function and no contract call reads
      // it — it is a node policy setting with a small default, so an operator raising it must not
      // shrink the gas limit of every contract call built against that node
      const onNode = genBuilderNode(
        async () => releaseResponse,
        // 100 times the 50000 of the SDK release, the block gas limit left where it was
        async () => ({ ...releaseNodeSettings, maxAuthFunGas: 5000000 }),
      );
      const { gasLimit } = unpackTx(
        await buildTxAsync({
          tag: Tag.ContractCallTx,
          nonce: 1,
          callerId: address,
          contractId,
          amount: 0,
          callData,
          ttl: 0,
          onNode,
        }),
        Tag.ContractCallTx,
      );
      // the block gas limit is the one of the sdk release, so the default is what it always was
      expect(gasLimit).to.be.greaterThan(5800000);
      expect(gasLimit).to.be.lessThan(6000000);
    });

    it("keeps the cost of a contract transaction within the sdk release when it's priced by the caller", async () => {
      const onNode = genBuilderNode(
        async () => releaseResponse,
        // the most node may raise it by, `checkParametersNotExcessive` rejects anything above
        async () => ({ ...releaseNodeSettings, blockGasLimit: 6000000000 }),
      );
      // the caller prices the transaction itself, so the ceiling in `gas-price.ts` never runs
      const gasPrice = '100000000000000';
      const tx = await buildTxAsync({
        tag: Tag.ContractCallTx,
        nonce: 1,
        callerId: address,
        contractId,
        amount: 0,
        callData,
        ttl: 0,
        gasPrice,
        onNode,
      });
      const { gasLimit } = unpackTx(tx, Tag.ContractCallTx);
      // 6e6 * 1e14 is what the parameters of the sdk release would have cost at this gas price
      const cost = BigInt(gasLimit) * BigInt(gasPrice);
      expect(cost <= 6000000n * BigInt(gasPrice)).to.equal(true);
    });

    it('prices a contract transaction by the gas price of the network demand', async () => {
      const onNode = genNode({
        getProtocolParameters: async () => ({
          ...releaseResponse,
          protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 2000000000n }],
        }),
        // above the utilization the sdk raises the gas price at
        getRecentGasPrices: async () => [{ minGasPrice: 4000000000n, utilization: 80 }],
      });
      const tx = await buildTxAsync({
        tag: Tag.ContractCallTx,
        nonce: 1,
        callerId: address,
        contractId,
        amount: 0,
        callData,
        gasLimit: 100,
        ttl: 0,
        onNode,
      });
      const { fee, gasPrice } = unpackTx(tx, Tag.ContractCallTx);
      // `getCachedIncreasedGasPrice` raises the demand price by a percent
      expect(gasPrice).to.equal('4040000000');
      // the minimum fee is counted at the consensus minimum gas price, then scaled to the gas
      // price the transaction actually pays — 2.02 times it here
      // 2020 * (180000 base gas + 98 bytes * 20 gas per byte) * 1000000000
      expect(fee).to.equal('735118400000000');
      expect(unpackTx(await buildTxAsync({ ...spendTxParams, ttl: 0, onNode }), Tag.SpendTx).fee)
        // the same scaling on a transaction that has no gas price of its own
        .to.equal('67306400000000');
    });
  });

  describe('re-serializing a transaction that already exists', () => {
    it('rebuilds a transaction priced below the parameters of this process', () => {
      const tx = buildTx({ ...spendTxParams, protocolParameters: cheapParameters });
      const fee = unpackTx(tx, Tag.SpendTx).fee;
      expect(fee).to.equal('1666000000000');
      // plain `buildTx` prices it against the parameters of the SDK release and refuses
      expect(() => buildTx(unpackTx(tx, Tag.SpendTx))).to.throw(
        IllegalArgumentError,
        'Fee 1666000000000 must be bigger than 16660000000000',
      );
      expect(rebuildUnpackedTx(unpackTx(tx))).to.equal(tx);
    });

    it("refuses parameters provided in options that can't price a transaction", () => {
      // they are trusted the same way `fee` is — their magnitude is deliberately not bounded,
      // that is what makes them the way out of the bounds applied to what node reports — but a
      // value that would make the arithmetic produce `NaN` or `Infinity` is an error, not a fee
      const build = (overrides: Partial<ProtocolParameters>): Encoded.Transaction =>
        buildTx({
          ...spendTxParams,
          protocolParameters: { ...defaultProtocolParameters, ...overrides },
        });
      expect(() => build({ minGasPrice: 0n })).to.throw(ArgumentError, 'minGasPrice');
      expect(() => build({ gasPerByte: NaN })).to.throw(ArgumentError, 'gasPerByte');
      expect(() => build({ gasPerByte: -1 })).to.throw(ArgumentError, 'gasPerByte');
      expect(() => build({ blockGasLimit: 1.5 })).to.throw(ArgumentError, 'blockGasLimit');
      expect(() =>
        // a `whole` of 0 makes the state gas, and so the fee, infinite
        build({ stateGasPerBlock: { [Tag.OracleQueryTx]: { part: 32000, whole: 0 } } }),
      ).to.throw(ArgumentError, 'stateGasPerBlock');
      expect(() => build({ minMinerGasPrice: -1n })).to.throw(ArgumentError, 'minMinerGasPrice');
      expect(() => build({ minMinerGasPrice: 1000000000 as unknown as bigint })).to.throw(
        ArgumentError,
        'minMinerGasPrice',
      );
      expect(() => build({ maxAuthFunGas: NaN })).to.throw(ArgumentError, 'maxAuthFunGas');
      // the tables are walked too, and the message names the type rather than its numeric tag
      expect(() => build({ txBaseGas: { [Tag.SpendTx]: -1 } })).to.throw(
        ArgumentError,
        'txBaseGas.SpendTx',
      );
      expect(() =>
        build({ contractTxBaseGas: { [Tag.ContractCallTx]: { [AbiVersion.Fate]: 1.5 } } }),
      ).to.throw(ArgumentError, 'contractTxBaseGas.ContractCallTx.3');
      expect(() =>
        build({ stateGasPerBlock: { [Tag.OracleQueryTx]: { part: -1, whole: 175200 } } }),
      ).to.throw(ArgumentError, 'stateGasPerBlock.OracleQueryTx.part');
      // a legitimately different network is accepted, magnitude is not what is checked
      expect(() => build({ minGasPrice: 1n })).to.not.throw();
      expect(() => build({ blockGasLimit: 10 ** 12 })).to.not.throw();
      expect(() => build({ minMinerGasPrice: 0n })).to.not.throw();
    });

    it("doesn't let the params of a transaction ask for their own values to be trusted", () => {
      // the params reach the fields as they are, so an application building a transaction out of
      // input it doesn't control must not be able to have the checks skipped through them — the
      // gas limit ceiling among them, which protects the user rather than the network
      expect(() =>
        buildTx({
          tag: Tag.ContractCallTx,
          nonce: 1,
          callerId: address,
          contractId,
          amount: 0,
          callData,
          gasLimit: 10 ** 12,
          gasPrice: 1,
          fee: 1,
          ...JSON.parse('{ "_serializeAsIs": true }'),
        }),
      ).to.throw(IllegalArgumentError, 'Gas price 1 must be bigger than 1000000000');
    });

    it('rebuilds a contract transaction with a gas price below the consensus minimum', () => {
      const tx = buildTx({
        tag: Tag.ContractCallTx,
        nonce: 1,
        callerId: address,
        contractId,
        amount: 0,
        callData,
        gasLimit: 100,
        gasPrice: 100000000,
        protocolParameters: cheapParameters,
      });
      expect(() => buildTx(unpackTx(tx, Tag.ContractCallTx))).to.throw(
        IllegalArgumentError,
        'Gas price 100000000 must be bigger than 1000000000',
      );
      expect(rebuildUnpackedTx(unpackTx(tx))).to.equal(tx);
    });

    it('rebuilds an aens transaction accepted under other consensus limits', () => {
      // these are consensus parameters too — node reports them as `nameClaimFees`,
      // `namePointersMaxCount`, and `nameClaimMaxExpiration` — while the values checked against
      // are the ones of the SDK release. A transaction that already exists was accepted under the
      // ones of its own network, so re-serializing it must not check it against these
      const asIs = rebuildUnpackedTx as (params: object) => Encoded.Transaction;

      const claim = asIs({
        tag: Tag.NameClaimTx,
        version: 2,
        nonce: 1,
        accountId: address,
        name: 'test.chain',
        nameSalt: 0,
        // a tenth of the minimum the SDK release knows for a name of this length
        nameFee: '13462690000000000000',
        fee: '20000000000000',
        ttl: 0,
      });
      expect(() => buildTx(unpackTx(claim, Tag.NameClaimTx))).to.throw('not enough to');
      expect(rebuildUnpackedTx(unpackTx(claim))).to.equal(claim);

      const genUpdate = (overrides: object): Encoded.Transaction =>
        asIs({
          tag: Tag.NameUpdateTx,
          version: 1,
          nonce: 1,
          accountId: address,
          nameId: 'nm_cVjoMBVH5UAthDx8hEijr5dF21yex6itrxbZZUMaftL941g9G',
          nameTtl: 1000,
          pointers: [{ key: 'account_pubkey', id: address }],
          clientTtl: 1,
          fee: '20000000000000',
          ttl: 0,
          ...overrides,
        });

      // above the maximum the SDK release knows
      const longTtl = genUpdate({ nameTtl: 500000 });
      expect(() => buildTx(unpackTx(longTtl, Tag.NameUpdateTx))).to.throw(
        'nameTtl should be a number between 1 and 180000 blocks',
      );
      expect(rebuildUnpackedTx(unpackTx(longTtl))).to.equal(longTtl);

      // more than the SDK release allows
      const manyPointers = genUpdate({
        pointers: Array.from({ length: 40 }, (_, i) => ({ key: `k${i}`, id: address })),
      });
      expect(() => buildTx(unpackTx(manyPointers, Tag.NameUpdateTx))).to.throw(
        '32 pointers or less',
      );
      expect(rebuildUnpackedTx(unpackTx(manyPointers))).to.equal(manyPointers);
    });

    it('rebuilds a transaction nested two levels deep', () => {
      const innerTx = buildTx({ ...spendTxParams, protocolParameters: cheapParameters });
      const signedInner = buildTx({
        tag: Tag.SignedTx,
        encodedTx: innerTx,
        signatures: [Buffer.alloc(64)],
      });
      const payingForTx = buildTx({
        tag: Tag.PayingForTx,
        nonce: 1,
        payerId: address,
        tx: signedInner,
        protocolParameters: cheapParameters,
      });
      // the innermost transaction is unpacked into params, so it is built again on the way out —
      // without the flag reaching it, its fee is checked against the parameters of this process
      expect(rebuildUnpackedTx(unpackTx(payingForTx))).to.equal(payingForTx);
    });

    it('reads the signer of a transaction built against a lower minimum gas price', () => {
      const signedTx = buildTx({
        tag: Tag.SignedTx,
        encodedTx: buildTx({ ...spendTxParams, protocolParameters: cheapParameters }),
        signatures: [Buffer.alloc(64)],
      });
      // `getTransactionSignerAddress` unpacks the signed transaction and builds the inner one
      // again — it used to throw `IllegalArgumentError` out of the builder instead. It is what
      // `verifyTransaction` starts with, so that used to fail on such a transaction as well
      expect(getTransactionSignerAddress(signedTx)).to.equal(address);
    });

    it('calculates the execution cost of a transaction built against a lower minimum gas price', () => {
      const payingForTx = buildTx({
        tag: Tag.PayingForTx,
        nonce: 1,
        payerId: address,
        tx: buildTx({
          tag: Tag.SignedTx,
          encodedTx: buildTx({ ...spendTxParams, protocolParameters: cheapParameters }),
          signatures: [Buffer.alloc(64)],
        }),
        protocolParameters: cheapParameters,
      });
      // it rebuilds the transaction nested in the `PayingForTx` to add its cost — that rebuild
      // used to throw, because the nested fee is below the minimum of the parameters of this
      // process
      expect(getExecutionCost(payingForTx)).to.equal(2208000000000n);
    });
  });

  describe('buildAuthTxHash', () => {
    const nodeInfo = { nodeNetworkId: 'ae_uat', consensusProtocolVersion: 6 };

    function genGaNode(getProtocolParameters: () => Promise<NodeResponse>): Node {
      return genNode({ getNodeInfo: async () => nodeInfo, getProtocolParameters });
    }

    it('prices the auth data entry by the parameters of node', async () => {
      // `Auth.tx_hash` is a `GaMetaTxAuthData` entry holding a `gasPrice`, and the entry checks it
      // against the consensus minimum just like a transaction does — without the parameters of
      // node a `gasPrice` correct for this network is refused whenever it runs a lower minimum
      const onNode = genGaNode(async () => ({
        ...releaseResponse,
        protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 100000000n }],
      }));
      const transaction = buildTx({ ...spendTxParams, protocolParameters: cheapParameters });
      const hash = await buildAuthTxHash(transaction, {
        fee: '100000000000000',
        gasPrice: 100000000,
        onNode,
      });
      expect(hash.length).to.equal(32);
      // the parameters provided in options are used as they are, and give the same hash
      const provided = await buildAuthTxHash(transaction, {
        fee: '100000000000000',
        gasPrice: 100000000,
        onNode: genGaNode(async () => releaseResponse),
        protocolParameters: cheapParameters,
      });
      expect(new Uint8Array(provided)).to.eql(new Uint8Array(hash));
    });

    it('re-derives the hash of an existing transaction without asking node', async () => {
      let requests = 0;
      const onNode = genGaNode(async () => {
        requests += 1;
        return releaseResponse;
      });
      const innerTx = buildTx({ ...spendTxParams, protocolParameters: cheapParameters });
      const gaMetaTx = buildTx({
        tag: Tag.GaMetaTx,
        tx: { tag: Tag.SignedTx, encodedTx: decode(innerTx), signatures: [] },
        gaId: address,
        authData: 'cb_KxFE1kQfP4oEp9E=',
        fee: '100000000000000',
        gasLimit: 10000,
        // below the minimum of the SDK release, as the network it was built for allows
        gasPrice: 100000000,
        protocolParameters: cheapParameters,
      });
      const signed = buildTx({ tag: Tag.SignedTx, encodedTx: gaMetaTx, signatures: [] });
      // the values of this transaction are fixed and belong to the parameters it was built
      // against, so nothing about it is checked and nothing has to be requested
      const hash = await buildAuthTxHashByGaMetaTx(signed, { onNode });
      expect(hash.length).to.equal(32);
      expect(requests).to.equal(0);
    });
  });

  describe('AccountGeneralized', () => {
    const account = new AccountGeneralized(address);
    // the auth call data is provided, so the compiler is only checked for being there
    const onCompiler = Object.create(null) as CompilerBase;

    function genGaAccountNode(
      getProtocolParameters: () => Promise<NodeResponse>,
      getNodeSettings: () => Promise<NodeSettingsResponse> = async () => releaseNodeSettings,
    ): Node {
      return genNode({
        getProtocolParameters,
        getNodeSettings,
        // below the utilization the demand-based gas price starts at, so the gas price of the
        // `GaMetaTx` is the consensus minimum of the parameters it was built against
        getRecentGasPrices: async () => [{ minGasPrice: 1000000000n, utilization: 10 }],
      });
    }

    /** The values the parameters price in the `GaMetaTx` the account wraps a transaction in */
    function pricedFieldsOf(signed: Encoded.Transaction): {
      fee: string;
      gasPrice: string;
      gasLimit: number;
    } {
      const { encodedTx } = unpackTx(signed, Tag.SignedTx);
      const { fee, gasPrice, gasLimit } = unpackTx(rebuildUnpackedTx(encodedTx), Tag.GaMetaTx);
      return { fee, gasPrice, gasLimit };
    }

    it('builds the wrapping GaMetaTx against the parameters it is given', async () => {
      // the account signs a transaction the caller built against these, and the `GaMetaTx` it
      // wraps it in is a transaction of its own that the same parameters have to price — node is
      // not asked for its own, and would report other ones here
      let requests = 0;
      const onNode = genGaAccountNode(async () => {
        requests += 1;
        return releaseResponse;
      });
      const signed = await account.signTransaction(buildTx(spendTxParams), {
        authData: { callData },
        onCompiler,
        onNode,
        protocolParameters: { ...cheapParameters, maxAuthFunGas: 40000 },
      });

      expect(requests).to.equal(0);
      // the consensus minimum and the max auth fun gas of the parameters given, not of node
      expect(pricedFieldsOf(signed)).to.eql({
        // 76420 gas at the 0.1 gwei minimum given, a tenth of the fee of the SDK release
        fee: '7642000000000',
        gasPrice: '100000000',
        gasLimit: 40000,
      });
    });

    it('requests the parameters from node when it is given none', async () => {
      const onNode = genGaAccountNode(async () => ({
        ...releaseResponse,
        protocols: [{ ...releaseConsensusParameters, minimumGasPrice: 3000000000n }],
      }));
      const signed = await account.signTransaction(buildTx(spendTxParams), {
        authData: { callData },
        onCompiler,
        onNode,
      });

      // the same 76420 gas as above, at the 3 gwei minimum node reports
      expect(pricedFieldsOf(signed)).to.eql({
        fee: '229260000000000',
        gasPrice: '3000000000',
        gasLimit: 50000,
      });
    });

    it('divides the default auth gas limit by the raise of the max auth fun gas', async () => {
      // the `GaMetaTx` counterpart of the block gas limit: the gas limit of an authentication
      // defaults to `maxAuthFunGas`, so node raising that raises the `gasPrice * gasLimit` the
      // authentication may cost. `gasMax` doesn't cap this type, so the default is the only place
      // the raise can be paid for
      const onNode = genGaAccountNode(
        async () => releaseResponse,
        // 100 times the 50000 of the SDK release
        async () => ({ ...releaseNodeSettings, maxAuthFunGas: 5000000 }),
      );
      const signed = await account.signTransaction(buildTx(spendTxParams), {
        authData: { callData },
        onCompiler,
        onNode,
      });

      const { gasPrice, gasLimit } = pricedFieldsOf(signed);
      // 5000000 divided by the raise of 100 — the default of the SDK release, so raising the
      // ceiling puts no more of the account's coins at risk on one authentication
      expect(gasLimit).to.equal(50000);
      expect(BigInt(gasPrice) * BigInt(gasLimit)).to.equal(
        defaultProtocolParameters.minGasPrice * BigInt(defaultProtocolParameters.maxAuthFunGas),
      );
    });

    it("doesn't shrink the auth gas limit by the raise of the block gas limit", async () => {
      // the counterpart of the test above: a `GaMetaTx` defaults its gas limit to `maxAuthFunGas`
      // and never reads the block gas limit, so a node allowing bigger micro blocks must not
      // shrink what one authentication function may spend
      const onNode = genGaAccountNode(
        async () => releaseResponse,
        // 1000 times the 6e6 of the SDK release, the max auth fun gas left where it was
        async () => ({ ...releaseNodeSettings, blockGasLimit: 6000000000 }),
      );
      const signed = await account.signTransaction(buildTx(spendTxParams), {
        authData: { callData },
        onCompiler,
        onNode,
      });

      expect(pricedFieldsOf(signed).gasLimit).to.equal(defaultProtocolParameters.maxAuthFunGas);
    });

    it('keeps an auth gas limit the caller provided over the raise of node', async () => {
      // the divisor applies to the value the SDK defaults to, not to one the caller chose — it is
      // still capped by the `maxAuthFunGas` node reports, which is what the raise made room for
      const onNode = genGaAccountNode(
        async () => releaseResponse,
        async () => ({ ...releaseNodeSettings, maxAuthFunGas: 5000000 }),
      );
      const signed = await account.signTransaction(buildTx(spendTxParams), {
        authData: { callData, gasLimit: 300000 },
        onCompiler,
        onNode,
      });

      expect(pricedFieldsOf(signed).gasLimit).to.equal(300000);
    });
  });
});
