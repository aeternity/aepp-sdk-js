import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { stub } from 'sinon';
import { RestError } from '@azure/core-rest-pipeline';
import { FullOperationResponse, OperationArguments, OperationSpec } from '@azure/core-client';
import { url } from '.';
import {
  AeSdkBase, Node, NodeNotFoundError, MemoryAccount, buildTx, Tag,
} from '../../src';
import { bindRequestCounter } from '../utils';

describe('Node client', () => {
  let node: Node;

  before(async () => {
    node = new Node(url);
  });

  it('wraps endpoints', () => {
    (['postTransaction', 'getCurrentKeyBlock'] as const)
      .map((method) => expect(node[method]).to.be.a('function'));
  });

  it('gets key blocks by height for the first 3 blocks', async () => {
    expect(node.getKeyBlockByHeight).to.be.a('function');
    const blocks = await Promise.all([1, 2, 3].map(async (i) => node.getKeyBlockByHeight(i)));
    expect(blocks.map((b) => b.height)).to.eql([1, 2, 3]);
  });

  it('throws clear exceptions when can\'t get transaction by hash', async () => {
    await expect(node.getTransactionByHash('th_test'))
      .to.be.rejectedWith('v3/transactions/th_test error: Invalid hash');
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
    await expect(node.getTransactionByHash('th_test'))
      .to.be.rejectedWith('v3/transactions/th_test error: 400 status code');
    node.pipeline.removePolicy({ name: 'remove-response-body' });
  });

  it('throws clear exceptions if ECONNREFUSED', async () => {
    const n = new Node('http://localhost:60148', { retryCount: 0 });
    await expect(n.getStatus()).to.be.rejectedWith('v3/status error: ECONNREFUSED');
  });

  it('retries requests if failed', async () => ([
    ['ak_test', 1],
    ['ak_2CxRaRcMUGn9s5UwN36UhdrtZVFUbgG1BSX5tUAyQbCNneUwti', 4],
  ] as const).reduce(async (prev, [address, requestCount]) => {
    await prev;

    const getCount = bindRequestCounter(node);
    await node.getAccountByPubkey(address).catch(() => {});
    expect(getCount()).to.be.equal(requestCount);
  }, Promise.resolve()));

  it('throws exception if unsupported protocol', async () => {
    const status = await node.getStatus();
    const s = stub(node, 'getStatus').resolves({ ...status, topBlockHeight: 0 });
    await expect(node.getNodeInfo()).to.be
      .rejectedWith('Unsupported consensus protocol version 1. Supported: >= 6 < 7');
    s.restore();
  });

  it('throws exception with code', async () => {
    const account = MemoryAccount.generate();
    const spendTx = buildTx({
      tag: Tag.SpendTx, recipientId: account.address, senderId: account.address, nonce: 1e9,
    });
    const tx = await account.signTransaction(spendTx, { networkId: await node.getNetworkId() });
    await expect(node.postTransaction({ tx }))
      .to.be.rejectedWith(RestError, 'v3/transactions error: Invalid tx (nonce_too_high)');
  });

  it('can\'t change $host', async () => {
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
    expect(actual).to.be.eql([1, 5, 15, 60].map((minutes, idx) => {
      const { minGasPrice, utilization } = actual[idx];
      return { minGasPrice, minutes, utilization };
    }));
  });

  it('doesn\'t remember failed version request', async () => {
    let shouldFail = true;
    class CustomNode extends Node {
      override sendOperationRequest = async <T>(
        args: OperationArguments,
        spec: OperationSpec,
      ): Promise<T> => {
        if (shouldFail) spec = { ...spec, path: `https://test.stg.aepps.com${spec.path}` };
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
      expect(() => nodes.api)
        .to.throw(NodeNotFoundError, 'You can\'t use Node API. Node is not connected or not defined!');
    });

    it('Can change Node', async () => {
      const nodes = new AeSdkBase({
        nodes: [
          { name: 'first', instance: new Node(url) },
          { name: 'second', instance: node },
        ],
      });
      const activeNode = await nodes.getNodeInfo();
      activeNode.name.should.be.equal('first');
      nodes.selectNode('second');
      const secondNodeInfo = await nodes.getNodeInfo();
      secondNodeInfo.name.should.be.equal('second');
    });

    it('Fail on undefined node', async () => {
      const nodes = new AeSdkBase({
        nodes: [
          { name: 'first', instance: new Node(url) },
          { name: 'second', instance: node },
        ],
      });
      expect(() => nodes.selectNode('asdasd')).to.throw(NodeNotFoundError, 'Node with name asdasd not in pool');
    });

    it('Can get list of nodes', async () => {
      const nodes = new AeSdkBase({
        nodes: [
          { name: 'first', instance: node },
        ],
      });
      const nodesList = await nodes.getNodesInPool();
      nodesList.length.should.be.equal(1);
    });
  });
});
