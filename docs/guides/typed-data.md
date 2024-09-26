# Typed data hashing and signing

## Common structure

The whole idea is heavily inspired by [EIP-712](https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator). To get a signature needed to calculate `hash(hash(domain), hash(aci), hash(data))`.

`hash` function is `blake2b`.

`domain` is a record containing not required properties:

- `name` as string,
- `version` as integer,
- `networkId` as string,
- `contractAddress` as ct-encoded string.

`aci` is part of a complete contract ACI. It defines a type of data to sign. For example, the ACI

```json
{
  "record": [
    { "name": "foo", "type": "string" },
    { "name": "bar", "type": "int" }
  ]
}
```

corresponds to the data

```json
{ "foo": "test", "bar": 42 }
```

`domain` and `data` are fate-encoded before hashing. `aci` is prepared for hashing according to [RFC8785](https://tools.ietf.org/html/rfc8785).

## Implementation

- [AccountBase:signTypedData](https://github.com/aeternity/aepp-sdk-js/blob/0b9ecee8/src/account/Base.ts#L66-L77) — calculates signature, supported in MemoryAccount and in aepp-wallet connection;
- [hashTypedData](https://github.com/aeternity/aepp-sdk-js/blob/0b9ecee8/src/utils/typed-data.ts#L61-L69) — calculates the overall hash of typed data to sign;
- [hashJson](https://github.com/aeternity/aepp-sdk-js/blob/0b9ecee8/src/utils/typed-data.ts#L10-L12) — deterministic hashing of an arbitrary JS value, used to calculate `hash(aci)`;
- [hashDomain](https://github.com/aeternity/aepp-sdk-js/blob/0b9ecee8/src/utils/typed-data.ts#L40-L59) — use for debugging or to prepare the hash value for smart contract.

## Examples

- [signing and verifying on aepp side](https://github.com/aeternity/aepp-sdk-js/blob/0b9ecee8/examples/browser/aepp/src/TypedData.vue)
- [signing confirmation on wallet side](https://github.com/aeternity/aepp-sdk-js/blob/0b9ecee8/examples/browser/wallet-iframe/src/App.vue#L177-L185)
- [verifying a signature on contract side](https://github.com/aeternity/aepp-sdk-js/blob/0b9ecee8/test/integration/typed-data.ts#L75-L105)
