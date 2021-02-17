# Contract Events

Here are code examples of decoding [Sophia Events](https://github.com/aeternity/aesophia/blob/lima/docs/sophia.md#events)
using SDK.

## SDK initialisation
```js
import { Universal, Node, MemoryAccount } from '@aeternity/aepp-sdk/es'
const eventContract = `SOURCE_HERE`
const node = await Node({ ... })
const account = MemoryAccount({ keypair })
const initParams = { accounts: [account], nodes: [{ name: 'test', instance: node }] }

const sdkInstance = await Universal({ ...initParams })

const contractIns = await sdkInstance.getContractInstance(eventContract)
```

## Decode using ACI
```js
// Auto decode of events on contract call
const callRes = await contractIns.methods.emitEvents()
// decode of events using contract instance
const decodedUsingInstance = contractIns.decodeEvents('emitEvents', callRes.result.log)
// decode of events using contract instance ACI methods
const decodedUsingInstanceMethods = contractIns.methods.emitEvents.decodeEvents(callRes.result.log)
// callRes.decodedEvents === decodedUsingInstance === decodedUsingInstanceMethods
console.log(callRes.decodedEvents || decodedUsingInstance || decodedUsingInstanceMethods)
/*
[
  { address: 'ct_N9s65ZMz9SUUKx2HDLCtxVNpEYrzzmYEuESdJwmbEsAo5TzxM',
    data: 'cb_VGhpcyBpcyBub3QgaW5kZXhlZK+w140=',
    topics:
     [ '101640830366340000167918459210098337687948756568954742276612796897811614700269',
       '21724616073664889730503604151713289093967432540957029082538744539361158114576' ],
    name: 'AnotherEvent',
    decoded:
     [ 'This is not indexed',
       'N9s65ZMz9SUUKx2HDLCtxVNpEYrzzmYEuESdJwmbEsAo5TzxM' ]
  },
  { address: 'ct_N9s65ZMz9SUUKx2HDLCtxVNpEYrzzmYEuESdJwmbEsAo5TzxM',
    data: 'cb_Xfbg4g==',
    topics:
     [ '25381774165057387707802602748622431964055296361151037811644748771109370239835',
       42 ],
    name: 'TheFirstEvent',
    decoded: [ '42' ]
  }
]
*/
```

## Decode without ACI
```js
import { decodeEvents, SOPHIA_TYPES } from '@aeternity/aepp-sdk/es/contract/aci/transformation'

const txHash = 'tx_asdad2d23...'
const tx = await sdkInstance.tx(txHash)

const eventsSchema = [
  { name: 'TheFirstEvent', types: [SOPHIA_TYPES.int] },
  { name: 'AnotherEvent', types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address] },
]
const decodedEvents = decodeEvents(tx.log, { schema: eventsSchema })
console.log(decodedEvents)
/*
[
  { address: 'ct_N9s65ZMz9SUUKx2HDLCtxVNpEYrzzmYEuESdJwmbEsAo5TzxM',
    data: 'cb_VGhpcyBpcyBub3QgaW5kZXhlZK+w140=',
    topics:
     [ '101640830366340000167918459210098337687948756568954742276612796897811614700269',
       '21724616073664889730503604151713289093967432540957029082538744539361158114576' ],
    name: 'AnotherEvent',
    decoded:
     [ 'This is not indexed',
       'N9s65ZMz9SUUKx2HDLCtxVNpEYrzzmYEuESdJwmbEsAo5TzxM' ]
  },
  { address: 'ct_N9s65ZMz9SUUKx2HDLCtxVNpEYrzzmYEuESdJwmbEsAo5TzxM',
    data: 'cb_Xfbg4g==',
    topics:
     [ '25381774165057387707802602748622431964055296361151037811644748771109370239835',
       42 ],
    name: 'TheFirstEvent',
    decoded: [ '42' ]
  }
]
*/
```

# Related Link
  - [Sophia Events](https://github.com/aeternity/aesophia/blob/lima/docs/sophia.md#events)
  - [Sophia Events Explained](https://github.com/aeternity/protocol/blob/master/contracts/events.md)
