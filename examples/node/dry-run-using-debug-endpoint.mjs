#!/usr/bin/env node

/*
# Dry-run using debug endpoint
By default, sdk uses [protectedDryRunTxs] endpoint limited to 6e6 gas by default.
It means if you try to dry-run a very big transaction (including intensive computations, or
returning much data) it may be rejected with `Invocation failed: "Out of gas"` error.

Ways to overcome this:
- split transactions into multiple smaller transactions;
- increase a gas limit for protected dry-runs by setting [http.external.gas_limit] in aenode
configuration;
- use [dryRunTxs] debug endpoint with the same api as a protected one.

The last options would work only for self-hosted nodes or testnet.aeternity.io which have debug
endpoints exposed via [http.endpoints.dry-run]. Also, sdk doesn't know anything about debug
endpoints. This script shows how to use a debug dry-run in sdk.

[protectedDryRunTxs]: https://api-docs.aeternity.io/#/external/ProtectedDryRunTxs
<!-- TODO: move accurate links after fixing https://github.com/aeternity/aeternity/issues/4369 -->
[http.external.gas_limit]: https://docs.aeternity.io/en/stable/configuration/
[http.endpoints.dry-run]: https://docs.aeternity.io/en/stable/configuration/
[dryRunTxs]: https://api-docs.aeternity.io/#/internal/DryRunTxs
*/

import { Node, AeSdk, MemoryAccount, CompilerHttp, Contract } from '@aeternity/aepp-sdk';

/*
The idea is to extend the base Node class overriding the method that will forward a request
to a debug endpoint in case it is a dry-run.
*/
class CustomNode extends Node {
  sendOperationRequest(args, spec) {
    if (spec.path === '/v3/dry-run') {
      spec = {
        ...spec,
        path: 'https://testnet.aeternity.io/v3/debug/transactions/dry-run',
      };
    }
    return super.sendOperationRequest(args, spec);
  }
}

// Let's set up an sdk and contract to test this.
const sourceCode = `
contract Test =
 entrypoint getArg(x : map(string, int)) = x
`;
const node = new CustomNode('https://testnet.aeternity.io');
const aeSdk = new AeSdk({
  nodes: [{ name: 'testnet', instance: node }],
  accounts: [new MemoryAccount('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf')],
  onCompiler: new CompilerHttp('https://v8.compiler.aepps.com'),
});

const contract = await Contract.initialize({ ...aeSdk.getContext(), sourceCode });
const deployInfo = await contract.$deploy([]);
console.log('Contract deployed at', deployInfo.address);

// This map is bigger than allowed by the default gas limit
const map = new Map(new Array(20000).fill().map((_, idx) => [`bar${idx}`, 43]));
// Sdk needs to know that we have a different gas limit, so `gasMax` is provided.
const {
  result: { gasUsed },
  tx: { fee },
} = await contract.getArg(map, { gasMax: 6e10 });
// The call succeeded and the gas used more than 6e6, which means that request forwarding works!
console.log('Call result', fee, gasUsed);
