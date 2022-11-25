import fetch from 'cross-fetch';
import {
  Node, AeSdk, CompilerHttp, AccountLedgerFactory,
// eslint-disable-next-line import/extensions
} from '../../../es/index.mjs';

export default async function run(transport) {
  const accountFactory = new AccountLedgerFactory(transport);

  const account = await accountFactory.initialize(0);
  const { status } = await fetch(
    `https://faucet.aepps.com/account/${account.address}`,
    { method: 'POST' },
  );
  console.assert([200, 425].includes(status), 'Invalid faucet response code', status);

  const node = new Node('https://testnet.aeternity.io');
  const aeSdk = new AeSdk({
    nodes: [{ name: 'testnet', instance: node }],
    accounts: [account],
    onCompiler: new CompilerHttp('https://v7.compiler.aepps.com'),
  });

  const { hash } = await aeSdk.spend(1e17, 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR');
  console.log('Spend tx hash', hash);

  const contractSourceCode = `
contract Test =
 entrypoint getArg(x : int) = x + 1
`;
  const contract = await aeSdk.initializeContract({ sourceCode: contractSourceCode });
  const deployInfo = await contract.$deploy([]);
  console.log('Contract deployed at', deployInfo.address);

  const { decodedResult } = await contract.getArg(42, { callStatic: false });
  console.assert(decodedResult === 43n, 'Unexpected decodedResult');
  console.log('Call result', decodedResult);
}
