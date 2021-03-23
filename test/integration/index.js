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

import { Universal, Crypto, MemoryAccount, Node } from '../../es'
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
const forceCompatibility = process.env.FORCE_COMPATIBILITY || false
export const genesisAccount = MemoryAccount({ keypair: { publicKey, secretKey } })
export const account = Crypto.generateKeyPair()

export const BaseAe = async (params = {}) => {
  const ae = await Universal.waitMined(true).compose({
    deepProps: { Ae: { defaults: { interval: 50, attempts: 1200 } }, Swagger: { defaults: { debug: !!process.env.DEBUG } } },
    props: { process, compilerUrl }
  })({
    ...params,
    forceCompatibility,
    accounts: [...params.accounts || [], genesisAccount],
    nodes: [{ name: 'test', instance: await Node({ url, internalUrl }) }]
  })
  ae.removeAccount(process.env.WALLET_PUB)
  return ae
}

const spendPromise = (async () => {
  const ae = await BaseAe({ networkId })
  await ae.awaitHeight(2)
  await ae.spend('1' + '0'.repeat(26), account.publicKey)
})()

export async function getSdk (nativeMode) {
  await spendPromise

  return BaseAe({
    accounts: [MemoryAccount({ keypair: account })],
    address: account.publicKey,
    nativeMode,
    networkId
  })
}
