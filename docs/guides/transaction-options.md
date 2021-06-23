# Transaction options
For every transaction it is possible to provide an `options` object with one or multiple of the following attributes.
Some of these are common and can be provided for each transaction type. Others are transaction specific and only relevant for a specific tx-type.

## Common options
These options are common and can be provided to every tx-type:

- `onAccount` (default: the first account defined in the account array of the SDK instance)
    - You can specify the account that should be used to sign a transaction.
    - Note:
        - The account needs to be provided to the SDK instance in order to be used for signing.
- `nonce` (default: current nonce of the account obtained via node API + 1)
    - The default behavior might cause problems if you perform many transactions in a short period of time.
    - You might want to implement your own nonce management and provide the nonce "manually".
- `ttl` (default: `0`)
    - Should be set if you want the transaction to be only valid until a certain block height is reached.
- `fee` (default: calculated for each tx-type)
    - The minimum fee is dependent on the tx-type.
    - You can provide a higher fee to additionally reward the miners.
- `gas` (default: `1600000 - 21000`)
    - Max. amount of gas to be consumed.
- `gasPrice` (default: `1e9`)
    - To increase chances to get your transaction included quickly you can use a higher gasPrice.
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
- `skipTransformDecoded` (default: `false`)
    - TODO, does this work? https://github.com/aeternity/aepp-sdk-js/issues/1228#issue-926690233
- `skipArgsConvert` (default: `false`)
    - TODO, what is this for? https://github.com/aeternity/aepp-sdk-js/issues/1228#issue-926690233

### OracleRegisterTx
- `queryFee` (default: `30000`)
    - The fee in `aettos` that the oracle requests in order to provide a response.
- `oracleTtl` (default: `{ type: 'delta', value: 500 }`)
    - The TTL of the oracle that defines its expiration.
    - Format: `{type: 'delta|block', value: 'number'}`

### OracleQueryTx
- `queryFee` (default: `30000`)
    - The fee in `aettos` that will be payed to the oracle.
- `queryTtl` (default: `{ type: 'delta', value: 10 }`)
    - The TTL of the query that defines its expiration. The oracle needs to respond before the `queryTtl` expires.
    - Format: `{type: 'delta|block', value: 'number'}`
- `responseTtl` (default `{ type: 'delta', value: 10 }`)
    - The TTL of the response that defines its expiration. The response of the oracle will be garbage collected after its expiration.
    - Format: `{type: 'delta|block', value: 'number'}`