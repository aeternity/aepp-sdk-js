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

/**
 * Ae module
 * @module @aeternity/aepp-sdk/es/ae
 * @example import { Ae } from '@aeternity/aepp-sdk'
 */
import { sendTransaction, getAccount, getBalance, resolveName, AensName } from '../chain'
import { _buildTx, BuildTxOptions } from '../tx'
import { buildTxHash, unpackTx } from '../tx/builder'
import BigNumber from 'bignumber.js'
import { ArgumentError } from '../utils/errors'
import { EncodedData } from '../utils/encoder'
import { createMetaTx } from '../contract/ga'
import { TX_TYPE } from '../tx/builder/schema'
import AccountBase from '../account/base'

/**
 * Sign and post a transaction to the chain
 * @param tx - Transaction
 * @param options - Options
 * @param options.verify - Verify transaction before broadcast, throw error if not
 * valid
 * @returns Transaction
 */
export async function send (
  tx: EncodedData<'tx'>,
  options: Parameters<AccountBase['signTransaction']>[1] & Parameters<typeof sendTransaction>[1]
  & Partial<Omit<Parameters<typeof signUsingGA>[1], 'onAccount' | 'onCompiler'>>
  & Pick<Parameters<typeof signUsingGA>[1], 'onAccount' | 'onCompiler'>
): ReturnType<typeof sendTransaction> {
  const { contractId, authFun = undefined } = options.innerTx === true
    ? { contractId: null }
    : await getAccount(await options.onAccount.address(options), options)

  const signed = contractId != null
    // TODO: not required arguments become required depending on account type, can ga be extracted?
    ? await signUsingGA(tx, { authData: {}, ...options, authFun: authFun as string })
    : await options.onAccount.signTransaction(tx, options)

  return options.innerTx === true
    ? { hash: buildTxHash(signed), rawTx: signed }
    : await sendTransaction(signed, options)
}

export async function signUsingGA (
  tx: EncodedData<'tx'>,
  { authData, authFun, ...options }: {
    authData: Parameters<typeof createMetaTx>[1]
    authFun: Parameters<typeof createMetaTx>[2]
  } & Parameters<typeof createMetaTx>[3]
): Promise<EncodedData<'tx'>> {
  return await createMetaTx(tx, authData, authFun, options)
}

/**
 * Send coins to another account
 * @instance
 * @param amount - Amount to spend
 * @param recipientIdOrName - Address or name of recipient account
 * @param options - Options
 * @returns Transaction
 */
export async function spend (
  amount: number | string,
  recipientIdOrName: EncodedData<'ak'> | AensName,
  options: BuildTxOptions<TX_TYPE.spend, 'senderId' | 'recipientId' | 'amount'>
  & Parameters<typeof resolveName>[2] & { onAccount: AccountBase } & Parameters<typeof send>[1]
): ReturnType<typeof send> {
  return await send(
    await _buildTx(TX_TYPE.spend, {
      ...options,
      senderId: await options.onAccount.address(options),
      recipientId: await resolveName(recipientIdOrName, 'account_pubkey', options),
      amount
    }),
    options
  )
}

// TODO: Rename to spendFraction
/**
 * Send a fraction of coin balance to another account
 * @instance
 * @param fraction - Fraction of balance to spend (between 0 and 1)
 * @param recipientIdOrName - Address or name of recipient account
 * @param options - Options
 * @returns Transaction
 */
export async function transferFunds (
  fraction: number | string,
  recipientIdOrName: AensName,
  options: BuildTxOptions<TX_TYPE.spend, 'senderId' | 'recipientId' | 'amount'>
  & Parameters<typeof resolveName>[2] & { onAccount: AccountBase } & Parameters<typeof send>[1]
): ReturnType<typeof send> {
  if (fraction < 0 || fraction > 1) {
    throw new ArgumentError('fraction', 'a number between 0 and 1', fraction)
  }
  const recipientId = await resolveName<'ak'>(recipientIdOrName, 'account_pubkey', options)
  const senderId = await options.onAccount.address(options)
  const balance = new BigNumber(
    await getBalance.bind(options.onAccount)(senderId, options)
  )
  const desiredAmount = balance.times(fraction).integerValue(BigNumber.ROUND_HALF_UP)
  const { tx: { fee } } = unpackTx(
    await _buildTx(TX_TYPE.spend, { ...options, senderId, recipientId, amount: desiredAmount }),
    TX_TYPE.spend
  )
  // Reducing of the amount may reduce transaction fee, so this is not completely accurate
  const amount = desiredAmount.plus(fee).gt(balance) ? balance.minus(fee) : desiredAmount
  return await send(
    await _buildTx(TX_TYPE.spend, { ...options, senderId, recipientId, amount }),
    options
  )
}

/**
 * Submit transaction of another account paying for it (fee and gas)
 * @param transaction - tx_<base64>-encoded transaction
 * @param options
 * @returns Object Transaction
 */
export async function payForTransaction (
  transaction: EncodedData<'tx'>,
  options: BuildTxOptions<TX_TYPE.payingFor, 'payerId' | 'tx'> & { onAccount: AccountBase }
  & Parameters<typeof send>[1]
): ReturnType<typeof send> {
  return await send(
    await _buildTx(
      TX_TYPE.payingFor,
      { ...options, payerId: await options.onAccount.address(options), tx: transaction }
    ),
    options
  )
}
