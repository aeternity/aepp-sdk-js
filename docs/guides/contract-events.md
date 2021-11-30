# Contract Events

The Sophia language also provides you the possibility to emit [Events](https://aeternity.com/aesophia/latest/sophia_features/#events) in your functions.
On this page you will learn how to access and decode the event log of a specific transaction.

## EventEmitter contract
This example contract that emits events will be used in the following examples:

```sophia
contract EventEmitter =

    datatype event =
        FirstEvent(int)
        | AnotherEvent(indexed address, string)

    entrypoint emitEvents(value: int, msg: string) =
        Chain.event(FirstEvent(value))
        Chain.event(AnotherEvent(Call.caller, msg))
```

## Decode events using ACI (high-level, recommended)
When initializing a contract instance using the source code and providing the [ACI](https://aeternity.com/aesophia/latest/aeso_aci/)
or obtaining it via http compiler (default) you will be able to access the `emitEvents` entrypoint of the Sophia contract above as follows:

```js
// events emitted by contract calls are automatically decoded
const tx = await contractInstance.methods.emitEvents(1337, "this message is not indexed")
console.log(tx.decodedEvents)

/*
[
  {
    address: 'ct_6y3N9KqQb74QsvR9NrESyhWeLNiA9aJgJ7ua8CvsTuGot6uzh',
    data: 'cb_dGhpcyBtZXNzYWdlIGlzIG5vdCBpbmRleGVkdWmUpw==',
    topics: [
      '101640830366340000167918459210098337687948756568954742276612796897811614700269',
      '39519965516565108473327470053407124751867067078530473195651550649472681599133'
    ],
    name: 'AnotherEvent',
    decoded: [
      'fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
      'this message is not indexed'
    ]
  },
  {
    address: 'ct_6y3N9KqQb74QsvR9NrESyhWeLNiA9aJgJ7ua8CvsTuGot6uzh',
    data: 'cb_Xfbg4g==',
    topics: [
      '59505622142252318624300825714684802559980671551955787864303522023309554554980',
      1337
    ],
    name: 'FirstEvent',
    decoded: [ '1337' ]
  }
]
*/
```

Note:

- As you can see the event log will be automatically decoded in case you perform a `ContractCallTx` directly

Of course it is also possible to decode the event log if you request the transaction details from the node for a transaction that has been mined already. You can request the transaction details by providing the tx-hash and then decode the event log using the `contractInstance` as follows:
```js
const txHash = 'th_2YV3AmAz2kXdTnQxXtR2uxQi3KuLS9wfvXyqKkQQ2Y6dE6RnET';
// client is an instance of the Universal Stamp
const tx = await client.tx(txHash)

// decode events using contract instance
const decodedUsingInstance = contractInstance.decodeEvents(tx.log)

// OR decode of events using contract instance ACI methods
const decodedUsingInstanceMethods = contractInstance.methods.emitEvents.decodeEvents(tx.log)
console.log(decodedUsingInstanceMethods || decodedUsingInstance)

/*
[
  {
    address: 'ct_fKhQBiNQkDfoZcVF1ZzPzY7Lig6FnHDCLyFYBY33ZjfzGYPps',
    data: 'cb_dGhpcyBtZXNzYWdlIGlzIG5vdCBpbmRleGVkdWmUpw==',
    topics: [
      '101640830366340000167918459210098337687948756568954742276612796897811614700269',
      '39519965516565108473327470053407124751867067078530473195651550649472681599133'
    ],
    name: 'AnotherEvent',
    decoded: [
      'fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
      'this message is not indexed'
    ]
  },
  {
    address: 'ct_fKhQBiNQkDfoZcVF1ZzPzY7Lig6FnHDCLyFYBY33ZjfzGYPps',
    data: 'cb_Xfbg4g==',
    topics: [
      '59505622142252318624300825714684802559980671551955787864303522023309554554980',
      1337
    ],
    name: 'FirstEvent',
    decoded: [ '1337' ]
  }
]
*/
```

## Decode events without ACI (low-level)
As an alternative you can make use of the low-level API which allows you to decode events for a given transaction by providing the `log` of the transaction as well as the correct `schema` of the events to the `decodeEvents` function manually:

```js
import { decodeEvents, SOPHIA_TYPES } from '@aeternity/aepp-sdk/es/contract/aci/transformation'

const txHash = 'th_2tMWziKAQR1CwK2PMfvMhKZgEVLmcxsPYkRXey97s9SdXj4zat'
// client is an instance of the Universal Stamp
const tx = await client.tx(txHash)

const eventsSchema = [
  { name: 'FirstEvent', types: [SOPHIA_TYPES.int] },
  { name: 'AnotherEvent', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.string] },
]

const decodedEvents = decodeEvents(tx.log, eventsSchema)
console.log(decodedEvents)
/*
[
  {
    address: 'ct_2dE7Xd7XCg3cwpKWP18VPDwfhz5Miji9FoKMTZN7TYvGt64Kc',
    data: 'cb_dGhpcyBtZXNzYWdlIGlzIG5vdCBpbmRleGVkdWmUpw==',
    topics: [
      '101640830366340000167918459210098337687948756568954742276612796897811614700269',
      '39519965516565108473327470053407124751867067078530473195651550649472681599133'
    ],
    name: 'AnotherEvent',
    decoded: [
      'fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
      'this message is not indexed'
    ]
  },
  {
    address: 'ct_2dE7Xd7XCg3cwpKWP18VPDwfhz5Miji9FoKMTZN7TYvGt64Kc',
    data: 'cb_Xfbg4g==',
    topics: [
      '59505622142252318624300825714684802559980671551955787864303522023309554554980',
      1337
    ],
    decoded: []
  }
]
*/
```
