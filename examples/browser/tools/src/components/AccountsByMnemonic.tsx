import { Buffer } from 'buffer'
import { useState } from 'preact/hooks'
import {
  generateSaveHDWalletFromSeed, getSaveHDWalletAccounts, encode, Encoding,
} from '@aeternity/aepp-sdk';
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export function AccountsByMnemonic() {
  const [mnemonic, setMnemonic] = useState('')
  const [count, setCount] = useState(1)

  let seed
  try {
    seed = mnemonicToSeedSync(mnemonic);
  } catch (error) {}
  let accounts
  let validation = 'invalid'
  if (seed) {
    const wallet = generateSaveHDWalletFromSeed(seed, '');
    accounts = getSaveHDWalletAccounts(wallet, '', count)
      // TODO: getSaveHDWalletAccounts should return encoded secret keys
      .map(({ publicKey, secretKey }) => ({
        publicKey,
        secretKey: encode(Buffer.from(secretKey, 'hex').subarray(0, 32), Encoding.AccountSecretKey),
      }));
    validation = (validateMnemonic(mnemonic, wordlist) ? '' : 'not ') + 'in english wordlist'
  }

  return (
    <>
      <h2>Generate accounts by mnemonic phrase</h2>
      <div class="group">
        <div>Mnemonic phrase</div>
        <input
          placeholder="cross cat upper state flame ..."
          value={mnemonic}
          onInput={(event) => setMnemonic(event.currentTarget.value)}
        />

        <div></div>
        <div class={accounts ? '' : 'error'}>Mnemonic {validation}</div>

        {accounts && accounts.map(({ publicKey, secretKey }, idx) => <>
          <div>Account #{idx}</div>
          <div>
            {publicKey}<br />
            {secretKey}
          </div>
        </>)}

        <button
          disabled={!accounts}
          onClick={() => setCount((count) => count + 1)}
        >
          Add account
        </button>
      </div>
    </>
  )
}
