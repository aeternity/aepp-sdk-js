# Ledger Hardware Wallet

This guide explains basic interactions on getting access to aeternity accounts on Ledger Hardware Wallet using JS SDK.

## Prerequisite
Run the code from below you need:
- a Ledger Hardware Wallet like Ledger Nano X, Ledger Nano S
- to install [Ledger Live](https://www.ledger.com/ledger-live)
- to install aeternity@0.4.4 or above app from Ledger Live to HW
- to have Ledger HW connected to computer, unlocked, with aeternity app opened

## Usage
To work with accounts on Ledger HW firstly you need to choose a transport implementation. Ledger HW can be connected through USB or Bluetooth using a specific [NPM package](https://developers.ledger.com/docs/transport/choose-the-transport/).

After creating a transport instance you need to create a factory of Ledger accounts
```js
import { AccountLedgerFactory } from '@aeternity/aepp-sdk';

const accountFactory = new AccountLedgerFactory(transport);
```
Using the factory, you can create instances of specific accounts by providing an index
```js
const account = await accountFactory.initialize(0);
console.log(account.address); // 'ak_2dA...'
console.log(await account.signTransaction('tx_...')); // 'tx_...' (with signature added)
```
The private key for the account would be derived on the Ledger device using the provided index and the mnemonic phrase it was initialized with.

The complete examples of how to use it in nodejs and browser can be found [here](../../test/environment/ledger).

## Account verification
To protect from MITM attacks is it recommended to ensure that the accessed account is the account actually available on Ledger. To do so, the app should show to user the address it have access to, the same as Ledger HW should show the address on its screen, and user should ensure that addresses the same. To trigger verification process you need to use `getAddress` method
```js
await accountFactory.getAddress(<account index>, true)
```

## Account persistence
Account can be persisted and restored by saving values of `index`, `address` properties
```js
import { AccountLedger } from '@aeternity/aepp-sdk';

const accountIndex = accountToPersist.index;
const accountAddress = accountToPersist.address;

const restoredAccount = new AccountLedger(transport, accountIndex, accountAddress);
```
It can be used to remember accounts between app restarts.

## Account discovery
In addition to the above, it is possible to get access to a sequence of accounts that already have been used on chain. It is needed, for example, to restore the previously used accounts in case the user connects Ledger HW to an app that doesn't aware of them.
```js
import { Node } from '@aeternity/aepp-sdk';

const node = new Node('https://testnet.aeternity.io');
const accounts = await accountFactory.discover(node);
console.log(accounts[0].address); // 'ak_2dA...'
```
