#!/usr/bin/env node
/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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

//   __          __   _ _      _
//   \ \        / /  | | |    | |
//    \ \  /\  / /_ _| | | ___| |_ ___
//     \ \/  \/ / _` | | |/ _ \ __/ __|
//      \  /\  / (_| | | |  __/ |_\__ \
//       \/  \/ \__,_|_|_|\___|\__|___/
//
//

import * as R from 'ramda'
import {
  initClient,
  generateSecureWallet,
  handleApiError,
  generateSecureWalletFromPrivKey,
  checkPref,
  print,
  printError,
  printTransaction,
  getWalletByPathAndDecrypt,
  HASH_TYPES
} from '../utils'

async function spend (receiver, amount, options) {
  let { ttl } = options
  ttl = parseInt(ttl)
  try {
    checkPref(receiver, HASH_TYPES.account)
    const keypair = await getWalletByPathAndDecrypt()
    const client = await initClient(R.merge(options, { keypair }))

    await handleApiError(async () => {
      let tx = await client.spend(parseInt(amount), receiver, { ttl })
      // if waitMined false
      if (typeof tx !== 'object') {
        tx = await client.tx(tx)
      } else {
        print('Transaction mined')
      }
      printTransaction(tx)
    })
  } catch (e) {
    printError(e.message)
  }
}

async function getBalance (options) {
  try {
    const keypair = await getWalletByPathAndDecrypt()
    const client = await initClient(R.merge(options, { keypair }))
    await handleApiError(
      async () => print('Your balance is: ' + (await client.balance(await client.address())))
    )
  } catch (e) {
    printError(e.message)
  }
}

async function getAddress (options) {
  try {
    const keypair = await getWalletByPathAndDecrypt()
    const client = await initClient(R.merge(options, { keypair }))

    await handleApiError(
      async () => print('Your address is: ' + await client.address())
    )
  } catch (e) {
    printError(e.message)
  }
}

async function createSecureWallet (name, { output, password }) {
  try {
    await generateSecureWallet(name, { output, password })
  } catch (e) {
    printError(e.message)
  }
}

async function createSecureWalletByPrivKey (name, priv, { output, password }) {
  try {
    await generateSecureWalletFromPrivKey(name, priv, { output, password })
  } catch (e) {
    printError(e.message)
  }
}

export const Wallet = {
  spend,
  getBalance,
  getAddress,
  createSecureWallet,
  createSecureWalletByPrivKey
}
