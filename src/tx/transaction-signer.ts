import { Encoded } from '../utils/encoder.js';
import { buildTx, getSchema, unpackTx } from './builder/index.js';
import { Tag } from './builder/constants.js';
import { TransactionError, UnexpectedTsError } from '../utils/errors.js';

/**
 * Returns account address that signed a transaction
 * @param transaction - transaction to get a signer of
 * @category utils
 */
export default function getTransactionSignerAddress(
  transaction: Encoded.Transaction,
): Encoded.AccountAddress {
  const params = unpackTx(transaction);
  switch (params.tag) {
    case Tag.SignedTx:
      return getTransactionSignerAddress(buildTx(params.encodedTx));
    case Tag.GaMetaTx:
      return params.gaId;
    default:
  }

  const nonce = getSchema(params.tag, params.version).find(([name]) => name === 'nonce')?.[1];
  if (nonce == null)
    throw new TransactionError(`Transaction doesn't have nonce: ${Tag[params.tag]}`);
  if (!('senderKey' in nonce)) throw new UnexpectedTsError();
  const address = params[nonce.senderKey as keyof typeof params] as unknown as string;
  return address.replace(/^ok_/, 'ak_') as Encoded.AccountAddress;
}
