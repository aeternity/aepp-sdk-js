import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { createSandbox } from 'sinon';
import { PipelineRequest, PipelineResponse, SendRequest } from '@azure/core-rest-pipeline';
import { url } from '.';
import {
  AeSdkBase, Node, NodeNotFoundError, ConsensusProtocolVersion,
} from '../../src';

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

  it('throws exception if unsupported protocol', async () => {
    const sandbox = createSandbox();
    const [name, version, message] = {
      5: ['Iris', '5', '5. Supported: >= 6 < 7'],
      6: ['Ceres', '6', '6. Supported: >= 5 < 6'],
    }[(await node.getNodeInfo()).consensusProtocolVersion];
    sandbox.stub(ConsensusProtocolVersion, name as any).value(undefined);
    sandbox.stub(ConsensusProtocolVersion, version as any).value(undefined);
    await expect(node.getNodeInfo()).to.be
      .rejectedWith(`Unsupported consensus protocol version ${message}`);
    sandbox.restore();
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
