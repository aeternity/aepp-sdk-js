import { Buffer } from 'buffer';
import { useState } from 'preact/hooks';
import { JSX } from 'preact/jsx-runtime';
import {
  unpackTx,
  rebuildUnpackedTx,
  buildTx,
  Tag,
  isEncoded,
  Encoding,
} from '@aeternity/aepp-sdk';

export function TransactionPacker() {
  const [packError, setPackError] = useState('');
  const [packWarning, setPackWarning] = useState('');
  const [unpackError, setUnpackError] = useState('');
  const [transaction, setTransaction] = useState('');

  let params: ReturnType<typeof unpackTx> | undefined;
  try {
    if (isEncoded(transaction, Encoding.Transaction)) {
      params = unpackTx(transaction);
      setUnpackError('');
    } else setUnpackError(transaction ? 'Invalid encoding' : 'No transaction');
  } catch (error) {
    setUnpackError(String(error));
  }

  function repackTx(path: Array<string | number>, value: unknown) {
    try {
      if (params == null) throw new Error('Transaction params not set');
      const newParams = structuredClone(params);
      path.reduce((pr: any, name, idx) => {
        if (idx < path.length - 1) return pr[name];
        pr[name] = value;
      }, newParams);
      // this transaction already exists, and may come from a network running other consensus
      // parameters than the ones of the SDK release — `buildTx` would price it as if it were new
      // and refuse a fee or a gas price below the minimum this build knows
      setTransaction(rebuildUnpackedTx(newParams));
      setPackError('');
      // the values are edited, so the checks are worth surfacing — as a notice, not a failure
      try {
        buildTx(newParams as Parameters<typeof buildTx>[0]);
        setPackWarning('');
      } catch (error) {
        setPackWarning(
          `${String(error)} — packed anyway, this is the minimum of the SDK release and the ` +
            'network this transaction belongs to may run another one',
        );
      }
    } catch (error) {
      setPackError(String(error));
      setPackWarning('');
    }
  }

  function addName(path: Array<string | number>, el: JSX.Element): JSX.Element {
    return (
      <>
        <div>
          {path.map((p, i) => (
            <>
              {i ? <span class="separator">.</span> : ''}
              {p}
            </>
          ))}
        </div>
        {el}
      </>
    );
  }

  function getEditor(path: Array<string | number>, value: unknown): JSX.Element {
    if (path.at(-1) === 'tag') {
      const tag = value as Tag;
      return addName(
        path,
        <div>
          {tag} ({Tag[tag]})
        </div>,
      );
    }
    if (path.at(-1) === 'version') return addName(path, <div>{String(value)}</div>);
    if (typeof value === 'number') {
      return addName(
        path,
        <input value={value} onInput={(ev) => repackTx(path, +ev.currentTarget.value)} />,
      );
    }
    if (typeof value === 'bigint') {
      return addName(
        path,
        <input
          value={value.toString()}
          onInput={(ev) => repackTx(path, BigInt(ev.currentTarget.value))}
        />,
      );
    }
    if (typeof value === 'string') {
      return addName(
        path,
        <input value={value} onInput={(ev) => repackTx(path, ev.currentTarget.value)} />,
      );
    }
    if (Array.isArray(value)) {
      return <>{value.map((el, idx) => getEditor([...path, idx], el))}</>;
    }
    if (value instanceof Uint8Array) {
      return addName(
        path,
        <input
          value={Buffer.from(value).toString('hex')}
          onInput={(ev) => repackTx(path, Buffer.from(ev.currentTarget.value, 'hex'))}
        />,
      );
    }
    if (value != null && typeof value === 'object') {
      return <>{Object.entries(value).map(([key, el]) => getEditor([...path, key], el))}</>;
    }
    return addName(path, <div>{String(value)}</div>);
  }

  return (
    <>
      <h2>Unpack transaction</h2>
      <div class="group">
        <div>Encoded transaction</div>
        <textarea
          placeholder="tx_8RkBoQ..."
          value={transaction}
          onInput={(event) => setTransaction(event.currentTarget.value)}
        />

        {params && Object.entries(params).map(([name, value]) => getEditor([name], value))}

        {packError && (
          <>
            <div>Pack error</div>
            <div class="error">{packError}</div>
          </>
        )}

        {packWarning && (
          <>
            <div>Pack warning</div>
            <div class="error">{packWarning}</div>
          </>
        )}

        {unpackError && (
          <>
            <div>Unpack error</div>
            <div class="error">{unpackError}</div>
          </>
        )}
      </div>
    </>
  );
}
