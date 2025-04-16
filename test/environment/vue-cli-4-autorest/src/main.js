// eslint-disable-next-line import/no-unresolved
import { AeSdk, Node, AccountMemory } from '@aeternity/aepp-sdk';

const aeSdk = new AeSdk({
  nodes: [
    {
      name: 'testnet',
      instance: new Node('https://testnet.aeternity.io'),
    },
  ],
});

(async () => {
  const balance = await aeSdk.getBalance(AccountMemory.generate().address);
  if (balance !== '0') console.error('Balance expected to be equal 0');
  else console.log('`instanceof RestError` check works correctly');
})();
