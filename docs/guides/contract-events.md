# Contract Events

The Sophia language also provides you the possibility to emit [Events](https://github.com/aeternity/aesophia/blob/v6.0.0/docs/sophia.md#events) in your functions.
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
When initializing a contract instance using the source code and providing the [ACI](https://github.com/aeternity/aesophia/blob/v6.0.0/docs/aeso_aci.md)
or obtaining it via http compiler (default) you will be able to access the `emitEvents` entrypoint of the Sophia contract above as follows: 

```js
// events emitted by contract calls are automatically decoded (recommended)
const tx = await contractInstance.methods.emitEvents(1337, "this message is not indexed")
console.log(tx.decodedEvents)

// decode events using contract instance (no need to do that as you already have access to the decoded events)
const decodedUsingInstance = contractInstance.decodeEvents('emitEvents', tx.result.log)
console.log(decodedUsingInstance)

// decode of events using contract instance ACI methods (no need to do that as you already have access to the decoded events)
const decodedUsingInstanceMethods = contractInstance.methods.emitEvents.decodeEvents(tx.result.log)
console.log(decodedUsingInstanceMethods)

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

## Decode events without ACI (low-level)
As an alternative you can make use of the low-level API which allows you to decode events for a given transaction by providing the `log` of the transaction as well as the correct `schema` of the events to the `decodeEvents` function manually:

```js
import { decodeEvents, SOPHIA_TYPES } from '@aeternity/aepp-sdk/es/contract/aci/transformation'

// hash of a real tx on testnet
const txHash = 'th_2tMWziKAQR1CwK2PMfvMhKZgEVLmcxsPYkRXey97s9SdXj4zat'
// client is an instance of the Universal Stamp
const tx = await client.tx(txHash)

const eventsSchema = [
  { name: 'FirstEvent', types: [SOPHIA_TYPES.int] },
  { name: 'AnotherEvent', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.string] },
]

const decodedEvents = decodeEvents(tx.log, { schema: eventsSchema })
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
