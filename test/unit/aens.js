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
import Aens from '../../src/client/aens'
import * as utils from '../utils'
import * as R from 'ramda'

describe('aens', function () {
  it('salt produces random sequences every time', () => {
    const salt1 = Aens.salt()
    const salt2 = Aens.salt()
    salt1.should.be.a('Number')
    salt2.should.be.a('Number')
    salt1.should.not.be.equal(salt2)
  })

  it('reproducible commitment hashes can be generated', () => {
    const salt = Aens.salt()
    const hash = Aens.commitmentHash('foobar.aet', salt)
    hash.should.be.a('string')
    hash.should.be.equal(Aens.commitmentHash('foobar.aet', salt))
  })
})
