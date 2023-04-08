# Contract Events

The Sophia language also provides you the possibility to emit [Events](https://docs.aeternity.com/aesophia/latest/sophia_features/#events) in your functions.
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

## Decode events using ACI
When initializing a contract instance using the source code and providing the [ACI](https://docs.aeternity.com/aesophia/latest/aeso_aci/)
or obtaining it via http compiler (default) you will be able to access the `emitEvents` entrypoint of the Sophia contract above as follows:

```js
// events emitted by contract calls are automatically decoded
const tx = await contract.emitEvents(1337, "this message is not indexed")
console.log(tx.decodedEvents)

/*
[
  {
    name: 'AnotherEvent',
    args: [
      'fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
      'this message is not indexed'
    ],
    contract: {
      name: 'EventEmitter',
      address: 'ct_6y3N9KqQb74QsvR9NrESyhWeLNiA9aJgJ7ua8CvsTuGot6uzh'
    }
  },
  {
    name: 'FirstEvent',
    args: [1337n],
    contract: {
      name: 'EventEmitter',
      address: 'ct_6y3N9KqQb74QsvR9NrESyhWeLNiA9aJgJ7ua8CvsTuGot6uzh'
    }
  }
]
*/
```

Note:

- As you can see the event log will be automatically decoded in case you perform a `ContractCallTx` directly

Of course it is also possible to decode the event log if you request the transaction details from the node for a transaction that has been mined already. You can request the transaction details by providing the tx-hash and then decode the event log using the `contract` as follows:
```js
const txHash = 'th_2YV3AmAz2kXdTnQxXtR2uxQi3KuLS9wfvXyqKkQQ2Y6dE6RnET';
// aeSdk is an instance of the AeSdk class
const txInfo = await aeSdk.api.getTransactionInfoByHash(txHash)

// decode events using contract instance
const decodedUsingContract = contract.$decodeEvents(txInfo.callInfo.log)
console.log(decodedUsingContract)

/*
[
  {
    name: 'AnotherEvent',
    args: [
      'fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
      'this message is not indexed'
    ],
    contract: {
      name: 'EventEmitter',
      address: 'ct_fKhQBiNQkDfoZcVF1ZzPzY7Lig6FnHDCLyFYBY33ZjfzGYPps'
    }
  },
  {
    name: 'FirstEvent',
    args: [1337n],
    contract: {
      name: 'EventEmitter',
      address: 'ct_fKhQBiNQkDfoZcVF1ZzPzY7Lig6FnHDCLyFYBY33ZjfzGYPps'
    }
  }
]
*/
```
