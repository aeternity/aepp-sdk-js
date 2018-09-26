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

import { before, describe, it } from 'mocha'

import { configure, plan, ready, execute, parseBlock, WALLET_NAME } from './index'

plan(1000000000)

describe.skip('CLI AENS Module', function () {
  configure(this)
  const name = 'test.aet'
  let wallet

  before(async function () {
    // Spend tokens for wallet
    wallet = await ready(this)
  })

  it('Claim Name', async () => {
    console.log((await execute(['wallet', WALLET_NAME, '--password', 'test', 'name', name, 'claim'])))

    const nameResult = parseBlock(await execute(['inspect', 'name', name]))
    const isHash = nameResult.name_hash !== 'N/A'

    nameResult.status.should.equal('CLAIMED')
    isHash.status.should.equal(true)
  })
  it('Revoke Name', async () => {
    (await execute(['wallet', WALLET_NAME, '--password', 'test', 'name', name, 'revoke']))

    const nameResult = parseBlock(await execute(['inspect', 'name', name]))

    nameResult.status.should.equal('AVAILABLE')
    nameResult.name_hash.should.equal('N/A')
    nameResult.pointers.should.equal('N/A')
  })
})
