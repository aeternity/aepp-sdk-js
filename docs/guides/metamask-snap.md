# Aeternity snap for MetaMask

This guide explains basic interactions on getting access to accounts on Aeternity snap for MetaMask using JS SDK.

## Prerequisite

Run the code from below you need:

- a MetaMask extension 12.2.4 or above installed in Chrome or Firefox browser;
- to setup an account in MetaMask (create a new one or restore by mnemonic phrase).

## Usage

Firstly, you need to create a factory of MetaMask accounts

```js
import { AccountMetamaskFactory } from '@aeternity/aepp-sdk';

const accountFactory = new AccountMetamaskFactory();
```

The next step is to install Aeternity snap to MetaMask. You can request installation by calling

```js
await accountFactory.installSnap();
```

If succeed it means that MetaMask is ready to provide access to accounts. Alternatively, you can call `ensureReady` instead of `installSnap`. The latter won't trigger a snap installation, it would just fall with the exception if not installed.

Using the factory, you can create instances of specific accounts by providing an index

```js
const account = await accountFactory.initialize(0);
console.log(account.address); // 'ak_2dA...'
console.log(await account.signTransaction('tx_...')); // 'tx_...' (with signature added)
```

The private key for the account would be derived in the MetaMask browser extension using the provided index and the mnemonic phrase it was initialized with. The private key won't leave the extension.

The complete examples of how to use it in browser can be found [here](https://github.com/aeternity/aepp-sdk-js/tree/develop/examples/browser/aepp/src/components/ConnectMetamask.vue).

## Account persistence

Account can be persisted and restored by saving values of `index`, `address` properties

```js
import { AccountMetamask } from '@aeternity/aepp-sdk';

const accountIndex = accountToPersist.index;
const accountAddress = accountToPersist.address;

const accountFactory = new AccountMetamaskFactory();
const restoredAccount = new AccountMetamask(accountFactory.provider, accountIndex, accountAddress);
```

It can be used to remember accounts between app restarts.

## Account discovery

In addition to the above, it is possible to get access to a sequence of accounts that already have been used on chain. It is needed, for example, to restore the previously used accounts in case the user connects MetaMask to an app that doesn't aware of them.

```js
import { Node } from '@aeternity/aepp-sdk';

const node = new Node('https://testnet.aeternity.io');
const accounts = await accountFactory.discover(node);
console.log(accounts[0].address); // 'ak_2dA...'
```

## Error handling

If the user rejects a transaction/message signing or address retrieving you will get an exception as a plain object with property `code` equals 4001, and `message` equals "User rejected the request.".
