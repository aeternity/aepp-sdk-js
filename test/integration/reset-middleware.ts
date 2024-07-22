import { execSync } from 'child_process';
import {
  Node, AeSdkMethods, MemoryAccount, CompilerHttp, Contract, Name,
} from '../../src';
import { ensureInstanceOf } from '../utils';

const aeSdk = new AeSdkMethods({
  onAccount: new MemoryAccount('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf'),
  onNode: new Node('http://localhost:4013'),
  onCompiler: new CompilerHttp('http://localhost:3080'),
});

const presetAccount = new MemoryAccount('sk_2bmJRanV8TmJzts8SYvBhR2kAd5pceVLczT5Sr8phybZYk4DRD');

export const presetAccountAddress = presetAccount.address;

// TODO: move to a test after implementing https://github.com/aeternity/ae_mdw/issues/1805
async function initAccount(): Promise<void> {
  await aeSdk.spend(1e18, presetAccountAddress);
  const params = { ...aeSdk.getContext(), onAccount: presetAccount };
  const contract = await Contract.initialize({
    ...params,
    sourceCode: ''
      + 'contract Identity =\n'
      + '  entrypoint getArg(x : int) = x',
  });
  await contract.$deploy([]);
  const name = new Name('9bKk410rt4ZEnPZnXyFJ2KovsIAzzm.chain', params);
  await name.claim();
}

export default async function prepareMiddleware(): Promise<AeSdkMethods> {
  // TODO: remove after solving https://github.com/aeternity/ae_mdw/issues/1758
  try {
    execSync(
      'docker compose exec middleware ./bin/ae_mdw rpc ":aeplugin_dev_mode_app.start_unlink()"',
      { stdio: 'pipe' },
    );
    await initAccount();
  } catch (error) {
    ensureInstanceOf(error, Error);
    if (!error.message.includes('{:error, {:already_started')) throw error;
  }

  await (async function rollbackToFirstBlock() {
    const { status } = await fetch('http://localhost:4313/rollback?height=1');
    if (status !== 200) throw new Error(`Unexpected status code: ${status}`);
  }());

  return aeSdk;
}
