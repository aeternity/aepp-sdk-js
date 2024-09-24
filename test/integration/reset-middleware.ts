import { execSync } from 'child_process';
import {
  Node,
  AeSdkMethods,
  MemoryAccount,
  CompilerHttp,
  Contract,
  Name,
  encode,
  Encoding,
  Encoded,
  Oracle,
} from '../../src';
import { ensureInstanceOf, indent } from '../utils';
import { initializeChannels } from './channel-utils';

const aeSdk = new AeSdkMethods({
  onAccount: new MemoryAccount('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf'),
  onNode: new Node('http://localhost:4013'),
  onCompiler: new CompilerHttp('http://localhost:3080'),
});

const presetAccount1 = new MemoryAccount('sk_2bmJRanV8TmJzts8SYvBhR2kAd5pceVLczT5Sr8phybZYk4DRD');
const presetAccount2 = new MemoryAccount('sk_26HRDPXtYizxiU45f1Hcp7QauRhg5A7T7QGK2HnFbcgNfKinpy');

export const presetAccount1Address = presetAccount1.address;
export const presetAccount2Address = presetAccount2.address;

// TODO: move to a test after implementing https://github.com/aeternity/ae_mdw/issues/1805
async function initData(): Promise<void> {
  await aeSdk.spend(1e18, presetAccount1Address);
  const params1 = { ...aeSdk.getContext(), onAccount: presetAccount1 };
  const contract1 = await Contract.initialize({
    ...params1,
    sourceCode: indent`
      contract Identity =
        entrypoint getArg(x : int) = x`,
  });
  await contract1.$deploy([]);
  const name1 = new Name('123456789012345678901234567800.chain', params1);
  await name1.claim();

  await aeSdk.spend(1000e18, presetAccount2Address);
  const params2 = { ...aeSdk.getContext(), onAccount: presetAccount2 };
  const name2 = new Name('123456789012345678901234567801.chain', params2);
  await name2.claim();
  await name2.update({
    account_pubkey: presetAccount1.address,
    rawKey: encode(Buffer.from('c0ffee', 'hex'), Encoding.Bytearray),
  });

  const auction = new Name('1.chain', params2);
  await auction.claim();

  const contract2 = await Contract.initialize<{ spend: (a: Encoded.AccountAddress) => void }>({
    ...params2,
    sourceCode: indent`
      contract Test =
        datatype event = Event1(int) | Event2(string, int)

        stateful entrypoint spend(a : address) =
          Chain.event(Event2("test-string", 43))
          Chain.spend(a, 42)`,
  });
  await contract2.$deploy([], { amount: 100 });
  await contract2.spend(aeSdk.getContext().onAccount.address);

  const oracle = new Oracle(presetAccount2, params2);
  await oracle.register('string', 'string');

  const commonParams = {
    url: 'ws://localhost:4014/channel',
    initiatorId: presetAccount2Address,
    responderId: presetAccount1Address,
  };
  const [initiatorCh, responderCh] = await initializeChannels(
    {
      ...commonParams,
      role: 'initiator',
      host: 'localhost',
      sign: async (_tag, tx) => presetAccount2.signTransaction(tx, { networkId: 'ae_dev' }),
    },
    {
      ...commonParams,
      role: 'responder',
      sign: async (_tag, tx) => presetAccount1.signTransaction(tx, { networkId: 'ae_dev' }),
    },
  );
  initiatorCh.disconnect();
  responderCh.disconnect();
}

export default async function prepareMiddleware(): Promise<AeSdkMethods> {
  // TODO: remove after solving https://github.com/aeternity/ae_mdw/issues/1758
  try {
    execSync(
      'docker compose exec middleware ./bin/ae_mdw rpc ":aeplugin_dev_mode_app.start_unlink()"',
      { stdio: 'pipe' },
    );
    await initData();
  } catch (error) {
    ensureInstanceOf(error, Error);
    if (!error.message.includes('{:error, {:already_started')) throw error;
  }

  await (async function rollbackToFirstBlock() {
    const { status } = await fetch('http://localhost:4313/rollback?height=1');
    if (status !== 200) throw new Error(`Unexpected status code: ${status}`);
  })();

  return aeSdk;
}
