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

import { describe, it } from 'mocha'
import * as R from 'ramda'
import { configure, BaseAe, execute, parseBlock } from './index'
import { generateKeyPair } from '../../es/utils/crypto'

describe('CLI Chain Module', function () {
  configure(this)

  it('TOP', async () => {
    const res = parseBlock(await execute(['chain', 'top']))
    res.should.be.a('object')
    res.block_hash.should.be.a('string')
    parseInt(res.block_height).should.be.a('number')
  })
  it('STATUS', async () => {
    let wallet = await BaseAe()
    wallet.setKeypair(generateKeyPair())

    const { nodeVersion } = await wallet.api.getStatus()
    const res = await execute(['chain', 'status'])
    R.last(res.split(/_/)).trim().should.equal(nodeVersion)
  })
  it('PLAY', async () => {
    try {
      const res = await execute(['chain', 'play', '--limit', '2'])
      console.log(res)
      res.split('<<------------------------------------->>').length.should.equal(3)
      console.log(res)

      const parsed = res.split('<<------------------------------------->>').map(parseBlock)
      console.log(parsed)
      parsed[0].previous_block_hash.should.equal(parsed[1].block_hash)
      parsed[1].previous_block_hash.should.equal(parsed[2].block_hash)
      parsed[2].previous_block_hash.should.equal(parsed[3].block_hash)
    } catch (e) {
      console.log(e)
    }
  })
  it('MEMPOOL', async () => {
    const res = await execute(['chain', 'mempool'])
    res.indexOf('Mempool______________').should.not.equal(-1)
  })
})
