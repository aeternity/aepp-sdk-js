import { AeSdk, Node, MemoryAccount, encode, Encoding } from '@aeternity/aepp-sdk';

const aeSdk = new AeSdk({
  nodes: [
    {
      name: 'testnet',
      instance: new Node('https://testnet.aeternity.io'), // host your node for better decentralization
    },
  ],
  accounts: [new MemoryAccount('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf')],
});

const transactionInfo = await aeSdk.spend(
  100, // aettos
  'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
  { payload: encode(Buffer.from('spend tx payload'), Encoding.Bytearray) },
);
console.log(transactionInfo);
