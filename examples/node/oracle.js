#!/usr/bin/env node
/*
# Register and query Oracle

Here we will register and query an oracle returning [factorial] of a number.
Read more about oracles in the [guide] section.

[factorial]: https://en.wikipedia.org/wiki/Factorial
[guide]: ../../guides/oracles.md
*/
import { Node, AeSdk, MemoryAccount, Oracle, OracleClient } from '@aeternity/aepp-sdk';

// Let's prepare sdk and account for Oracle
const node = new Node('https://testnet.aeternity.io');
const oracleAccount = MemoryAccount.generate();
const aeSdk = new AeSdk({
  nodes: [{ name: 'testnet', instance: node }],
  accounts: [new MemoryAccount('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf')],
});
await aeSdk.spend(2e14, oracleAccount.address);
console.log('Spend done');

// Creating and registering Oracle
const oracle = new Oracle(oracleAccount, aeSdk.getContext());
await oracle.register('factorial argument', 'factorial value');
console.log('Oracle registered');

// Start listening for queries and handle them
const stop = oracle.handleQueries((query) => {
  const arg = BigInt(query.decodedQuery);
  if (arg < 0) return "argument can't be negative";
  let res = 1n;
  for (let i = 2n; i <= arg; i += 1n) {
    res *= i;
  }
  return res.toString();
});

// Creating an Oracle client, making some queries.
// Assume it is done in a separate script/process/computer.
const oracleClient = new OracleClient(oracle.address, aeSdk.getContext());
for (const el of [1, 4, 20, 70, -5]) {
  const response = await oracleClient.query(el.toString());
  console.log(`query ${el}, response ${response}`);
}

// We don't need to handle queries anymore, so we can stop the listener.
stop();
