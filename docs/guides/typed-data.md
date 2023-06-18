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

- [encodeFateValue](https://github.com/aeternity/aepp-sdk-js/blob/5952a7b9f4d0cf30ad7caa0831dfb974d1e91afc/src/utils/typed-data.ts#L44-L52) — use to generate the first argument for `signTypedData`;
- [AccountBase::signTypedData](https://github.com/aeternity/aepp-sdk-js/blob/5952a7b9f4d0cf30ad7caa0831dfb974d1e91afc/src/account/Base.ts#L63-L70) — calculates signature, supported in MemoryAccount and in aepp-wallet connection;
- [hashTypedData](https://github.com/aeternity/aepp-sdk-js/blob/5952a7b9f4d0cf30ad7caa0831dfb974d1e91afc/src/utils/typed-data.ts#L87-L95) — calculates the overall hash of typed data to sign;
- [decodeFateValue](https://github.com/aeternity/aepp-sdk-js/blob/5952a7b9f4d0cf30ad7caa0831dfb974d1e91afc/src/utils/typed-data.ts#L55-L63) — use to preview data to sign on wallet side;
- [hashJson](https://github.com/aeternity/aepp-sdk-js/blob/5952a7b9f4d0cf30ad7caa0831dfb974d1e91afc/src/utils/typed-data.ts#L16-L18) — deterministic hashing of an arbitrary JS value, used to calculate `hash(aci)`;
- [hashDomain](https://github.com/aeternity/aepp-sdk-js/blob/5952a7b9f4d0cf30ad7caa0831dfb974d1e91afc/src/utils/typed-data.ts#L68-L85) — use for debugging or to prepare the hash value for smart contract.

## Examples

- [signing and verifying on aepp side](https://github.com/aeternity/aepp-sdk-js/blob/5952a7b9f4d0cf30ad7caa0831dfb974d1e91afc/examples/browser/aepp/src/TypedData.vue)
- [signing confirmation on wallet side](https://github.com/aeternity/aepp-sdk-js/blob/5952a7b9f4d0cf30ad7caa0831dfb974d1e91afc/examples/browser/wallet-iframe/src/App.vue#L105-L111)
- [verifying a signature on contract side](https://github.com/aeternity/aepp-sdk-js/blob/5952a7b9f4d0cf30ad7caa0831dfb974d1e91afc/test/integration/typed-data.ts#L97-L128)
