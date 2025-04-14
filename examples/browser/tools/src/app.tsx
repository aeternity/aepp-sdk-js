import { ConvertSk } from './components/ConvertSk';
import { AccountsByMnemonic } from './components/AccountsByMnemonic';
import { TransactionPacker } from './components/TransactionPacker';
import { DataEncoder } from './components/DataEncoder';

export function App() {
  return (
    <>
      <ConvertSk />
      <AccountsByMnemonic />
      <TransactionPacker />
      <DataEncoder />
    </>
  );
}
