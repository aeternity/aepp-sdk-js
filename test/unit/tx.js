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

import '../'
import { describe, it } from 'mocha'
import { encode as rlpEncode } from 'rlp'
import { salt } from '../../src/utils/crypto'
import {
  classify,
  commitmentHash,
  ensureNameValid,
  getMinimumNameFee,
  isNameValid,
  produceNameId
} from '../../src/tx/builder/helpers'
import BigNumber from 'bignumber.js'
import { toBytes } from '../../src/utils/bytes'
import { parseBigNumber } from '../../src/utils/bignumber'
import { buildTx, unpackTx } from '../../src/tx/builder'

describe('Tx', function () {
  it('reproducible commitment hashes can be generated', async () => {
    const _salt = salt()
    const hash = await commitmentHash('foobar.chain', _salt)
    hash.should.be.a('string')
    return hash.should.be.equal(await commitmentHash('foobar.chain', _salt))
  })
  it('Parse big number', async () => {
    parseBigNumber('123123123123').should.be.a('string')
  })
  it('test from big number to bytes', async () => {
    // TODO investigate about float numbers serialization
    const data = [
      BigNumber('7841237845261982793129837487239459234675231423423453451234'),
      BigNumber('7841237845261982793129837487239459214234234534523'),
      BigNumber('7841237845261982793129837412341231231'),
      BigNumber('78412378452619'),
      BigNumber('7841237845261982793129837487239459214124563456'),
      BigNumber('7841237845261982793129837487239459214123')
    ]

    function bnFromBytes (bn) {
      const bytes = toBytes(bn, true)
      return BigNumber(bytes.toString('hex'), 16).toString(10)
    }

    data.forEach(n => {
      n.toString(10).should.be.equal(bnFromBytes(n))
    })
  })
  it('Produce name id for `.chain`', () => {
    produceNameId('asdas.chain').should.be.equal('nm_2DMazuJNrGkQYve9eMttgdteaigeeuBk3fmRYSThJZ2NpX3r8R')
  })

  describe('ensureNameValid', () => {
    it('validates type', () => {
      try {
        ensureNameValid({})
      } catch ({ message }) {
        message.should.be.equal('Name must be a string')
      }
    })

    it('validates domain', () => {
      try {
        ensureNameValid('asdasdasd.unknown')
      } catch ({ message }) {
        message.should.have.string('Name should end with .chain:')
      }
    })

    it('don\'t throws exception', () => ensureNameValid('asdasdasd.chain'))
  })

  describe('getMinimumNameFee', () => {
    it('returns correct name fees', () => {
      // based on: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
      function randomName (length) {
        let result = ''
        const characters =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        for (let i = 0; i < length; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * characters.length)
          )
        }
        return result
      }

      // protocol name fees: https://github.com/aeternity/protocol/blob/master/AENS.md#protocol-fees-and-protection-times
      const nameFees = [
        5702887, 3524578, 2178309, 1346269, 832040, 514229, 317811, 196418,
        121393, 75025, 46368, 28657, 17711, 10946, 6765, 4181, 2584, 1597, 987,
        610, 377, 233, 144, 89, 55, 34, 21, 13, 8, 5, 3
      ]

      for (let i = 0; i < nameFees.length; i++) {
        getMinimumNameFee(randomName(i + 1) + '.chain')
          .toString()
          .should.be.equal(BigNumber(nameFees[i]).times(1e14).toString())
      }
    })
  })

  describe('isNameValid', () => {
    it('validates type', () => isNameValid({}).should.be.equal(false))
    it('validates domain', () => isNameValid('asdasdasd.unknown').should.be.equal(false))
    it('don\'t throws exception', () => isNameValid('asdasdasd.chain').should.be.equal(true))
  })

  it('classify: invalid hash', () => {
    try {
      classify('aaaaa')
    } catch (e) {
      e.message.should.be.equal('Not a valid hash')
    }
  })
  it('classify: invalid prefix', () => {
    try {
      classify('aa_23aaaaa')
    } catch (e) {
      e.message.should.be.equal('Unknown class aa')
    }
  })
  it('Deserialize tx: invalid tx type', () => {
    const tx = rlpEncode([99, 99])
    try {
      unpackTx(tx, true)
    } catch (e) {
      e.message.should.be.equal('Transaction deserialization not implemented for tag ' + 99)
    }
  })
  it('Deserialize tx: invalid tx VSN', () => {
    const tx = rlpEncode([10, 99])
    try {
      unpackTx(tx, true)
    } catch (e) {
      e.message.should.be.equal('Transaction deserialization not implemented for tag ' + 10 + ' version ' + 99)
    }
  })
  it('Serialize tx: invalid tx type', () => {
    try {
      buildTx({}, 'someTx')
    } catch (e) {
      e.message.should.be.equal('Transaction serialization not implemented for someTx')
    }
  })
  it('Serialize tx: invalid tx VSN', () => {
    try {
      buildTx({}, 'spendTx', { vsn: 5 })
    } catch (e) {
      e.message.should.be.equal('Transaction serialization not implemented for spendTx version 5')
    }
  })
})
