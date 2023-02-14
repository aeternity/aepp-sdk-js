import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { PipelineRequest, PipelineResponse, SendRequest } from '@azure/core-rest-pipeline';
import { url, ignoreVersion } from '.';
import { AeSdkBase, Node, NodeNotFoundError } from '../../src';

describe('Node client', () => {
  let node: Node;

  before(async () => {
    node = new Node(url, { ignoreVersion });
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

  it('retries requests if failed', async () => ([
    ['ak_test', 1],
    ['ak_2CxRaRcMUGn9s5UwN36UhdrtZVFUbgG1BSX5tUAyQbCNneUwti', 4],
  ] as const).reduce(async (prev, [address, requestCount]) => {
    await prev;

    let counter = 0;
    node.pipeline.addPolicy({
      name: 'counter',
      async sendRequest(request: PipelineRequest, next: SendRequest): Promise<PipelineResponse> {
        counter += 1;
        return next(request);
      },
    }, { phase: 'Deserialize' });

    await node.getAccountByPubkey(address).catch(() => {});

    node.pipeline.removePolicy({ name: 'counter' });
    expect(counter).to.be.equal(requestCount);
  }, Promise.resolve()));

  describe('Node Pool', () => {
    it('Throw error on using API without node', () => {
      const nodes = new AeSdkBase({});
      expect(() => nodes.api)
        .to.throw(NodeNotFoundError, 'You can\'t use Node API. Node is not connected or not defined!');
    });

    it('Can change Node', async () => {
      const nodes = new AeSdkBase({
        nodes: [
          { name: 'first', instance: new Node(url, { ignoreVersion }) },
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
          { name: 'first', instance: new Node(url, { ignoreVersion }) },
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
