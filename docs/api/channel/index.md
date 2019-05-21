<a id="module_@aeternity/aepp-sdk/es/channel/index"></a>

## @aeternity/aepp-sdk/es/channel/index
Channel module

**Example**  
```js
import Channel from '@aeternity/aepp-sdk/es/channel/index'
```

* [@aeternity/aepp-sdk/es/channel/index](#module_@aeternity/aepp-sdk/es/channel/index)
    * [Channel(options)](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [~on(event, callback)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..on)
        * [~disconnect()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..disconnect)
        * [~status()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..status) ⇒ `String`
        * [~state()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..state) ⇒ `Promise.&lt;Object&gt;`
        * [~id()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..id) ⇒ `String`
        * [~update(from, to, amount, sign)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..update) ⇒ `Promise.&lt;Object&gt;`
        * [~poi(addresses)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..poi) ⇒ `Promise.&lt;String&gt;`
        * [~balances(accounts)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..balances) ⇒ `Promise.&lt;Object&gt;`
        * [~leave()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..leave) ⇒ `Promise.&lt;Object&gt;`
        * [~shutdown(sign)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..shutdown) ⇒ `Promise.&lt;String&gt;`
        * [~withdraw(amount, sign, [callbacks])](#module_@aeternity/aepp-sdk/es/channel/index--Channel..withdraw) ⇒ `Promise.&lt;Object&gt;`
        * [~deposit(amount, sign, [callbacks])](#module_@aeternity/aepp-sdk/es/channel/index--Channel..deposit) ⇒ `Promise.&lt;Object&gt;`
        * [~createContract(options, sign)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..createContract) ⇒ `Promise.&lt;Object&gt;`
        * [~callContract(options, sign)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..callContract) ⇒ `Promise.&lt;Object&gt;`
        * [~callContractStatic(options)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..callContractStatic) ⇒ `Promise.&lt;Object&gt;`
        * [~getContractCall(options)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..getContractCall) ⇒ `Promise.&lt;Object&gt;`
        * [~getContractState(contract)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..getContractState) ⇒ `Promise.&lt;Object&gt;`
        * [~cleanContractCalls()](#module_@aeternity/aepp-sdk/es/channel/index--Channel..cleanContractCalls) ⇒ `Promise`
        * [~sendMessage(message, recipient)](#module_@aeternity/aepp-sdk/es/channel/index--Channel..sendMessage)

<a id="exp_module_@aeternity/aepp-sdk/es/channel/index--Channel"></a>

### Channel(options) ⇒ `Promise.&lt;Object&gt;` ⏏
Channel

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Channel instance  
**rtype**: `Channel`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | Channel params |
| options.url | `String` | Channel url (for example: "ws://localhost:3001") |
| options.role | `String` | Participant role ("initiator" or "responder") |
| options.initiatorId | `String` | Initiator's public key |
| options.responderId | `String` | Responder's public key |
| options.pushAmount | `Number` | Initial deposit in favour of the responder by the initiator |
| options.initiatorAmount | `Number` | Amount of tokens the initiator has committed to the channel |
| options.responderAmount | `Number` | Amount of tokens the responder has committed to the channel |
| options.channelReserve | `Number` | The minimum amount both peers need to maintain |
| [options.ttl] | `Number` | Minimum block height to include the channel_create_tx |
| options.host | `String` | Host of the responder's node |
| options.port | `Number` | The port of the responders node |
| options.lockPeriod | `Number` | Amount of blocks for disputing a solo close |
| [options.existingChannelId] | `Number` | Existing channel id (required if reestablishing a channel) |
| [options.offchainTx] | `Number` | Offchain transaction (required if reestablishing a channel) |
| [options.timeoutIdle] | `Number` | The time waiting for a new event to be initiated (default: 600000) |
| [options.timeoutFundingCreate] | `Number` | The time waiting for the initiator to produce the create channel transaction after the noise session had been established (default: 120000) |
| [options.timeoutFundingSign] | `Number` | The time frame the other client has to sign an off-chain update after our client had initiated and signed it. This applies only for double signed on-chain intended updates: channel create transaction, deposit, withdrawal and etc. (default: 120000) |
| [options.timeoutFundingLock] | `Number` | The time frame the other client has to confirm an on-chain transaction reaching maturity (passing minimum depth) after the local node has detected this. This applies only for double signed on-chain intended updates: channel create transaction, deposit, withdrawal and etc. (default: 360000) |
| [options.timeoutSign] | `Number` | The time frame the client has to return a signed off-chain update or to decline it. This applies for all off-chain updates (default: 500000) |
| [options.timeoutAccept] | `Number` | The time frame the other client has to react to an event. This applies for all off-chain updates that are not meant to land on-chain, as well as some special cases: opening a noise connection, mutual closing acknowledgement and reestablishing an existing channel (default: 120000) |
| [options.timeoutInitialized] | `Number` | the time frame the responder has to accept an incoming noise session. Applicable only for initiator (default: timeout_accept's value) |
| [options.timeoutAwaitingOpen] | `Number` | The time frame the initiator has to start an outgoing noise session to the responder's node. Applicable only for responder (default: timeout_idle's value) |
| options.sign | `function` | Function which verifies and signs transactions |

**Example**  
```js
Channel({
  url: 'ws://localhost:3001',
  role: 'initiator'
  initiatorId: 'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
  responderId: 'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E',
  initiatorAmount: 1e18,
  responderAmount: 1e18,
  pushAmount: 0,
  channelReserve: 0,
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

Possible events:

  - "error"
  - "onChainTx"
  - "ownWithdrawLocked"
  - "withdrawLocked"
  - "ownDepositLocked"
  - "depositLocked"

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| event | `String` | Event name |
| callback | `function` | Callback function |

<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..disconnect"></a>

#### Channel~disconnect()
Close the connection

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..status"></a>

#### Channel~status() ⇒ `String`
Get current status

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..state"></a>

#### Channel~state() ⇒ `Promise.&lt;Object&gt;`
Get current state

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..id"></a>

#### Channel~id() ⇒ `String`
Get channel id

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..update"></a>

#### Channel~update(from, to, amount, sign) ⇒ `Promise.&lt;Object&gt;`
Trigger a transfer update

The transfer update is moving tokens from one channel account to another.
The update is a change to be applied on top of the latest state.

Sender and receiver are the channel parties. Both the initiator and responder
can take those roles. Any public key outside of the channel is considered invalid.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| from | `String` | Sender's public address |
| to | `String` | Receiver's public address |
| amount | `Number` | Transaction amount |
| sign | `function` | Function which verifies and signs offchain transaction |

**Example**  
```js
channel.update(
  'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
  'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E',
  10,
  async (tx) => await account.signTransaction(tx)
).then(({ accepted, signedTx }) =>
  if (accepted) {
    console.log('Update has been accepted')
  }
)
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..poi"></a>

#### Channel~poi(addresses) ⇒ `Promise.&lt;String&gt;`
Get proof of inclusion

If a certain address of an account or a contract is not found
in the state tree - the response is an error.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| addresses | `Object` |  |
| [addresses.accounts] | `Array.&lt;String&gt;` | List of account addresses to include in poi |
| [addresses.contracts] | `Array.&lt;String&gt;` | List of contract addresses to include in poi |

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

#### Channel~balances(accounts) ⇒ `Promise.&lt;Object&gt;`
Get balances

The accounts paramcontains a list of addresses to fetch balances of.
Those can be either account balances or a contract ones, encoded as an account addresses.

If a certain account address had not being found in the state tree - it is simply
skipped in the response.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| accounts | `Array.&lt;String&gt;` | List of addresses to fetch balances from |

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

#### Channel~leave() ⇒ `Promise.&lt;Object&gt;`
Leave channel

It is possible to leave a channel and then later reestablish the channel
off-chain state and continue operation. When a leave method is called,
the channel fsm passes it on to the peer fsm, reports the current mutually
signed state and then terminates.

The channel can be reestablished by instantiating another Channel instance
with two extra params: existingChannelId and offchainTx (returned from leave
method as channelId and signedTx respectively).

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  
**Example**  
```js
channel.leave().then(({ channelId, signedTx }) => {
  console.log(channelId)
  console.log(signedTx)
})
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..shutdown"></a>

#### Channel~shutdown(sign) ⇒ `Promise.&lt;String&gt;`
Trigger mutual close

At any moment after the channel is opened, a closing procedure can be triggered.
This can be done by either of the parties. The process is similar to the off-chain updates.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| sign | `function` | Function which verifies and signs mutual close transaction |

**Example**  
```js
channel.shutdown(
  async (tx) => await account.signTransaction(tx)
).then(tx => console.log('on_chain_tx', tx))
```
<a id="module_@aeternity/aepp-sdk/es/channel/index--Channel..withdraw"></a>

#### Channel~withdraw(amount, sign, [callbacks]) ⇒ `Promise.&lt;Object&gt;`
Withdraw tokens from the channel

After the channel had been opened any of the participants can initiate a withdrawal.
The process closely resembles the update. The most notable difference is that the
transaction has been co-signed: it is channel_withdraw_tx and after the procedure
is finished - it is being posted on-chain.

Any of the participants can initiate a withdrawal. The only requirements are:

  - Channel is already opened
  - No off-chain update/deposit/withdrawal is currently being performed
  - Channel is not being closed or in a solo closing state
  - The withdrawal amount must be equal to or greater than zero, and cannot exceed
    the available balance on the channel (minus the channel_reserve)

After the other party had signed the withdraw transaction, the transaction is posted
on-chain and onOnChainTx callback is called with on-chain transaction as first argument.
After computing transaction hash it can be tracked on the chain: entering the mempool,
block inclusion and a number of confirmations.

After the minimum_depth block confirmations onOwnWithdrawLocked callback is called
(without any arguments).

When the other party had confirmed that the block height needed is reached
onWithdrawLocked callback is called (without any arguments).

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| amount | `Number` | Amount of tokens to withdraw |
| sign | `function` | Function which verifies and signs withdraw transaction |
| [callbacks] | `Object` |  |
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

#### Channel~deposit(amount, sign, [callbacks]) ⇒ `Promise.&lt;Object&gt;`
Deposit tokens into the channel

After the channel had been opened any of the participants can initiate a deposit.
The process closely resembles the update. The most notable difference is that the
transaction has been co-signed: it is channel_deposit_tx and after the procedure
is finished - it is being posted on-chain.

Any of the participants can initiate a deposit. The only requirements are:

  - Channel is already opened
  - No off-chain update/deposit/withdrawal is currently being performed
  - Channel is not being closed or in a solo closing state
  - The deposit amount must be equal to or greater than zero, and cannot exceed
    the available balance on the channel (minus the channel_reserve)

After the other party had signed the deposit transaction, the transaction is posted
on-chain and onOnChainTx callback is called with on-chain transaction as first argument.
After computing transaction hash it can be tracked on the chain: entering the mempool,
block inclusion and a number of confirmations.

After the minimum_depth block confirmations onOwnDepositLocked callback is called
(without any arguments).

When the other party had confirmed that the block height needed is reached
onDepositLocked callback is called (without any arguments).

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| amount | `Number` | Amount of tokens to deposit |
| sign | `function` | Function which verifies and signs deposit transaction |
| [callbacks] | `Object` |  |
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

#### Channel~createContract(options, sign) ⇒ `Promise.&lt;Object&gt;`
Trigger create contract update

The create contract update is creating a contract inside the channel's internal state tree.
The update is a change to be applied on top of the latest state.

That would create a contract with the poster being the owner of it. Poster commits initially
a deposit amount of tokens to the new contract.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` |  |
| options.code | `String` | Api encoded compiled AEVM byte code |
| options.callData | `String` | Api encoded compiled AEVM call data for the code |
| options.deposit | `Number` | Initial amount the owner of the contract commits to it |
| options.vmVersion | `Number` | Version of the AEVM |
| options.abiVersion | `Number` | Version of the ABI |
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

#### Channel~callContract(options, sign) ⇒ `Promise.&lt;Object&gt;`
Trigger call a contract update

The call contract update is calling a preexisting contract inside the channel's
internal state tree. The update is a change to be applied on top of the latest state.

That would call a contract with the poster being the caller of it. Poster commits
an amount of tokens to the contract.

The call would also create a call object inside the channel state tree. It contains
the result of the contract call.

It is worth mentioning that the gas is not consumed, because this is an off-chain
contract call. It would be consumed if it were a on-chain one. This could happen
if a call with a similar computation amount is to be forced on-chain.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` |  |
| [options.amount] | `String` | Amount the caller of the contract commits to it |
| [options.callData] | `String` | ABI encoded compiled AEVM call data for the code |
| [options.contract] | `Number` | Address of the contract to call |
| [options.abiVersion] | `Number` | Version of the ABI |
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

#### Channel~callContractStatic(options) ⇒ `Promise.&lt;Object&gt;`
Call contract using dry-run

In order to get the result of a potential contract call, one might need to
dry-run a contract call. It takes the exact same arguments as a call would
and returns the call object.

The call is executed in the channel's state but it does not impact the state
whatsoever. It uses as an environment the latest channel's state and the current
top of the blockchain as seen by the node.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` |  |
| [options.amount] | `String` | Amount the caller of the contract commits to it |
| [options.callData] | `String` | ABI encoded compiled AEVM call data for the code |
| [options.contract] | `Number` | Address of the contract to call |
| [options.abiVersion] | `Number` | Version of the ABI |

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

#### Channel~getContractCall(options) ⇒ `Promise.&lt;Object&gt;`
Get contract call result

The combination of a caller, contract and a round of execution determines the
contract call. Providing an incorrect set of those results in an error response.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` |  |
| [options.caller] | `String` | Address of contract caller |
| [options.contract] | `String` | Address of the contract |
| [options.round] | `Number` | Round when contract was called |

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

#### Channel~getContractState(contract) ⇒ `Promise.&lt;Object&gt;`
Get contract latest state

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| contract | `String` | Address of the contract |

**Example**  
```js
channel.getContractState(
  'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa'
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

If there is ongoing update that has not yet been finished the message
will be sent after that update is finalized.

**Kind**: inner method of [`Channel`](#exp_module_@aeternity/aepp-sdk/es/channel/index--Channel)  

| Param | Type | Description |
| --- | --- | --- |
| message | `String` \| `Object` |  |
| recipient | `String` | Address of the recipient |

**Example**  
```js
channel.sendMessage(
  'hello world',
  'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH'
)
```
