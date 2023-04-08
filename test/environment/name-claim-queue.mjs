#!/usr/bin/env node
// eslint-disable-next-line import/extensions
import { Node, AeSdk, MemoryAccount } from '../../es/index.mjs';

const aeSdk = new AeSdk({
  nodes: [{ name: 'testnet', instance: new Node('https://testnet.aeternity.io') }],
  accounts: [MemoryAccount.generate()],
});

const { address } = aeSdk;
const { status } = await fetch(`https://faucet.aepps.com/account/${address}`, { method: 'POST' });
console.assert(status === 200, 'Invalid faucet response code', status);

const pauseUntilLoadBalancerGetSynced = () => new Promise((resolve) => {
  setTimeout(resolve, 1000);
});
const name = `test-${Math.random().toString(16).slice(2)}.chain`;
const options = { waitMined: false };
const txHashes = [];

const preclaim = await aeSdk.aensPreclaim(name, options);
txHashes.push(preclaim.hash);

await pauseUntilLoadBalancerGetSynced();
const claim = await aeSdk.aensClaim(name, preclaim.salt, options);
txHashes.push(claim.hash);

let res;

await pauseUntilLoadBalancerGetSynced();
res = await aeSdk.spend(0.5e18, 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E', options);
txHashes.push(res.hash);

await pauseUntilLoadBalancerGetSynced();
res = await aeSdk.spend(0.5e18, 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E', options);
txHashes.push(res.hash);

await pauseUntilLoadBalancerGetSynced();
res = await aeSdk.spend(0.5e18, 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E', options);
txHashes.push(res.hash);

console.log('All transactions submitted');

await Promise.all(txHashes.map((hash) => aeSdk.poll(hash)));
console.log('All transactions mined');
