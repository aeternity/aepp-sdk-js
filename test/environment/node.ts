#!/usr/bin/env npx tsx
import { Node, AeSdk, MemoryAccount, CompilerHttp, Contract } from '../../src';

const contractSourceCode = `
contract Test =
 entrypoint getArg(x : map(string, int)) = x
`;
const node = new Node('https://testnet.aeternity.io');
const aeSdk = new AeSdk({
  nodes: [{ name: 'testnet', instance: node }],
  accounts: [new MemoryAccount('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf')],
  onCompiler: new CompilerHttp('https://v8.compiler.aepps.com'),
});

(async () => {
  console.log('Height:', await aeSdk.getHeight());
  console.log('Instanceof works correctly for nodes pool', aeSdk.pool instanceof Map);

  const contract = await Contract.initialize<{
    getArg: (x: Map<string, number | bigint | string>) => Map<string, bigint>;
  }>({ ...aeSdk.getContext(), sourceCode: contractSourceCode });
  const deployInfo = await contract.$deploy([]);
  console.log('Contract deployed at', deployInfo.address);
  const map = new Map([
    ['foo', 42],
    ['bar', 43],
  ]);
  const { decodedResult } = await contract.getArg(map);
  console.log('Call result', decodedResult);
  console.log('Instanceof works correctly for returned map', decodedResult instanceof Map);
})();
