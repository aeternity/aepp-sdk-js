<a id="module_@aeternity/aepp-sdk/es/channel/epoch"></a>

## @aeternity/aepp-sdk/es/channel/epoch
EpochChannel module

**Export**: EpochChannel  
**Example**  
```js
import EpochChannel from '@aeternity/aepp-sdk/es/channel/epoch'
```

* [@aeternity/aepp-sdk/es/channel/epoch](#module_@aeternity/aepp-sdk/es/channel/epoch)
    * [EpochChannel([options])](#exp_module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel) ⇒ `Object` ⏏
        * [~on(event, callback)](#module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel..on)
        * [~status()](#module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel..status) ⇒ `string`
        * [~state()](#module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel..state) ⇒ `object`
        * [~update(from, to, amount, sign)](#module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel..update) ⇒ `Promise`
        * [~shutdown()](#module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel..shutdown)

<a id="exp_module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel"></a>

### EpochChannel([options]) ⇒ `Object` ⏏
Epoch Channel

**Kind**: Exported function  
**Returns**: `Object` - Channel instance  
**rtype**: `Channel`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| options.url | `String` |  | Channel url (for example: "ws://localhost:3001/channel") |
| options.role | `String` |  | Participant role ("initiator" or "responder") |
| options.initiator | `String` |  | Initiator's public key |
| options.responder | `String` |  | Responder's public key |
| options.pushAmount | `Number` |  | Initial deposit in favour of the responder by the initiator |
| options.initiatorAmount | `Number` |  | Amount of tokens the initiator has committed to the channel |
| options.responderAmount | `Number` |  | Amount of tokens the responder has committed to the channel |
| options.channelReserve | `Number` |  | The minimum amount both peers need to maintain |
| [options.ttl] | `Number` |  | Minimum block height to include the channel_create_tx |
| options.host | `String` |  | Host of the responder's node |
| options.port | `Number` |  | The port of the responders node |
| options.lockPeriod | `Number` |  | Amount of blocks for disputing a solo close |
| options.sign | `function` |  | Function which verifies and signs transactions |

**Example**  
```js
EpochChannel({
  url: 'ws://localhost:3001',
  role: 'initiator'
  initiator: 'ak$2QC98ahNHSrZLWKrpQyv91eQfCDA3aFVSNoYKdQ1ViYWVF8Z9d',
  responder: 'ak$Gi42jcRm9DcZjk72UWQQBSxi43BG3285C9n4QSvP5JdzDyH2o',
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
<a id="module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel..on"></a>

#### EpochChannel~on(event, callback)
Register event listener function

**Kind**: inner method of [`EpochChannel`](#exp_module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel)  

| Param | Type | Description |
| --- | --- | --- |
| event | `string` | Event name |
| callback | `function` | Callback function |

<a id="module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel..status"></a>

#### EpochChannel~status() ⇒ `string`
Get current status

**Kind**: inner method of [`EpochChannel`](#exp_module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel)  
<a id="module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel..state"></a>

#### EpochChannel~state() ⇒ `object`
Get current state

**Kind**: inner method of [`EpochChannel`](#exp_module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel)  
<a id="module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel..update"></a>

#### EpochChannel~update(from, to, amount, sign) ⇒ `Promise`
Trigger an update

Returned promise resolves to an object containing `accepted` and `state`
properties.

**Kind**: inner method of [`EpochChannel`](#exp_module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel)  

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
)
```
<a id="module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel..shutdown"></a>

#### EpochChannel~shutdown()
Trigger a channel shutdown

**Kind**: inner method of [`EpochChannel`](#exp_module_@aeternity/aepp-sdk/es/channel/epoch--EpochChannel)  
