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

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { generateSaveHDWallet, getSaveHDWalletAccounts } from '../../es/utils/hd-wallet'
import { encodeBase58Check } from '../../es/utils/crypto'

describe('hd wallet', () => {
  const testMnemonic = 'eye quarter chapter suit cruel scrub verify stuff volume control learn dust'
  const testPassword = 'test-password'
  const testSaveHDWallet = {
    chainCode: `dd5cb572e8bddab36882ebbf87854e3b66f565447f20cfac874a5d3d7dd6d0d5`,
    secretKey: `731b6d83ff699d992959cd7f728285e07456a3589c4f1aac774158a63d9181fe`
  }
  const testAccounts = [{
    publicKey: `f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037`,
    secretKey: `87abcb9c765f3259cf448542cae4c2e9bbff2ad2588693239fd7ca00b17fd463f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037`
  }, {
    publicKey: `1d7ce9bcf06e93c844c02489862b623c23b14a7364350a36336c87bc76b6650a`,
    secretKey: `e78fdb3c2600a0684906adfcb5fac33167576dcb099580bde000bc5a363c939c1d7ce9bcf06e93c844c02489862b623c23b14a7364350a36336c87bc76b6650a`
  }]

  describe('generateSaveHDWallet', () =>
    it('generates encrypted extended wallet key', () => {
      const walletKeys = generateSaveHDWallet(testMnemonic, testPassword)
      expect(walletKeys).to.eql(testSaveHDWallet)
    }))

  describe('getSaveHDWalletAccounts', () =>
    it('generates array of accounts', () => {
      const accounts = getSaveHDWalletAccounts(testSaveHDWallet, testPassword, 2)

      expect(accounts).to.eql(testAccounts.map(acc => ({
        secretKey: acc.secretKey,
        publicKey: `ak_${encodeBase58Check(Buffer.from(acc.publicKey, 'hex'))}`
      })))
    }))
})
