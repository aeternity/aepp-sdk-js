import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { stub, createSandbox, replace } from 'sinon';
import { getSdk } from './index';
import {
  AeSdk, Contract, Node,
  commitmentHash, oracleQueryId, decode, encode, Encoded, Encoding,
  ORACLE_TTL_TYPES, Tag, AE_AMOUNT_FORMATS, buildTx, unpackTx, ConsensusProtocolVersion,
} from '../../src';

const nonce = 1;
const nameTtl = 1;
const clientTtl = 1;
const amount = 0;
const senderId: Encoded.AccountAddress = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688';
const recipientId: Encoded.AccountAddress = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688';
const name = 'test123test.chain';
const nameId = 'nm_2sFnPHi5ziAqhdApSpRBsYdomCahtmk3YGNZKYUTtUNpVSMccC';
const nameFee = '1000000000000000000000';
const pointers = [{ key: 'account_pubkey', id: senderId }];
const payload = encode(Buffer.from('test'), Encoding.Bytearray);

// Oracle
const queryFormat = '{\'city\': str}';
const responseFormat = '{\'tmp\': num}';
const queryFee = 30000;
const oracleTtl = { oracleTtlType: ORACLE_TTL_TYPES.delta, oracleTtlValue: 1234 };
const responseTtl = { responseTtlType: ORACLE_TTL_TYPES.delta, responseTtlValue: 123 };
const queryTtl = { queryTtlType: ORACLE_TTL_TYPES.delta, queryTtlValue: 12 };
const query = '{\'city\': \'Berlin\'}';
const queryResponse = '{\'tmp\': 101}';

// Contract test data
const contractSourceCode = `
contract Identity =
  entrypoint getArg(x : int) = x
`;
const gasLimit = 5e6;
const contractId = 'ct_TCQVoset7Y4qEyV5tgEAJAqa2Foz8J1EXqoGpq3fB6dWH5roe';

// Name
const nameSalt = 4204563566073083;
const commitmentId = commitmentHash(name, nameSalt);

describe('Transaction', () => {
  let aeSdk: AeSdk;
  const address = 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E';
  const oracleId = encode(decode(address), Encoding.OracleAddress);
  let contract: Contract<{}>;

  before(async () => {
    aeSdk = await getSdk(0);
    contract = await Contract.initialize({ ...aeSdk.getContext(), sourceCode: contractSourceCode });
  });

  it('build spend tx using denomination amount', async () => {
    const params = {
      senderId, recipientId, nonce, payload,
    };
    const spendAe = await aeSdk.buildTx({
      ...params, tag: Tag.SpendTx, amount: 1, denomination: AE_AMOUNT_FORMATS.AE,
    });
    const spendAettos = await aeSdk.buildTx({ ...params, tag: Tag.SpendTx, amount: 1e18 });
    spendAe.should.be.equal(spendAettos);
  });

  describe('gas price from node', () => {
    function nodeReplaceRecentGasPrices(minGasPrice: bigint, utilization: number = 80): Node {
      const node = new Node(aeSdk.api.$host);
      replace(node, 'getRecentGasPrices', async () => Promise.resolve([{
        minGasPrice,
        utilization,
        minutes: 1,
      }]));
      return node;
    }

    it('calculates fee in spend tx based on gas price', async () => {
      const spendTx = await aeSdk.buildTx({
        tag: Tag.SpendTx,
        senderId,
        recipientId,
        nonce,
        onNode: nodeReplaceRecentGasPrices(1000000023n),
      });
      const { fee } = unpackTx(spendTx, Tag.SpendTx);
      expect(fee).to.be.equal((16660n * 1010000023n).toString());
    });

    it('uses min gas price if utilization is low', async () => {
      const spendTx = await aeSdk.buildTx({
        tag: Tag.SpendTx,
        senderId,
        recipientId,
        nonce,
        onNode: nodeReplaceRecentGasPrices(1000000023n, 60),
      });
      const { fee } = unpackTx(spendTx, Tag.SpendTx);
      expect(fee).to.be.equal((16660n * 1000000000n).toString());
    });

    it('calculates fee in contract call based on gas price', async () => {
      const spendTx = await aeSdk.buildTx({
        tag: Tag.ContractCallTx,
        nonce,
        callerId: address,
        contractId,
        amount,
        gasLimit,
        callData: contract._calldata.encode('Identity', 'getArg', [2]),
        onNode: nodeReplaceRecentGasPrices(1000000023n),
      });
      const { fee, gasPrice } = unpackTx(spendTx, Tag.ContractCallTx);
      expect(fee).to.be.equal((182020n * 1010000023n).toString());
      expect(gasPrice).to.be.equal('1010000023');
    });

    it('warns if gas price too big', async () => {
      const s = stub(console, 'warn');
      const spendTx = await aeSdk.buildTx({
        tag: Tag.SpendTx,
        senderId,
        recipientId,
        nonce,
        onNode: nodeReplaceRecentGasPrices(99900000000000n),
      });
      expect(s.firstCall.args).to.be.eql([
        'Estimated gas price 100899000000000 exceeds the maximum safe value for unknown reason. '
        + 'It will be limited to 100000000000000. To overcome this restriction provide `gasPrice`/`fee` in options.',
      ]);
      s.restore();
      const { fee } = unpackTx(spendTx, Tag.SpendTx);
      expect(fee).to.be.equal((16660n * 100000000000000n).toString());
    });
  });

  const transactions: Array<[
    string, (() => Promise<Encoded.Transaction>) | Encoded.Transaction,
    () => Promise<Encoded.Transaction>,
  ]> = [[
    'spend',
    'tx_+F0MAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ChAeEyuPHdt6BOY7f6lkeaVLvFJaUxp/G8DOSSEhkDBn+wiBvBbWdOyAAAhg9e1n8oAAABhHRlc3QLK3OW',
    async () => aeSdk.buildTx({
      tag: Tag.SpendTx,
      senderId,
      recipientId,
      nonce,
      payload,
      amount: 2,
      denomination: AE_AMOUNT_FORMATS.AE,
    }),
  ], [
    'name pre-claim',
    'tx_+E8hAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQOvDVCf43V7alNbsUvTarXaCf7rjtWX36YLS4+JTa4jn4YPHaUyOAAAxRZ6Sg==',
    async () => aeSdk.buildTx({
      tag: Tag.NamePreclaimTx, accountId: senderId, nonce, commitmentId,
    }),
  ], [
    'name claim',
    'tx_+FEgAqEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABkXRlc3QxMjN0ZXN0LmNoYWluhw7wBz3KlPuJNjXJrcXeoAAAhg8m9WHIAABl9JBX',
    async () => aeSdk.buildTx({
      tag: Tag.NameClaimTx, accountId: senderId, nonce, name, nameSalt, nameFee,
    }),
  ], [
    'name update',
    'tx_+IQiAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPAHy8Y5hY2NvdW50X3B1YmtleaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABhhAUch6gAADR52s+',
    async () => aeSdk.buildTx({
      tag: Tag.NameUpdateTx, accountId: senderId, nonce, nameId, nameTtl, pointers, clientTtl,
    }),
  ], [
    'name update v2',
    'tx_+JwiAqEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPAH4SfKOYWNjb3VudF9wdWJrZXmiAQHhMrjx3begTmO3+pZHmlS7xSWlMafxvAzkkhIZAwZ/sNWIdGVzdCBrZXmLAnRlc3QgdmFsdWUBhhCENFlgAABtaPdX',
    async () => aeSdk.buildTx({
      tag: Tag.NameUpdateTx,
      version: 2,
      accountId: senderId,
      nonce,
      nameId,
      nameTtl,
      pointers: [
        ...pointers,
        { key: 'test key', id: encode(Buffer.from('test value'), Encoding.Bytearray) },
      ],
      clientTtl,
    }),
  ], [
    'name revoke',
    'tx_+E8jAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPIYPHaUyOAAA94BVgw==',
    async () => aeSdk.buildTx({
      tag: Tag.NameRevokeTx, accountId: senderId, nonce, nameId,
    }),
  ], [
    'name transfer',
    'tx_+HEkAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPKEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7CGD7v4WsgAAL1d+NM=',
    async () => aeSdk.buildTx({
      tag: Tag.NameTransferTx, accountId: senderId, nonce, nameId, recipientId,
    }),
  ], [
    'contract create',
    async () => {
      const { consensusProtocolVersion } = await aeSdk.api.getNodeInfo();
      if (consensusProtocolVersion === ConsensusProtocolVersion.Iris) {
        return 'tx_+LAqAaEBhAyXS5cWR3ZFS6EZ2E7cTWBYqN7JK27cV4qy0wtMQgABuGr4aEYDoKEijZbj/w2AeiWwAbldusME5pm3ZgPuomnZ3TbUbYgrwLg7nv5E1kQfADcANwAaDoI/AQM//oB4IJIANwEHBwEBAJgvAhFE1kQfEWluaXQRgHggkhlnZXRBcmeCLwCFNy40LjEAgwcAA4ZHcyzkwAAAAACDTEtAhDuaygCHKxFE1kQfP+mk9Ac=';
      }
      return 'tx_+LAqAaEBhAyXS5cWR3ZFS6EZ2E7cTWBYqN7JK27cV4qy0wtMQgABuGr4aEYDoKEijZbj/w2AeiWwAbldusME5pm3ZgPuomnZ3TbUbYgrwLg7nv5E1kQfADcANwAaDoI/AQM//oB4IJIANwEHBwEBAJgvAhFE1kQfEWluaXQRgHggkhlnZXRBcmeCLwCFOC4wLjAAgwgAA4ZHcyzkwAAAAACDTEtAhDuaygCHKxFE1kQfP6UPXo4=';
    },
    async () => aeSdk.buildTx({
      tag: Tag.ContractCreateTx,
      nonce,
      ownerId: address,
      code: await contract.$compile(),
      amount,
      gasLimit,
      callData: contract._calldata.encode('Identity', 'init', []),
    }),
  ], [
    'contract call',
    'tx_+GMrAaEBhAyXS5cWR3ZFS6EZ2E7cTWBYqN7JK27cV4qy0wtMQgABoQU7e5ChtHAGM1Nh0MVEV74SbrYb1b5FQ3WBd7OBpwALyQOGpYvVcSgAAACDTEtAhDuaygCIKxGAeCCSGwRJ4Is+',
    async () => aeSdk.buildTx({
      tag: Tag.ContractCallTx,
      nonce,
      callerId: address,
      contractId,
      amount,
      gasLimit,
      callData: contract._calldata.encode('Identity', 'getArg', [2]),
    }),
  ], [
    'oracle register simple',
    'tx_+E4WAaEBhAyXS5cWR3ZFS6EZ2E7cTWBYqN7JK27cV4qy0wtMQgABjXsnY2l0eSc6IHN0cn2Meyd0bXAnOiBudW19AACCAfSGDy5ouwgAAACEKur2',
    async () => aeSdk.buildTx({
      tag: Tag.OracleRegisterTx,
      nonce,
      accountId: address,
      queryFormat,
      responseFormat,
    }),
  ], [
    'oracle register',
    'tx_+FAWAaEBhAyXS5cWR3ZFS6EZ2E7cTWBYqN7JK27cV4qy0wtMQgABjXsnY2l0eSc6IHN0cn2Meyd0bXAnOiBudW19gnUwAIIE0oYPVuvwVAAAANBbp7Q=',
    async () => aeSdk.buildTx({
      tag: Tag.OracleRegisterTx,
      nonce,
      accountId: address,
      queryFormat,
      responseFormat,
      queryFee,
      ...oracleTtl,
    }),
  ], [
    'oracle extend simple',
    'tx_8RkBoQSEDJdLlxZHdkVLoRnYTtxNYFio3skrbtxXirLTC0xCAAEAggH0hg6itfGYAAC5Cppj',
    async () => aeSdk.buildTx({
      tag: Tag.OracleExtendTx, nonce, oracleId,
    }),
  ], [
    'oracle extend',
    'tx_8RkBoQSEDJdLlxZHdkVLoRnYTtxNYFio3skrbtxXirLTC0xCAAEAggTShg7B6PdUAADOPxKu',
    async () => aeSdk.buildTx({
      tag: Tag.OracleExtendTx, nonce, oracleId, ...oracleTtl,
    }),
  ], [
    'oracle post query simple',
    'tx_+GkXAaEBhAyXS5cWR3ZFS6EZ2E7cTWBYqN7JK27cV4qy0wtMQgABoQSEDJdLlxZHdkVLoRnYTtxNYFio3skrbtxXirLTC0xCAJJ7J2NpdHknOiAnQmVybGluJ32CMDkACgAKhg+XLtIcAAA6bZb1',
    async () => {
      const sandbox = createSandbox();
      sandbox.replace(aeSdk.api, 'getOracleByPubkey', async () => Promise.resolve({
        id: oracleId,
        responseFormat,
        queryFormat,
        queryFee: 12345n,
        abiVersion: '0',
        ttl: 42,
      }));
      const tx = await aeSdk.buildTx({
        tag: Tag.OracleQueryTx,
        nonce,
        oracleId,
        query,
        senderId: address,
      });
      sandbox.restore();
      return tx;
    },
  ], [
    'oracle post query',
    'tx_+GkXAaEBhAyXS5cWR3ZFS6EZ2E7cTWBYqN7JK27cV4qy0wtMQgABoQSEDJdLlxZHdkVLoRnYTtxNYFio3skrbtxXirLTC0xCAJJ7J2NpdHknOiAnQmVybGluJ32CdTAADAB7hg+XamzmAACKXhOU',
    async () => aeSdk.buildTx({
      tag: Tag.OracleQueryTx,
      nonce,
      oracleId,
      ...responseTtl,
      query,
      ...queryTtl,
      queryFee,
      senderId: address,
    }),
  ], [
    'oracle respond query simple',
    'tx_+F0YAaEEhAyXS5cWR3ZFS6EZ2E7cTWBYqN7JK27cV4qy0wtMQgABoLpilW+m1a50IepD5pClPlSP54fnFbPvEU5kIgFZExwhjHsndG1wJzogMTAxfQAKhg9fTbS8AADlFWOV',
    async () => aeSdk.buildTx({
      tag: Tag.OracleResponseTx,
      nonce,
      oracleId,
      queryId: oracleQueryId(address, nonce, oracleId),
      response: queryResponse,
    }),
  ], [
    'oracle respond query',
    'tx_+F0YAaEEhAyXS5cWR3ZFS6EZ2E7cTWBYqN7JK27cV4qy0wtMQgABoLpilW+m1a50IepD5pClPlSP54fnFbPvEU5kIgFZExwhjHsndG1wJzogMTAxfQB7hg9kMWdOAAB6Zd3I',
    async () => aeSdk.buildTx({
      tag: Tag.OracleResponseTx,
      nonce,
      oracleId,
      ...responseTtl,
      queryId: oracleQueryId(address, nonce, oracleId),
      response: queryResponse,
    }),
  ]];

  transactions.forEach(([txName, getExpected, getter]) => it(`build of ${txName} transaction`, async () => {
    const expected = typeof getExpected === 'function' ? await getExpected() : getExpected;
    expect(await getter()).to.be.equal(expected);
    expect(buildTx(unpackTx(expected))).to.be.equal(expected);
  }));
});
