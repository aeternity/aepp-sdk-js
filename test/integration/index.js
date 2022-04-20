/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

import { Universal, Crypto, MemoryAccount, Node } from '../../src'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
chai.should()

export const url = process.env.TEST_URL || 'http://localhost:3013'
export const internalUrl = process.env.TEST_INTERNAL_URL || 'http://localhost:3113'
export const compilerUrl = process.env.COMPILER_URL || 'http://localhost:3080'
export const publicKey = process.env.PUBLIC_KEY || 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR'
const secretKey = process.env.SECRET_KEY || 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'
export const networkId = process.env.TEST_NETWORK_ID || 'ae_devnet'
export const ignoreVersion = process.env.IGNORE_VERSION || false
export const genesisAccount = MemoryAccount({ keypair: { publicKey, secretKey } })
export const account = Crypto.generateKeyPair()

export const BaseAe = async (params = {}, compose = {}) => Universal
  .compose({
    deepProps: {
      Ae: {
        defaults: {
          _expectedMineRate: 1000,
          _microBlockCycle: 300
        }
      }
    }
  })
  .compose(compose)({
    ...params,
    compilerUrl,
    ignoreVersion,
    accounts: [
      ...params.accounts || [],
      ...params.withoutGenesisAccount ? [] : [genesisAccount]
    ],
    nodes: [{ name: 'test', instance: await Node({ url, internalUrl, ignoreVersion }) }]
  })

export const spendPromise = (async () => {
  const ae = await BaseAe({ networkId, withoutGenesisAccount: false })
  await ae.awaitHeight(2)
  await ae.spend(1e26, account.publicKey)
})()

export async function getSdk ({ nativeMode = true, withoutAccount } = {}) {
  await spendPromise

  return BaseAe({
    ...withoutAccount
      ? { withoutGenesisAccount: true }
      : { accounts: [MemoryAccount({ keypair: account })] },
    nativeMode,
    networkId
  })
}
