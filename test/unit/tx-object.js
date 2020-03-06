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
import TxObject from '../../es/tx/tx-object'
import { TX_TYPE } from '../../es/tx/builder/schema'
import { generateKeyPair } from '../../es/utils/crypto'
import MemoryAccount from '../../es/account/memory'

describe('TxObject', () => {
  const keyPair = generateKeyPair()
  let txObject
  let signedTx
  describe('Invalid initialization', () => {
    it('Empty arguments', () => {
      try {
        TxObject()
      } catch (e) {
        e.message.should.be.equal('Invalid TxObject arguments. Please provide one of { tx: "tx_asdasd23..." } or { type: "spendTx", params: {...} }')
      }
    })
    it('Invalid "params"', () => {
      try {
        TxObject({ params: true, type: TX_TYPE.spend })
      } catch (e) {
        e.message.should.be.equal('"params" should be an object')
      }
    })
    it('Invalid "type"', () => {
      try {
        TxObject({ params: {}, type: 1 })
      } catch (e) {
        e.message.should.be.equal('Unknown transaction type 1')
      }
    })
    it('Not enough arguments', () => {
      try {
        TxObject({ params: { senderId: 'ak_123', amount: 1 }, type: TX_TYPE.spend })
      } catch (e) {
        e.message.indexOf('Transaction build error').should.not.be.equal(-1)
      }
    })
  })
  describe('Init TxObject', () => {
    it('Build transaction', async () => {
      txObject = TxObject({
        type: TX_TYPE.spend,
        params: { senderId: keyPair.publicKey, recipientId: keyPair.publicKey, amount: 100, ttl: 0, nonce: 1, fee: 100 }
      })
      signedTx = await MemoryAccount({ keypair: keyPair, networkId: 'ae_mainnet' }).signTransaction(txObject.encodedTx)
      txObject.encodedTx.should.be.a('string')
      Buffer.isBuffer(txObject.rlpEncoded).should.be.equal(true)
      txObject.binary.should.be.a('Array')
      txObject.params.should.be.a('object')
    })
    it('Unpack transaction from string/rlp', () => {
      const txFromString = TxObject.fromString(txObject.encodedTx)
      txFromString.rlpEncoded.equals(txObject.rlpEncoded).should.be.equal(true)
      Buffer.from(txFromString.binary).equals(Buffer.from(txObject.binary)).should.be.equal(true)
      txFromString.encodedTx.should.be.equal(txObject.encodedTx)
      txFromString.params.should.be.deep.include(txObject.params)
      const rtxFromRlpBinary = TxObject.fromRlp(txObject.rlpEncoded)
      rtxFromRlpBinary.rlpEncoded.equals(txObject.rlpEncoded).should.be.equal(true)
      Buffer.from(rtxFromRlpBinary.binary).equals(Buffer.from(txObject.binary)).should.be.equal(true)
      rtxFromRlpBinary.encodedTx.should.be.equal(txObject.encodedTx)
      rtxFromRlpBinary.params.should.be.deep.include(txObject.params)
    })
    it('Unpack signed transaction', () => {
      console.log(TxObject.fromString(signedTx))
    })
  })
})
