import { Buffer } from 'buffer';
import { useState } from 'preact/hooks';
import {
  isAddressValid,
  Encoding,
  Encoded,
  decode,
  encode,
  MemoryAccount,
} from '@aeternity/aepp-sdk';

function parseSecretKey(secretKey: string): Encoded.AccountSecretKey | undefined {
  if (isAddressValid(secretKey, Encoding.AccountSecretKey)) return secretKey;
  const buffer = Buffer.from(secretKey, 'hex');
  if (buffer.length === 64) return encode(buffer.subarray(0, 32), Encoding.AccountSecretKey);
}

export function ConvertSk() {
  const [secretKeyRaw, setSecretKey] = useState('');

  const secretKey = parseSecretKey(secretKeyRaw);
  let address;
  let secretKeyOtherFormat;
  let secretKeyOtherValue;
  if (secretKey) {
    address = new MemoryAccount(secretKey).address;
    [secretKeyOtherFormat, secretKeyOtherValue] = isAddressValid(
      secretKeyRaw,
      Encoding.AccountSecretKey,
    )
      ? ['Secret key in hex', Buffer.concat([decode(secretKey), decode(address)]).toString('hex')]
      : ['sk_-prefixed secret key', secretKey];
  }

  return (
    <>
      <h2>Convert between hex secret key and sk_-prefixed</h2>
      <div class="group">
        <div>Secret key in any format</div>
        <input
          placeholder="9ebd7beda... or sk_2Cuofq..."
          value={secretKeyRaw}
          onInput={(event) => setSecretKey(event.currentTarget.value)}
        />

        <div>Address</div>
        <div class={address ? '' : 'error'}>{address || "Can't parse secret key"}</div>

        <div></div>
        <button onClick={() => setSecretKey(MemoryAccount.generate().secretKey)}>
          Generate account
        </button>

        {secretKeyOtherFormat && (
          <>
            <div>{secretKeyOtherFormat}</div>
            <div>{secretKeyOtherValue}</div>
          </>
        )}
      </div>
    </>
  );
}
