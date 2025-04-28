import { Node, AccountMemory, buildTxAsync, Tag, encode, Encoding } from '@aeternity/aepp-sdk';

const onNode = new Node('https://testnet.aeternity.io'); // host your node for better decentralization
const account = new AccountMemory('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf');

const spendTx = await buildTxAsync({
  tag: Tag.SpendTx,
  senderId: account.address,
  recipientId: 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
  amount: 100, // aettos
  payload: encode(Buffer.from('spend tx payload'), Encoding.Bytearray),
  onNode,
});

const signedTx = await account.signTransaction(spendTx, { networkId: await onNode.getNetworkId() });

// broadcast the signed tx to the node
const { txHash } = await onNode.postTransaction({ tx: signedTx });
console.log(txHash);
