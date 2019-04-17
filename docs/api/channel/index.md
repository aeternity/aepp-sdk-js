<a id="module_@aeternity/aepp-sdk/es/channel/index"></a>

## @aeternity/aepp-sdk/es/channel/index
Channel module

**Export**: Channel  
**Example**  
```js
import Channel from '@aeternity/aepp-sdk/es/channel/index'
```

* [@aeternity/aepp-sdk/es/channel/index](#module_@aeternity/aepp-sdk/es/channel/index)
    * [Channel([options])](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel) ⇒ `Object` ⏏
        * [~on(event, callback)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..on)
        * [~status()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..status) ⇒ `string`
        * [~state()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..state) ⇒ `object`
        * [~id()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..id) ⇒ `string`
        * [~update(from, to, amount, sign)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..update) ⇒ `Promise.&lt;object&gt;`
        * [~poi(addresses)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..poi) ⇒ `Promise.&lt;string&gt;`
        * [~balances(accounts)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..balances) ⇒ `Promise.&lt;object&gt;`
        * [~leave()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..leave) ⇒ `Promise.&lt;object&gt;`
        * [~shutdown(sign)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..shutdown) ⇒ `Promise.&lt;string&gt;`
        * [~withdraw(amount, sign, [callbacks])](#module_@aeternity/aepp-sdk/es/channel/index--Channel..withdraw) ⇒ `Promise.&lt;object&gt;`
        * [~deposit(amount, sign, [callbacks])](#module_@aeternity/aepp-sdk/es/channel/index--Channel..deposit) ⇒ `Promise.&lt;object&gt;`
        * [~createContract(options, sign)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..createContract) ⇒ `Promise.&lt;object&gt;`
        * [~callContract(options, sign)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..callContract) ⇒ `Promise.&lt;object&gt;`
        * [~callContractStatic(options)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..callContractStatic) ⇒ `Promise.&lt;object&gt;`
        * [~getContractCall(options)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..getContractCall) ⇒ `Promise.&lt;object&gt;`
        * [~getContractState(contract)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..getContractState) ⇒ `Promise.&lt;object&gt;`
        * [~cleanContractCalls()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..cleanContractCalls) ⇒ `Promise`
        * [~sendMessage(message, recipient)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..sendMessage)

<a id="exp_module_@aeternity/aepp-sdk/es/channel/index--Channel"></a>

### Channel([options]) ⇒ `Object` ⏏
Channel

**Kind**: Exported function  
**Returns**: `Object` - Channel instance  
**rtype**: `Channel`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| options.url | `String` |  | Channel url (for example: "ws://localhost:3001/channel") |
| options.role | `String` |  | Participant role ("initiator" or "responder") |
| options.initiatorId | `String` |  | Initiator's public key |
| options.responderId | `String` |  | Responder's public key |
| options.pushAmount | `Number` |  | Initial deposit in favour of the responder by the initiator |
| options.initiatorAmount | `Number` |  | Amount of tokens the initiator has committed to the channel |
| options.responderAmount | `Number` |  | Amount of tokens the responder has committed to the channel |
| options.channelReserve | `Number` |  | The minimum amount both peers need to maintain |
| [options.ttl] | `Number` |  | Minimum block height to include the channel_create_tx |
| options.host | `String` |  | Host of the responder's node |
| options.port | `Number` |  | The port of the responders node |
| options.lockPeriod | `Number` |  | Amount of blocks for disputing a solo close |
| [options.existingChannelId] | `Number` |  | Existing channel id (required if reestablishing a channel) |
| [options.offchainTx] | `Number` |  | Offchain transaction (required if reestablishing a channel) |
| options.sign | `function` |  | Function which verifies and signs transactions |

**Example**  
```js
Channel({
  url: 'ws://localhost:3001',
  role: 'initiator'
  initiatorId: 'ak$2QC98ahNHSrZLWKrpQyv91eQfCDA3aFVSNoYKdQ1ViYWVF8Z9d',
  responderId: 'ak$Gi42jcRm9DcZjk72UWQQBSxi43BG3285C9n4QSvP5JdzDyH2o',
  pushAmount: 3,
  initiatorAmount: 10,
  responderAmount: 10,
  channelReserve: 2,
  ttl: 1000,
  host: 'localhost',
  port: 3002,
  lockPeriod: 10,
  async sign (tag, tx) => await account.signTransaction(tx)
})
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..on"></a>

#### Channel~on(event, callback)
Register event listener function

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| event | `string` | Event name |
| callback | `function` | Callback function |

<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..status"></a>

#### Channel~status() ⇒ `string`
Get current status

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..state"></a>

#### Channel~state() ⇒ `object`
Get current state

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..id"></a>

#### Channel~id() ⇒ `string`
Get channel id

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..update"></a>

#### Channel~update(from, to, amount, sign) ⇒ `Promise.&lt;object&gt;`
Trigger an update

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| from | `string` | Sender's public address |
| to | `string` | Receiver's public address |
| amount | `number` | Transaction amount |
| sign | `function` | Function which verifies and signs transaction |

**Example**  
```js
channel.update(
  'ak$2QC98ahNHSrZLWKrpQyv91eQfCDA3aFVSNoYKdQ1ViYWVF8Z9d',
  'ak$Gi42jcRm9DcZjk72UWQQBSxi43BG3285C9n4QSvP5JdzDyH2o',
  10,
  async (tx) => await account.signTransaction(tx)
).then({ accepted, signedTx } =>
  if (accepted) {
    console.log('Update has been accepted')
  }
)
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..poi"></a>

#### Channel~poi(addresses) ⇒ `Promise.&lt;string&gt;`
Get proof of inclusion

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| addresses | `object` |  |
| [addresses.accounts] | `array.&lt;string&gt;` | List of account addresses to include in poi |
| [addresses.contracts] | `array.&lt;string&gt;` | List of contract addresses to include in poi |

**Example**  
```js
channel.poi({
  accounts: [
    'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
    'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E'
  ],
  contracts: ['ct_2dCUAWYZdrWfACz3a2faJeKVTVrfDYxCQHCqAt5zM15f3u2UfA']
}).then(poi => console.log(poi))
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..balances"></a>

#### Channel~balances(accounts) ⇒ `Promise.&lt;object&gt;`
Get balances

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| accounts | `array.&lt;string&gt;` | List of addresses to fetch balances from |

**Example**  
```js
channel.balances([
  'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
  'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E'
  'ct_2dCUAWYZdrWfACz3a2faJeKVTVrfDYxCQHCqAt5zM15f3u2UfA'
]).then(balances =>
  console.log(balances['ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH'])
)
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..leave"></a>

#### Channel~leave() ⇒ `Promise.&lt;object&gt;`
Leave channel

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  
**Example**  
```js
channel.leave().then(({ channelId, signedTx }) =>
  console.log(channelId)
  console.log(state)
)
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..shutdown"></a>

#### Channel~shutdown(sign) ⇒ `Promise.&lt;string&gt;`
Trigger a channel shutdown

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| sign | `function` | Function which verifies and signs transaction |

**Example**  
```js
channel.shutdown(
  async (tx) => await account.signTransaction(tx)
).then(tx => console.log('on_chain_tx', tx))
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..withdraw"></a>

#### Channel~withdraw(amount, sign, [callbacks]) ⇒ `Promise.&lt;object&gt;`
Withdraw tokens from the channel

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| amount | `number` | Amount of tokens to withdraw |
| sign | `function` | Function which verifies and signs withdraw transaction |
| [callbacks] | `object` |  |
| [callbacks.onOnChainTx] | `function` | Called when withdraw transaction has been posted on chain |
| [callbacks.onOwnWithdrawLocked] | `function` |  |
| [callbacks.onWithdrawLocked] | `function` |  |

**Example**  
```js
channel.withdraw(
  100,
  async (tx) => await account.signTransaction(tx),
  { onOnChainTx: (tx) => console.log('on_chain_tx', tx) }
).then(({ accepted, signedTx }) => {
  if (accepted) {
    console.log('Withdrawal has been accepted')
  } else {
    console.log('Withdrawal has been rejected')
  }
})
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..deposit"></a>

#### Channel~deposit(amount, sign, [callbacks]) ⇒ `Promise.&lt;object&gt;`
Deposit tokens into the channel

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| amount | `number` | Amount of tokens to deposit |
| sign | `function` | Function which verifies and signs deposit transaction |
| [callbacks] | `object` |  |
| [callbacks.onOnChainTx] | `function` | Called when deposit transaction has been posted on chain |
| [callbacks.onOwnDepositLocked] | `function` |  |
| [callbacks.onDepositLocked] | `function` |  |

**Example**  
```js
channel.deposit(
  100,
  async (tx) => await account.signTransaction(tx),
  { onOnChainTx: (tx) => console.log('on_chain_tx', tx) }
).then(({ accepted, state }) => {
  if (accepted) {
    console.log('Deposit has been accepted')
    console.log('The new state is:', state)
  } else {
    console.log('Deposit has been rejected')
  }
})
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..createContract"></a>

#### Channel~createContract(options, sign) ⇒ `Promise.&lt;object&gt;`
Create a contract

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| options | `object` |  |
| [options.code] | `string` | Api encoded compiled AEVM byte code |
| [options.callData] | `string` | Api encoded compiled AEVM call data for the code |
| [options.deposit] | `number` | Initial amount the owner of the contract commits to it |
| [options.vmVersion] | `number` | Version of the AEVM |
| [options.abiVersion] | `number` | Version of the ABI |
| sign | `function` | Function which verifies and signs create contract transaction |

**Example**  
```js
channel.createContract({
  code: 'cb_HKtpipK4aCgYb17wZ...',
  callData: 'cb_1111111111111111...',
  deposit: 10,
  vmVersion: 3,
  abiVersion: 1
}).then(({ accepted, signedTx, address }) => {
  if (accepted) {
    console.log('New contract has been created')
    console.log('Contract address:', address)
  } else {
    console.log('New contract has been rejected')
  }
})
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..callContract"></a>

#### Channel~callContract(options, sign) ⇒ `Promise.&lt;object&gt;`
Call a contract

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| options | `object` |  |
| [options.amount] | `string` | Amount the caller of the contract commits to it |
| [options.callData] | `string` | ABI encoded compiled AEVM call data for the code |
| [options.contract] | `number` | Address of the contract to call |
| [options.abiVersion] | `number` | Version of the ABI |
| sign | `function` | Function which verifies and signs contract call transaction |

**Example**  
```js
channel.callContract({
  contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
  callData: 'cb_1111111111111111...',
  amount: 0,
  abiVersion: 1
}).then(({ accepted, signedTx }) => {
  if (accepted) {
    console.log('Contract called succesfully')
  } else {
    console.log('Contract call has been rejected')
  }
})
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..callContractStatic"></a>

#### Channel~callContractStatic(options) ⇒ `Promise.&lt;object&gt;`
Call contract using dry-run

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| options | `object` |  |
| [options.amount] | `string` | Amount the caller of the contract commits to it |
| [options.callData] | `string` | ABI encoded compiled AEVM call data for the code |
| [options.contract] | `number` | Address of the contract to call |
| [options.abiVersion] | `number` | Version of the ABI |

**Example**  
```js
channel.callContractStatic({
  contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
  callData: 'cb_1111111111111111...',
  amount: 0,
  abiVersion: 1
}).then(({ returnValue, gasUsed }) => {
  console.log('Returned value:', returnValue)
  console.log('Gas used:', gasUsed)
})
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..getContractCall"></a>

#### Channel~getContractCall(options) ⇒ `Promise.&lt;object&gt;`
Get contract call result

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| options | `object` |  |
| [options.caller] | `string` | Address of contract caller |
| [options.contract] | `string` | Address of the contract |
| [options.round] | `number` | Round when contract was called |

**Example**  
```js
channel.getContractCall({
  caller: 'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
  contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
  round: 3
}).then(({ returnType, returnValue }) => {
  if (returnType === 'ok') console.log(returnValue)
})
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..getContractState"></a>

#### Channel~getContractState(contract) ⇒ `Promise.&lt;object&gt;`
Get contract latest state

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| contract | `string` | Address of the contract |

**Example**  
```js
channel.getContractState(
  'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
).then(({ contract }) => {
  console.log('deposit:', contract.deposit)
})
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..cleanContractCalls"></a>

#### Channel~cleanContractCalls() ⇒ `Promise`
Clean up all locally stored contract calls

Contract calls are kept locally in order for the participant to be able to look them up.
They consume memory and in order for the participant to free it - one can prune all messages.
This cleans up all locally stored contract calls and those will no longer be available for
fetching and inspection.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..sendMessage"></a>

#### Channel~sendMessage(message, recipient)
Send generic message

If message is an object it will be serialized into JSON string
before sending.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| message | `string` \| `object` |  |
| recipient | `string` | Address of the recipient |

**Example**  
```js
channel.sendMessage(
  'hello world',
  'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH'
)
```
