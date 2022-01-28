/*
 * ISC License (ISC)
 * Copyright (c) 2021 aeternity developers
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
import { expect } from 'chai'
import { encode as rlpEncode } from 'rlp'
import { randomName } from '../utils'
import { salt } from '../../src/utils/crypto'
import {
  decode,
  encode,
  getDefaultPointerKey,
  commitmentHash,
  ensureNameValid,
  getMinimumNameFee,
  isNameValid,
  produceNameId
} from '../../src/tx/builder/helpers'
import BigNumber from 'bignumber.js'
import { toBytes } from '../../src/utils/bytes'
import { buildTx, unpackTx } from '../../src/tx/builder'
import { NAME_BID_RANGES } from '../../src/tx/builder/schema'
import {
  InvalidNameError,
  SchemaNotFoundError
} from '../../src/utils/errors'

describe('Tx', function () {
  it('reproducible commitment hashes can be generated', async () => {
    const _salt = salt()
    const hash = await commitmentHash('foobar.chain', _salt)
    hash.should.be.a('string')
    return hash.should.be.equal(await commitmentHash('foobar.chain', _salt))
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
      expect(() => ensureNameValid({})).to.throw(InvalidNameError, 'Name must be a string')
    })

    it('validates domain', () => {
      expect(() => ensureNameValid('asdasdasd.unknown')).to.throw(InvalidNameError, 'Name should end with .chain:')
    })

    it('don\'t throws exception', () => ensureNameValid('asdasdasd.chain'))
  })

  describe('getMinimumNameFee', () => {
    it('returns correct name fees', () => {
      for (let i = 1; i <= Object.keys(NAME_BID_RANGES).length; i++) {
        getMinimumNameFee(randomName(i)).toString()
          .should.be.equal(NAME_BID_RANGES[i].toString())
      }
    })
  })

  describe('isNameValid', () => {
    it('validates type', () => isNameValid({}).should.be.equal(false))
    it('validates domain', () => isNameValid('asdasdasd.unknown').should.be.equal(false))
    it('don\'t throws exception', () => isNameValid('asdasdasd.chain').should.be.equal(true))
  })

  describe('decode', () => {
    it('throws if not a string', () => expect(() => decode({}))
      .to.throw('Encoded should be a string, got [object Object] instead'))

    it('throws if invalid identifier', () => expect(() => decode('aaaaa'))
      .to.throw('Encoded string missing payload: aaaaa'))

    it('throws if unknown type', () => expect(() => decode('aa_aaaaa'))
      .to.throw('Encoded string have unknown type: aa'))

    it('throws if invalid checksum', () => expect(() => decode('ak_23aaaaa'))
      .to.throw('Invalid checksum'))

    it('throws if not matching type', () => expect(() => decode('cb_DA6sWJo=', 'ak'))
      .to.throw('Encoded string have a wrong type: cb (expected: ak)'))

    it('throws if invalid size', () => expect(() => decode('ak_An6Ui6sE1F'))
      .to.throw('Payload should be 32 bytes, got 4 instead'))

    it('decodes', () => expect(decode('cb_DA6sWJo=')).to.be.eql(Buffer.from([12])))
  })

  describe('encode', () => {
    it('throws if unknown type', () => expect(() => encode([1, 2, 3, 4], 'aa'))
      .to.throw('Unknown type: aa'))
  })

  describe('getDefaultPointerKey', () => {
    it('throws if unknown prefix', () =>
      expect(() => getDefaultPointerKey('th_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR'))
        .to.throw('Default AENS pointer key is not defined for th prefix'))

    it('returns default pointer key for contract', () =>
      expect(getDefaultPointerKey('ct_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR'))
        .to.be.equal('contract_pubkey'))
  })

  it('Deserialize tx: invalid tx type', () => {
    const tx = rlpEncode([99, 99])
    expect(() => unpackTx(tx, true))
      .to.throw(SchemaNotFoundError, 'Transaction deserialization not implemented for tag ' + 99)
  })

  it('Deserialize tx: invalid tx VSN', () => {
    const tx = rlpEncode([10, 99])
    expect(() => unpackTx(tx, true))
      .to.throw(SchemaNotFoundError, 'Transaction deserialization not implemented for tag ' + 10 + ' version ' + 99)
  })

  it('Serialize tx: invalid tx type', () => {
    expect(() => buildTx({}, 'someTx'))
      .to.throw(SchemaNotFoundError, 'Transaction serialization not implemented for someTx')
  })

  it('Serialize tx: invalid tx VSN', () => {
    expect(() => buildTx({}, 'spendTx', { vsn: 5 }))
      .to.throw(SchemaNotFoundError, 'Transaction serialization not implemented for spendTx version 5')
  })
})
