import { useEffect, useState } from 'preact/hooks';
import { AccountMnemonicFactory, AccountMemory } from '@aeternity/aepp-sdk';
import { validateMnemonic, generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export function AccountsByMnemonic() {
  const [mnemonic, setMnemonic] = useState('');
  const [count, setCount] = useState(1);
  const [accounts, setAccounts] = useState<AccountMemory[]>([]);

  useEffect(() => {
    setAccounts([]);
    const factory = new AccountMnemonicFactory(mnemonic);
    (async () => {
      try {
        setAccounts(
          await Promise.all(new Array(count).fill(0).map((_, idx) => factory.initialize(idx))),
        );
      } catch (error) {}
    })();
  }, [mnemonic, count]);

  let validation = 'invalid';
  if (accounts.length) {
    validation = (validateMnemonic(mnemonic, wordlist) ? '' : 'not ') + 'in english wordlist';
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
        <div class={accounts.length ? '' : 'error'}>Mnemonic {validation}</div>

        <div></div>
        <div>
          <button disabled={!accounts.length} onClick={() => setCount((count) => count + 1)}>
            Add account
          </button>
          <button onClick={() => setMnemonic(generateMnemonic(wordlist))}>Generate mnemonic</button>
        </div>

        {accounts.map(({ address, secretKey }, idx) => (
          <>
            <div>Account #{idx}</div>
            <div>
              {address}
              <br />
              {secretKey}
            </div>
          </>
        ))}
      </div>
    </>
  );
}
