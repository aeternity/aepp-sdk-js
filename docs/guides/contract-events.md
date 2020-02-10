# Contract Events

This guide describes the usage of [Sophia Events]() using [Aeternity JS SDK](https://github.com/aeternity/aepp-sdk-js)
 
## Smart Contract
```
contract EventExample =
  type event = Event(int, string) | Event2(bool, int) 

  stateful entrypoint emitEvents () =>
    Chain.emit(Event(10, "Test string"))
    Chain.emit(Event2(true, 23))
```
## SDK usage
  - Init SDK
    ```js
    import { Universal, Node, MemoryAccount } from '@aeternity/aepp-sdk/es'
    const eventContract = `SOURCE_HERE`
    const node = await Node({ ... })
    const account = MemoryAccount({ keypair })
    const initParams = { accounts: [account], nodes: [{ name: 'test', instance: node }] }
    
    const sdkInstance = await Universal({ ...initParams })
    
    const contractIns = await sdkInstance.getContractInstance(eventContract)
    ```
  - Call smart contract
    ```js
    const callRes = await contractIns.methods.emitEvents()
    
    ```
