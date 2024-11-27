# Usage with TypeScript

This guide explains handling the edge cases that can occur while using aeternity SDK in a TypeScript project.

Firstly, ensure you've set up TypeScript according to the [installation guide].

[installation guide]: ../README.md#typescript-projects

## Extract types of methods exposed by SDK

SDK doesn't expose types separately to reduce the number of exports and simplify tracking of breaking changes. But you may need these types to prepare parameters or to hold the return value. In such cases, it is advised to use TypeScript-provided generics [`Parameters`] and [`ReturnType`]. For example,

```ts
import { walletDetector } from '@aeternity/aepp-sdk';

type WDCallback = Parameters<typeof walletDetector>[1];
type Wallet = Parameters<WDCallback>[0]['newWallet'];
let wallet: Wallet | null = null;

const stop = walletDetector(connection, ({ newWallet }) => {
  wallet = newWallet;
  stop();
});
```

The same for [`ReturnType`]:

```ts
import { unpackDelegation } from '@aeternity/aepp-sdk';

type DlgUnpacked = ReturnType<typeof unpackDelegation>;
let delegation: DlgUnpacked | null = null;

delegation = unpackDelegation(
  'ba_+EYDAaEBXXFtZp9YqbY4KdW8Nolf9Hjp0VZcNWnQOKjgCb8Br9mhBV1xbWafWKm2OCnVvDaJX/R46dFWXDVp0Dio4Am/Aa/Z2vgCEQ==',
);
```

[`Parameters`]: https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype
[`ReturnType`]: https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypetype

## Initialize parameters with specific types

You may need to define an object with parameters to call an sdk method. Obvious to try it as

```ts
import { packEntry, EntryTag } from '@aeternity/aepp-sdk';

const gaAuthData = {
  tag: EntryTag.GaMetaTxAuthData,
  fee: 766e11,
  txHash: 'th_2CKnN6EorvNiwwqRjSzXLrPLiHmcwo4Ny22dwCrSYRoD6MVGK1',
};

const gaAuthDataPacked = packEntry(gaAuthData);
```

The problem in this case, is that TypeScript will generalize the type of `unpackedEntry.txHash` to `string` instead of `th_${string}` making it incompatible with arguments of [`packEntry`]. To fix this you may define `gaAuthData`'s type explicitly, like:

```ts
import { Tag, Encoded } from '@aeternity/aepp-sdk';

interface GaAuthData {
  tag: Tag;
  fee: number;
  txHash: Encoded.TxHash;
}

const gaAuthData: GaAuthData = {
  tag: EntryTag.GaMetaTxAuthData,
  fee: 766e11,
  txHash: 'th_2CKnN6EorvNiwwqRjSzXLrPLiHmcwo4Ny22dwCrSYRoD6MVGK1',
};
```

Or to define `gaAuthData` as immutable:

```ts
const gaAuthData = {
  tag: EntryTag.GaMetaTxAuthData,
  fee: 766e11,
  txHash: 'th_2CKnN6EorvNiwwqRjSzXLrPLiHmcwo4Ny22dwCrSYRoD6MVGK1',
} as const;
```

In the last case, `txHash`'s type will be exactly `"th_2CKnN6EorvNiwwqRjSzXLrPLiHmcwo4Ny22dwCrSYRoD6MVGK1"`, making it compatible with [`packEntry`].

[`packEntry`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/functions/packEntry.html

## Narrow the union type returned by [`unpackTx`], [`unpackDelegation`], and [`unpackEntry`]

Some sdk methods return a [union] of multiple types. For example, [`unpackTx`] returns a union of [all supported transaction] fields. To work correctly you need to narrow this type to a specific transaction before accessing its fields. For example,

```ts
import { unpackTx, Tag } from '@aeternity/aepp-sdk';

const encodedTx =
  'tx_+F0MAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ChAeEyuPHdt6BOY7f6lkeaVLvFJaUxp/G8DOSSEhkDBn+wiBvBbWdOyAAAhg9e1n8oAAABhHRlc3QLK3OW';

const tx = unpackTx(encodedTx);

if (tx.tag !== Tag.SpendTx) {
  throw new Error(`Unknown transaction type: ${Tag[tx.tag]}`);
}

console.log(tx.amount);
```

Without checking the `tx.tag` TypeScript will fail with

> Property 'amount' does not exist on type 'TxUnpackedSignedTx1 & { tag: Tag; }'.

The above check is also implemented in [`unpackTx`] itself, instead of checking the `tx.tag` you can provide Tag in the second argument:

```ts
const tx = unpackTx(encodedTx, Tag.SpendTx);
```

But if you need to get SpendTx properties inside a SignedTx you still need to use the above `tag` check.

You may find that [`unpackTx`] is a generic function so that it can be executed as

```ts
const tx = unpackTx<Tag.SpendTx>(encodedTx);
```

The problem is that JavaScript won't check if the transaction is a SpendTx, so provide `Tag.SpendTx` as the second argument instead (as the above).

[union]: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types
[`unpackTx`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/functions/unpackTx.html
[`unpackDelegation`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/functions/unpackDelegation.html
[`unpackEntry`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/functions/unpackEntry.html
[all supported transaction]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/types/_internal_.TxUnpacked.html

## Functions to assert types of user-provided data

Let's assume we need to receive an address from the user to send some coins to it. The user enters an address in a text box, we can get it as a string. [`spend`] method accepts the address as [`Encoded.AccountAddress`], it won't accept a general string. We can overcome this restriction by adding a type assertion, like:

```ts
await aeSdk.spend(100, address as Encoded.AccountAddress);
```

The problem is that TypeScript won't check if `address` is an `ak_`-encoded string, and the [`spend`] method will fail in this case.
A more accurate solution would be to check the `address` in advance, providing user feedback if it is incorrect. For example:

```ts
import { isAddressValid } from '@aeternity/aepp-sdk';

if (!isAddressValid(address)) {
  alert('The address is not valid');
  return;
}

await aeSdk.spend(100, address);
```

Please note that this method doesn't require explicit casting `string` to [`Encoded.AccountAddress`] because [`isAddressValid`] implicitly marks `address` as `ak_${string}` in case it returns `true`.

Additionally, you can use [`isAddressValid`] to validate data against other address types:

```ts
import { Encoding } from '@aeternity/aepp-sdk';

isAddressValid(address, Encoding.ContractAddress, Encoding.OracleAddress);
```

Or encoding types in general:

```ts
isAddressValid(address, Encoding.Transaction);
```

[`spend`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/functions/spend.html
[`Encoded.AccountAddress`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/types/Encoded.AccountAddress.html
[`isAddressValid`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/functions/isAddressValid.html

### AENS name validation

The similar way [`isNameValid`] can be used

```ts
import { isNameValid } from '@aeternity/aepp-sdk';

console.log(isNameValid('name.chain')); // true
console.log(isNameValid('мир.chain')); // true
console.log(isNameValid('🙂.chain')); // false
```

If you don't need to handle invalid names specially then you can use [`ensureName`]:

```ts
import { ensureName, Name } from '@aeternity/aepp-sdk';

const nameAsString: string = readName();
ensureName(nameAsString);
const name = new Name(nameAsString, options);
```

Doing this way, [`ensureName`] will throw an exception if `nameAsString` is not a proper AENS name. TypeScript will handle `nameAsString` as `${string}.chain` in lines below [`ensureName`] invocation.

[`isNameValid`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/functions/isNameValid.html
[`ensureName`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/functions/ensureName.html

## Check types of contract methods

By default, it is allowed to call any method of the [`Contract`] instance. You can enable type-checking by providing a contract interface in a generic parameter of [`Contract`]. For example:

```ts
import { Contract } from '@aeternity/aepp-sdk';

const sourceCode = `
include "String.aes"

contract Test =
  entrypoint foo(x: int) = x

  entrypoint bar(x: map(string, int)) = x

  datatype name = FirstName(string) | LastName(string)
  entrypoint baz(n: name) =
    switch(n)
      FirstName(first) => String.length(first)
      LastName(_) => abort("Last name not supported yet")
`;

const contract = await Contract.initialize<{
  foo: (v: bigint) => bigint;
  bar: (x: Map<string, bigint>) => Map<string, bigint>;
  baz: (v: { FirstName: [string] } | { LastName: [string] }) => number;
}>({
  ...aeSdk.getContext(),
  sourceCode,
});

await contract.$deploy([]);

console.log((await contract.foo(21n)).decodedResult); // 42
console.log((await contract.bar(new Map([['test', 10n]]))).decodedResult); // Map(1) { 'test' => 10n }
console.log((await contract.baz({ FirstName: ['Nikita'] })).decodedResult); // 6
```

If you need to define the contract interface separately then extend [`ContractMethodsBase`]:

```ts
import { ContractMethodsBase } from '@aeternity/aepp-sdk';

interface FooContract extends ContractMethodsBase {
  foo: (v: bigint) => bigint;
  bar: (x: Map<string, bigint>) => Map<string, bigint>;
  baz: (v: { FirstName: [string] } | { LastName: [string] }) => number;
}

const contract = await Contract.initialize<FooContract>({
  ...aeSdk.getContext(),
  sourceCode,
});
```

It is theoretically possible to generate a contract interface by ACI. But unfortunately, it is [not supported] currently.

[not supported]: https://github.com/aeternity/aepp-calldata-js/issues/97
[`Contract`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/types/Contract.html
[`ContractMethodsBase`]: https://docs.aeternity.com/aepp-sdk-js/v14.0.0/api/interfaces/ContractMethodsBase.html
