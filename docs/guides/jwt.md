# JWT usage

## Generating JWT

Use `signJwt` to generate a JWT signed by an account provided in arguments.
```ts
import { MemoryAccount, signJwt } from '@aeternity/aepp-sdk';

const account = MemoryAccount.generate();
const payload = { test: 'data' };
const jwt = await signJwt(payload, account);
```

Provide `sub_jwk: undefined` in payload to omit signer public key added by default.
Do it to make JWT shorter.
```ts
const jwt = await signJwt({ test: 'data', sub_jwk: undefined }, account);
```

Or if you using a different way to encode a signer address.
```ts
const payload = {
  test: 'data',
  sub_jwk: undefined,
  address: 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
}
const jwt = await signJwt(payload, account);
```

## Verifying JWT

Let's assume we got a JWT as string. Firstly we need to ensure that it has the right format.
```ts
import { isJwt, ensureJwt } from '@aeternity/aepp-sdk';

if (!isJwt(jwt)) throw new Error('Invalid JWT');
// alternatively,
ensureJwt(jwt);
```

After that we can pass JWT to other SDK's methods, for example to get JWT payload and signer address
in case JWT has the signer public key included in `"sub_jwk"`.
```ts
import { unpackJwt } from '@aeternity/aepp-sdk';

const { payload, signer } = unpackJwt(jwt);
console.log(payload); // { test: 'data', sub_jwk: { ... } }
console.log(signer); // 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E'
```
`unpackJwt` will also check the JWT signature in this case.

Alternatively, if `"sub_jwk"` is not included then we can provide signer address to `unpackJwt`.
```ts
const knownSigner = 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E';
const { payload, signer } = unpackJwt(jwt, knownSigner);
console.log(payload); // { test: 'data' }
console.log(signer); // 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E'
```

If we need to a get signer address based on JWT payload then we need to unpack it without checking
the signature. Don't forget to check signature after that using `verifyJwt`.
```ts
import { verifyJwt } from '@aeternity/aepp-sdk';

const { payload, signer } = unpackJwt(jwt);
console.log(payload); // { address: 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E' }
console.log(signer); // undefined
if (!verifyJwt(jwt, payload.address)) throw new Error('JWT signature is invalid');
```
