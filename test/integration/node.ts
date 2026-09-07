import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { stub } from 'sinon';
import { RestError } from '@azure/core-rest-pipeline';
import { FullOperationResponse, OperationArguments, OperationSpec } from '@azure/core-client';
import { url } from '.';
import { AeSdkBase, Node, NodeNotFoundError, AccountMemory, buildTx, Tag } from '../../src';
import { bindRequestCounter } from '../utils';
import {
  getCachedProtocolParameters,
  getGasLimitDivisor,
  getGasPriceDivisor,
} from '../../src/tx/builder/protocol-parameters';

describe('Node client', () => {
  let node: Node;

  before(async () => {
    node = new Node(url);
  });

  it('wraps endpoints', () => {
    (['postTransaction', 'getCurrentKeyBlock'] as const).map((method) =>
      expect(node[method]).to.be.a('function'),
    );
  });

  it('gets key blocks by height for the first 3 blocks', async () => {
    expect(node.getKeyBlockByHeight).to.be.a('function');
    const blocks = await Promise.all([1, 2, 3].map(async (i) => node.getKeyBlockByHeight(i)));
    expect(blocks.map((b) => b.height)).to.eql([1, 2, 3]);
  });

  it("throws clear exceptions when can't get transaction by hash", async () => {
    await expect(node.getTransactionByHash('th_test')).to.be.rejectedWith(
      'v3/transactions/th_test error: Invalid hash',
    );
  });

  it('throws clear exceptions when body is empty', async () => {
    node.pipeline.addPolicy({
      name: 'remove-response-body',
      async sendRequest(request, next) {
        try {
          return await next(request);
        } catch (error) {
          if (!(error instanceof RestError) || error.response == null) throw error;
          (error.response as FullOperationResponse).parsedBody = null;
          throw error;
        }
      },
    });
    await expect(node.getTransactionByHash('th_test')).to.be.rejectedWith(
      'v3/transactions/th_test error: 400 status code',
    );
    node.pipeline.removePolicy({ name: 'remove-response-body' });
  });

  it('throws clear exceptions if ECONNREFUSED', async () => {
    const n = new Node('http://localhost:60148', { retryCount: 0 });
    await expect(n.getStatus()).to.be.rejectedWith('v3/status error: ECONNREFUSED');
  });

  it('retries requests if failed', async () =>
    (
      [
        ['ak_test', 1],
        ['ak_2CxRaRcMUGn9s5UwN36UhdrtZVFUbgG1BSX5tUAyQbCNneUwti', 4],
      ] as const
    ).reduce(async (prev, [address, requestCount]) => {
      await prev;

      const getCount = bindRequestCounter(node);
      await node.getAccountByPubkey(address).catch(() => {});
      expect(getCount()).to.equal(requestCount);
    }, Promise.resolve()));

  it('throws exception if unsupported protocol', async () => {
    const status = await node.getStatus();
    const s = stub(node, 'getStatus').resolves({ ...status, topBlockHeight: 0 });
    await expect(node.getNodeInfo()).to.be.rejectedWith(
      'Unsupported consensus protocol version 1. Supported: >= 6 < 8',
    );
    s.restore();
  });

  it('throws exception with code', async () => {
    const account = AccountMemory.generate();
    const spendTx = buildTx({
      tag: Tag.SpendTx,
      recipientId: account.address,
      senderId: account.address,
      nonce: 1e9,
    });
    const tx = await account.signTransaction(spendTx, { networkId: await node.getNetworkId() });
    await expect(node.postTransaction({ tx })).to.be.rejectedWith(
      RestError,
      'v3/transactions error: Invalid tx (nonce_too_high)',
    );
  });

  it('throws clear exceptions if deserializer failed', async () => {
    node.pipeline.addPolicy(
      {
        name: 'test',
        async sendRequest(request, next) {
          const response = await next(request);
          response.bodyAsText = '[{"min_gas_price":{}}]';
          return response;
        },
      },
      { phase: 'Deserialize' },
    );
    try {
      await expect(node.getRecentGasPrices()).to.be.rejectedWith(
        RestError,
        'Error SyntaxError: Cannot convert [object Object] to a BigInt occurred in deserializing the responseBody - [{"min_gas_price":{}}]',
      );
    } finally {
      node.pipeline.removePolicy({ name: 'test' });
    }
  });

  it("can't change $host", async () => {
    const n = new Node(url);
    // @ts-expect-error $host should be readonly
    n.$host = 'http://example.com';
  });

  it('returns recent gas prices', async () => {
    const example: Awaited<ReturnType<typeof node.getRecentGasPrices>> = [
      { minGasPrice: 0n, minutes: 5, utilization: 0 },
    ];
    expect(example);

    const actual = await node.getRecentGasPrices();
    expect(actual).to.eql(
      [1, 5, 15, 60].map((minutes, idx) => {
        const { minGasPrice, utilization } = actual[idx];
        return { minGasPrice, minutes, utilization };
      }),
    );
  });

  it('returns protocol parameters the transaction builder can price a transaction by', async function () {
    // The whole feature rests on these endpoints deserializing from a real node, and the client
    // for them is hand-patched in `tooling/autorest/node.yaml` and `postprocessing.js`. A unit test
    // can only check the client against a hand-written body — that is, against what this SDK
    // believes node answers. `getCachedProtocolParameters` falls back to the parameters of the SDK
    // release on anything it can't read, so without this test a client broken against the real wire
    // format would leave every unit and integration test green while the feature is a no-op in
    // production.
    let response;
    let nodeSettings;
    try {
      [response, nodeSettings] = await Promise.all([
        node.getProtocolParameters(),
        node.getNodeSettings(),
      ]);
    } catch (error) {
      // node too old for the endpoints, or with the `node_info`/`node_settings` groups disabled
      const status = error instanceof RestError ? error.statusCode : undefined;
      if (status !== 404 && status !== 403) throw error;
      this.skip();
      return;
    }

    const protocol = response.protocols.find(
      ({ version }) => version === response.currentProtocolVersion,
    );
    expect(protocol, 'node reports the parameters of the protocol it runs').to.be.an('object');
    if (protocol == null) return;
    // the values a fee is counted from — a coin amount is a bigint, a gas amount a number.
    // A regression in the `oneOf` collapse or the bigint mapping shows up as a string here
    expect(typeof protocol.minimumGasPrice).to.equal('bigint');
    expect(typeof nodeSettings.minMinerGasPrice).to.equal('bigint');
    expect(protocol.gasPerByte).to.be.a('number');
    expect(nodeSettings.blockGasLimit).to.be.a('number');
    expect(nodeSettings.maxAuthFunGas).to.be.a('number');
    // the tables, keyed by the transaction type names of `aetx:type_to_swagger_name/1`
    expect(protocol.txBaseGas.SpendTx).to.be.a('number');
    expect(protocol.contractTxBaseGas[0].txType).to.be.a('string');
    expect(protocol.contractTxBaseGas[0].abiVersion).to.be.a('number');
    expect(protocol.contractTxBaseGas[0].txBaseGas).to.be.a('number');
    expect(Object.values(protocol.stateGasPerBlock)[0].whole).to.be.a('number');

    // and the conversion the builder actually uses reads all of it without falling back
    const parameters = await getCachedProtocolParameters(node);
    expect(parameters.minGasPrice).to.equal(protocol.minimumGasPrice);
    expect(parameters.gasPerByte).to.equal(protocol.gasPerByte);
    expect(parameters.txBaseGas[Tag.SpendTx]).to.equal(protocol.txBaseGas.SpendTx);
    expect(parameters.blockGasLimit).to.equal(nodeSettings.blockGasLimit);
    expect(parameters.maxAuthFunGas).to.equal(nodeSettings.maxAuthFunGas);

    // The divisors are how much this node's parameters raise the fee and each gas limit above the
    // ones of the SDK release. They lower the gas price ceiling and the default gas limit by the
    // same factors, so anything but 1 here means transactions built against this node are priced
    // or sized differently than they were before the parameters were requested at all. An entry of
    // `defaultProtocolParameters` this node has outgrown shows up here and nowhere else — every
    // other assertion in this file compares node against node
    expect(getGasPriceDivisor(parameters)).to.equal(1);
    expect(getGasLimitDivisor(parameters, Tag.ContractCallTx)).to.equal(1);
    expect(getGasLimitDivisor(parameters, Tag.GaMetaTx)).to.equal(1);
  });

  it('returns time as Date', async () => {
    const block = await node.getTopHeader();
    expect(block.time).to.be.an.instanceOf(Date);
    expect(block.time.getFullYear()).to.be.within(2024, 2030);
  });

  it("doesn't remember failed version request", async () => {
    let shouldFail = true;
    class CustomNode extends Node {
      override sendOperationRequest = async <T>(
        args: OperationArguments,
        spec: OperationSpec,
      ): Promise<T> => {
        if (shouldFail) spec = { ...spec, path: `${url}/404${spec.path}` };
        return super.sendOperationRequest(args, spec);
      };
    }

    const n = new CustomNode(url);
    await expect(n.getTopHeader()).to.be.rejectedWith('v3/status error: 404 status code');
    shouldFail = false;
    expect(await n.getTopHeader()).to.be.an('object');
  });

  describe('Node Pool', () => {
    it('Throw error on using API without node', () => {
      const nodes = new AeSdkBase({});
      expect(() => nodes.api).to.throw(
        NodeNotFoundError,
        "You can't use Node API. Node is not connected or not defined!",
      );
    });

    it('Can change Node', async () => {
      const nodes = new AeSdkBase({
        nodes: [
          { name: 'first', instance: new Node(url) },
          { name: 'second', instance: node },
        ],
      });
      const activeNode = await nodes.getNodeInfo();
      expect(activeNode.name).to.equal('first');
      nodes.selectNode('second');
      const secondNodeInfo = await nodes.getNodeInfo();
      expect(secondNodeInfo.name).to.equal('second');
    });

    it('Fail on undefined node', async () => {
      const nodes = new AeSdkBase({
        nodes: [
          { name: 'first', instance: new Node(url) },
          { name: 'second', instance: node },
        ],
      });
      expect(() => nodes.selectNode('asdasd')).to.throw(
        NodeNotFoundError,
        'Node with name asdasd not in pool',
      );
    });

    it('Can get list of nodes', async () => {
      const nodes = new AeSdkBase({
        nodes: [{ name: 'first', instance: node }],
      });
      const nodesList = await nodes.getNodesInPool();
      expect(nodesList).to.have.length(1);
    });
  });
});
