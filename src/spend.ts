import BigNumber from 'bignumber.js';
import { getBalance, resolveName } from './chain.js';
import { sendTransaction, SendTransactionOptions } from './send-transaction.js';
import { buildTxAsync, BuildTxOptions, unpackTx } from './tx/builder/index.js';
import { ArgumentError } from './utils/errors.js';
import { Encoded } from './utils/encoder.js';
import { Tag, AensName } from './tx/builder/constants.js';

// TODO: name verify should not overlap with transaction verify
type ResolveNameOptions = Omit<Parameters<typeof resolveName>[2], 'onNode' | 'verify'>;

/**
 * Send coins to another account
 * @category chain
 * @param amount - Amount to spend
 * @param recipientIdOrName - Address or name of recipient account
 * @param options - Options
 * @returns Transaction
 */
export async function spend(
  amount: number | string,
  recipientIdOrName: Encoded.AccountAddress | Encoded.ContractAddress | AensName,
  options: SpendOptions,
): ReturnType<typeof sendTransaction> {
  return sendTransaction(
    await buildTxAsync({
      _isInternalBuild: true,
      ...options,
      tag: Tag.SpendTx,
      senderId: options.onAccount.address,
      recipientId: await resolveName(recipientIdOrName, 'account_pubkey', options),
      amount,
    }),
    options,
  );
}

type SpendOptionsType = BuildTxOptions<
  Tag.SpendTx,
  'senderId' | 'recipientId' | 'amount' | 'onNode'
> &
  ResolveNameOptions &
  SendTransactionOptions;
interface SpendOptions extends SpendOptionsType {}

// TODO: Rename to spendFraction
/**
 * Spend a fraction of coin balance to another account. Useful if needed to drain account balance
 * completely, sending funds to another account (with fraction set to 1).
 * @category chain
 * @param fraction - Fraction of balance to spend (between 0 and 1)
 * @param recipientIdOrName - Address or name of recipient account
 * @param options - Options
 * @example
 * ```js
 * // `fraction` * 100 = % of AE to be transferred (e.g. `0.42` for 42% or `1` for 100%)
 * const { blockHeight } = await aeSdk.transferFunds(
 *   0.42,
 *   'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
 * );
 * console.log('Transaction mined at', blockHeight);
 * ```
 */
export async function transferFunds(
  fraction: number | string, // TODO: accept only number
  recipientIdOrName: AensName | Encoded.AccountAddress | Encoded.ContractAddress,
  options: TransferFundsOptions,
): ReturnType<typeof sendTransaction> {
  if (+fraction < 0 || +fraction > 1) {
    throw new ArgumentError('fraction', 'a number between 0 and 1', fraction);
  }
  const recipientId = await resolveName(recipientIdOrName, 'account_pubkey', options);
  const senderId = options.onAccount.address;
  const balance = new BigNumber(await getBalance.bind(options.onAccount)(senderId, options));
  const desiredAmount = balance.times(fraction).integerValue(BigNumber.ROUND_HALF_UP);
  const { fee } = unpackTx(
    await buildTxAsync({
      _isInternalBuild: true,
      ...options,
      tag: Tag.SpendTx,
      senderId,
      recipientId,
      amount: desiredAmount,
    }),
    Tag.SpendTx,
  );
  // Reducing of the amount may reduce transaction fee, so this is not completely accurate
  const amount = desiredAmount.plus(fee).gt(balance) ? balance.minus(fee) : desiredAmount;
  return sendTransaction(
    await buildTxAsync({
      _isInternalBuild: true,
      ...options,
      tag: Tag.SpendTx,
      senderId,
      recipientId,
      amount,
    }),
    options,
  );
}

type TransferFundsOptionsType = BuildTxOptions<
  Tag.SpendTx,
  'senderId' | 'recipientId' | 'amount' | 'onNode'
> &
  ResolveNameOptions &
  SendTransactionOptions;
interface TransferFundsOptions extends TransferFundsOptionsType {}

/**
 * Submit transaction of another account paying for it (fee and gas)
 * @category chain
 * @param transaction - tx_<base64>-encoded transaction
 * @param options - Options
 * @returns Object Transaction
 */
export async function payForTransaction(
  transaction: Encoded.Transaction,
  options: PayForTransactionOptions,
): ReturnType<typeof sendTransaction> {
  return sendTransaction(
    await buildTxAsync({
      _isInternalBuild: true,
      ...options,
      tag: Tag.PayingForTx,
      payerId: options.onAccount.address,
      tx: transaction,
    }),
    options,
  );
}

interface PayForTransactionOptions
  extends BuildTxOptions<Tag.PayingForTx, 'payerId' | 'tx' | 'onNode'>,
    SendTransactionOptions {}
