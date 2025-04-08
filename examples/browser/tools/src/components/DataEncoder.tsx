import { Buffer } from 'buffer';
import { useState } from 'preact/hooks';
import { decode, encode, Encoded, Encoding } from '@aeternity/aepp-sdk';

export function DataEncoder() {
  const [input, setInput] = useState('');
  const [encoding, setEncoding] = useState(Encoding.AccountAddress);
  const [error, setError] = useState('');

  const isInputEncoded = input[2] === '_';
  let output;
  try {
    if (isInputEncoded) {
      output = decode(input as Encoded.Any).toString('hex');
      setEncoding(input.substring(0, 2) as Encoding);
    } else {
      output = encode(Buffer.from(input, 'hex'), encoding);
    }
    setError(input === '' ? 'No data' : '');
  } catch (error) {
    setError(String(error));
  }

  return (
    <>
      <h2>Encode or decode prefixed data</h2>
      <div class="group">
        <div>Input</div>
        <textarea
          placeholder="ak_dCT8Se... or deadbeef..."
          value={input}
          onInput={(event) => setInput(event.currentTarget.value)}
        />

        <div>Encoding</div>
        <select
          disabled={isInputEncoded || input === ''}
          value={encoding}
          onInput={(event) => setEncoding(event.currentTarget.value as Encoding)}
        >
          {Object.entries(Encoding).map(([key, value]) => (
            <option value={value}>
              {value} — {key}
            </option>
          ))}
        </select>

        {error ? (
          <>
            <div>Error</div>
            <div class="error">{error}</div>
          </>
        ) : (
          <>
            <div>Output</div>
            <div>{output}</div>
          </>
        )}
      </div>
    </>
  );
}
