/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
import BigNumber from 'bignumber.js';
import {
  sendTransaction, getAccount, getBalance, resolveName,
} from './chain';
import { _buildTx, BuildTxOptions } from './tx';
import { buildTxHash, unpackTx } from './tx/builder';
import { ArgumentError } from './utils/errors';
import { Encoded, Encoding } from './utils/encoder';
import { Tag, AensName } from './tx/builder/constants';
import AccountBase from './account/Base';

/**
 * Sign and post a transaction to the chain
 * @category chain
 * @param tx - Transaction
 * @param options - Options
 * @param options.verify - Verify transaction before broadcast, throw error if not
 * valid
 * @returns Transaction
 */
export async function send(
  tx: Encoded.Transaction,
  options: SendOptions,
): Promise<SendReturnType> {
  // TODO: detect authFun in AccountGa
  const authFun = options.innerTx === true
    ? undefined
    : (await getAccount(await options.onAccount.address(options), options)).authFun;

  const signed = await options.onAccount.signTransaction(tx, {
    ...options,
    authFun,
    networkId: (await options.onNode.getStatus()).networkId,
  });

  return options.innerTx === true
    ? { hash: buildTxHash(signed), rawTx: signed }
    : sendTransaction(signed, options);
}

type SendOptionsType = Parameters<AccountBase['signTransaction']>[1]
& Parameters<typeof sendTransaction>[1] & { onAccount: AccountBase };
export interface SendOptions extends SendOptionsType {}
interface SendReturnType extends Awaited<ReturnType<typeof sendTransaction>> {}

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
  recipientIdOrName: Encoded.AccountAddress | AensName,
  options: SpendOptions,
): ReturnType<typeof send> {
  return send(
    await _buildTx(Tag.SpendTx, {
      ...options,
      senderId: await options.onAccount.address(options),
      recipientId: await resolveName<Encoding.AccountAddress>(
        recipientIdOrName,
        'account_pubkey',
        options,
      ),
      amount,
    }),
    options,
  );
}

type SpendOptionsType = BuildTxOptions<Tag.SpendTx, 'senderId' | 'recipientId' | 'amount'>
& Parameters<typeof resolveName>[2] & { onAccount: AccountBase } & SendOptions;
interface SpendOptions extends SpendOptionsType {}

// TODO: Rename to spendFraction
/**
 * Send a fraction of coin balance to another account
 * @category chain
 * @param fraction - Fraction of balance to spend (between 0 and 1)
 * @param recipientIdOrName - Address or name of recipient account
 * @param options - Options
 * @returns Transaction
 */
export async function transferFunds(
  fraction: number | string,
  recipientIdOrName: AensName | Encoded.AccountAddress,
  options: TransferFundsOptions,
): ReturnType<typeof send> {
  if (fraction < 0 || fraction > 1) {
    throw new ArgumentError('fraction', 'a number between 0 and 1', fraction);
  }
  const recipientId = await resolveName<Encoding.AccountAddress>(
    recipientIdOrName,
    'account_pubkey',
    options,
  );
  const senderId = await options.onAccount.address(options);
  const balance = new BigNumber(
    await getBalance.bind(options.onAccount)(senderId, options),
  );
  const desiredAmount = balance.times(fraction).integerValue(BigNumber.ROUND_HALF_UP);
  const { tx: { fee } } = unpackTx(
    await _buildTx(Tag.SpendTx, {
      ...options, senderId, recipientId, amount: desiredAmount,
    }),
    Tag.SpendTx,
  );
  // Reducing of the amount may reduce transaction fee, so this is not completely accurate
  const amount = desiredAmount.plus(fee).gt(balance) ? balance.minus(fee) : desiredAmount;
  return send(
    await _buildTx(Tag.SpendTx, {
      ...options, senderId, recipientId, amount,
    }),
    options,
  );
}

type TransferFundsOptionsType = BuildTxOptions<Tag.SpendTx, 'senderId' | 'recipientId' | 'amount'>
& Parameters<typeof resolveName>[2] & { onAccount: AccountBase } & SendOptions;
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
): ReturnType<typeof send> {
  return send(
    await _buildTx(
      Tag.PayingForTx,
      { ...options, payerId: await options.onAccount.address(options), tx: transaction },
    ),
    options,
  );
}

interface PayForTransactionOptions extends
  BuildTxOptions<Tag.PayingForTx, 'payerId' | 'tx'>, SendOptions {
  onAccount: AccountBase;
}
