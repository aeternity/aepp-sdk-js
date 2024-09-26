# Transaction options
For every transaction it is possible to provide an `options` object with one or multiple of the following attributes to the respective function that builds and broadcasts the transaction.
Some of these are common and can be provided for each transaction type. Others are transaction specific and only relevant for a specific tx-type.

The `options` object can be optionally passed to the respective function behind the last parameter, example:
```js
const sender = 'ak_...'
const recipient = 'ak_...'
const options = { onAccount: sender, denomination: 'ae' } // optional options object
// aeSdk is an instance of the AeSdk class
await aeSdk.spend(1, recipient, options) // amount, recipient and (optional) options
```

Note:

- Without the `options` object the sender would be some other account selected in the instance of AeSdk and the recipient would receive `1 aetto` instead of `1 AE`.

## Common options
These options are common and can be provided to every tx-type:

- `onAccount` (default: the first account defined in the account array of the SDK instance)
  - You can specify the account that should be used to sign a transaction.
  - Note:
    - The account needs to be provided to the SDK instance in order to be used for signing.
- `nonce` (default: obtain nonce of the account via node API)
  - The default behavior might cause problems if you perform many transactions in a short period of time.
  - You might want to implement your own nonce management and provide the nonce "manually".
  - 2 different strategies to use in order to determine the next nonce, See option `strategy` to learn more.
- `strategy` (default: `max`)
  - The strategy to obtain next nonce for an account via node API
  - If set to `max`, then the greatest nonce seen in the account or currently in the transaction pool is incremented with 1 and returned.
    If the strategy is set to `continuity`, then transactions in the mempool are checked if there are gaps - missing nonces that prevent transactions with greater nonces to get included
- `ttl` (default: `0` if `buildTx` used, current height + `3` otherwise)
  - Should be set if you want the transaction to be only valid until a certain block height is reached.
- `fee` (default: calculated for each tx-type, based on network demand)
  - The minimum fee is dependent on the tx-type.
  - You can provide a higher fee to additionally reward the miners.
- `innerTx` (default: `false`)
  - Should be used for signing an inner transaction that will be wrapped in a `PayingForTx`.
- `verify` (default: `false`)
  - If set to true the transaction will be verified prior to broadcasting it.
- `waitMined` (default: `true`)
  - Wait for transactions to be mined.
  - You can get the tx object that contains the tx-hash immediately by setting to `false` and should implement your own logic to watch for mined transactions.

## Tx-type specific options
The following options are sepcific for each tx-type.

### ContractCreateTx & ContractCallTx
- `amount` (default: `0`)
  - To be used for providing `aettos` (or `AE` with respective denomination) to a contract related transaction.
- `denomination` (default: `aettos`)
  - You can specify the denomination of the `amount` that will be provided to the contract related transaction.
- `gasLimit`
  - Maximum amount of gas to be consumed by the transaction. Learn more on [How to estimate gas?](#how-to-estimate-gas)
- `gasPrice` (default: based on network demand, minimum: `1e9`)
  - To increase chances to get your transaction included quickly you can use a higher gasPrice.

### NameClaimTx
- `nameFee` (default: calculated based on the length of the name)
  - The fee in `aettos` that will be payed to claim the name.
  - For bids in an auction you need to explicitely calculate the required `nameFee` based on the last bid

### NameUpdateTx
- `clientTtl` (default: `3600`, one hour)
  - This option is an indicator for indexing tools to know how long (in seconds) they could or should cache the name information.
- `nameTtl` (default: `180000`)
  - This option tells the protocol the relative TTL based on the current block height.
  - `180000` is the maximum possible value

### OracleRegisterTx
- `queryFee` (default: `0`)
  - The fee in `aettos` that the oracle requests in order to provide a response.
- `oracleTtlValue` (default: `500`)
  - The TTL of the oracle that defines its expiration.
- `oracleTtlType` (default: `ORACLE_TTL_TYPES.delta`)
  - `ORACLE_TTL_TYPES.delta`: TTL value treated relative to a current block height
  - `ORACLE_TTL_TYPES.block`: TTL value treated as absolute block height

### OracleQueryTx
- `queryFee` (default: `0`)
  - The fee in `aettos` that will be payed to the oracle.
- `queryTtlValue` (default: `10`)
  - The TTL of the query that defines its expiration. The oracle needs to respond before the `queryTtl` expires.
- `queryTtlType` (default: `ORACLE_TTL_TYPES.delta`)
  - `ORACLE_TTL_TYPES.delta`: TTL value treated relative to a current block height
  - `ORACLE_TTL_TYPES.block`: TTL value treated as absolute block height
- `responseTtlValue` (default `10`)
  - The TTL of the response that defines its expiration. The response of the oracle will be garbage collected after its expiration.
- `responseTtlType` (default `ORACLE_TTL_TYPES.delta`)
  - `ORACLE_TTL_TYPES.delta`: TTL value treated relative to a current block height
  - `ORACLE_TTL_TYPES.block`: TTL value treated as absolute block height

### SpendTx
- `denomination` (default: `aettos`)
  - You can specify the denomination of the `amount` that will be provided to the contract related transaction.

## How to estimate gas?
- As æpp developer, it is reasonable to estimate the gas consumption for a contract call using the dry-run feature of the node **once** and provide a specific offset (e.g. multiplied by 1.5 or 2) as default in the æpp to ensure that contract calls are mined. Depending on the logic of the contract the gas consumption of a specific contract call can vary and therefore you should monitor the gas consumption and increase the default for the respective contract call accordingly over time.
- By default, SDK estimates `gasLimit` using dry-run endpoint. This means an extra request that makes contract iterations slower, but it is more developer friendly (support of heavy requests without adjustments, and verbose error messages).
