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

import { describe, it, before } from 'mocha'
import { encodeBase58Check, encodeBase64Check, generateKeyPair, salt } from '../../es/utils/crypto'
import { ready, configure } from './index'
import { commitmentHash } from '../../es/tx/builder/helpers'

const nonce = 1
const nameTtl = 1
const clientTtl = 1
const amount = 1
const senderId = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688'
const recipientId = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688'
const name = 'test123test.test'
const nameHash = `nm_${encodeBase58Check(Buffer.from(name))}`
const nameId = 'nm_2sFnPHi5ziAqhdApSpRBsYdomCahtmk3YGNZKYUTtUNpVSMccC'
const pointers = [{ key: 'account_pubkey', id: senderId }]

// Oracle
const queryFormat = '{\'city\': str}'
const responseFormat = '{\'tmp\': num}'
const queryFee = 30000
const oracleTtl = { type: 'delta', value: 500 }
const responseTtl = { type: 'delta', value: 100 }
const queryTtl = { type: 'delta', value: 100 }
const query = '{\'city\': \'Berlin\'}'
const queryResponse = '{\'tmp\': 101}'

// Contract test data
const contractCode = `
contract Identity =
  type state = ()
  entrypoint main(x : int) = x
`
let contractId
const deposit = 4
const gasPrice = 1000000000
const gas = 1600000 - 21000 // MAX GAS

let _salt
let commitmentId

describe('Native Transaction', function () {
  configure(this)

  let clientNative
  let client
  let oracleId
  let queryId

  before(async () => {
    const keyPair = generateKeyPair()
    client = await ready(this, false)
    clientNative = await ready(this)
    await client.spend('16774200000000000000', keyPair.publicKey)
    client.setKeypair(keyPair)
    clientNative.setKeypair(keyPair)
    oracleId = `ok_${(await client.address()).slice(3)}`
    _salt = salt()
    commitmentId = await commitmentHash(name, _salt)
  })

  it('native build of spend tx', async () => {
    const txFromAPI = await client.spendTx({ senderId, recipientId, amount, nonce, payload: 'test' })
    const nativeTx = await clientNative.spendTx({ senderId, recipientId, amount, nonce, payload: 'test' })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of name pre-claim tx', async () => {
    const txFromAPI = await client.namePreclaimTx({ accountId: senderId, nonce, commitmentId })
    const nativeTx = await clientNative.namePreclaimTx({ accountId: senderId, nonce, commitmentId })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of claim tx', async () => {
    const txFromAPI = await client.nameClaimTx({
      accountId: senderId,
      nonce,
      name: nameHash,
      nameSalt: _salt
    })
    const nativeTx = await clientNative.nameClaimTx({
      accountId: senderId,
      nonce,
      name: nameHash,
      nameSalt: _salt
    })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of update tx', async () => {
    const nativeTx = await clientNative.nameUpdateTx({
      accountId: senderId,
      nonce,
      nameId,
      nameTtl,
      pointers,
      clientTtl
    })
    const txFromAPI = await client.nameUpdateTx({ accountId: senderId, nonce, nameId, nameTtl, pointers, clientTtl })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of revoke tx', async () => {
    const txFromAPI = await client.nameRevokeTx({ accountId: senderId, nonce, nameId })
    const nativeTx = await clientNative.nameRevokeTx({ accountId: senderId, nonce, nameId })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of transfer tx', async () => {
    const txFromAPI = await client.nameTransferTx({ accountId: senderId, nonce, nameId, recipientId })
    const nativeTx = await clientNative.nameTransferTx({ accountId: senderId, nonce, nameId, recipientId })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of contract create tx', async () => {
    const { bytecode } = await client.contractCompile(contractCode)
    const callData = await client.contractEncodeCall(contractCode, 'init')
    const owner = await client.address()

    const txFromAPI = await client.contractCreateTx({
      ownerId: owner,
      code: bytecode,
      deposit,
      amount,
      gas,
      gasPrice,
      callData
    })
    const nativeTx = await clientNative.contractCreateTx({
      ownerId: owner,
      code: bytecode,
      deposit,
      amount,
      gas,
      gasPrice,
      callData
    })

    txFromAPI.tx.should.be.equal(nativeTx.tx)
    txFromAPI.contractId.should.be.equal(nativeTx.contractId)
    // deploy contract
    await client.send(nativeTx.tx)
    contractId = txFromAPI.contractId
  })

  it('native build of contract call tx', async () => {
    const callData = await client.contractEncodeCall(contractCode, 'main', ['2'])
    const owner = await client.address()

    const txFromAPI = await client.contractCallTx({ callerId: owner, contractId, amount, gas, gasPrice, callData })
    const nativeTx = await clientNative.contractCallTx({ callerId: owner, contractId, amount, gas, gasPrice, callData })
    txFromAPI.should.be.equal(nativeTx)

    const { hash } = await client.send(nativeTx)
    const result = await client.getTxInfo(hash)

    result.returnType.should.be.equal('ok')
  })

  it('native build of oracle create tx', async () => {
    const accountId = await client.address()
    const params = {
      accountId,
      queryFormat,
      responseFormat,
      queryFee,
      oracleTtl
    }

    const txFromAPI = await client.oracleRegisterTx(params)
    const nativeTx = await clientNative.oracleRegisterTx(params)

    txFromAPI.should.be.equal(nativeTx)
    await clientNative.send(nativeTx, { verify: true })

    const oId = (await client.getOracle(oracleId)).id
    oId.should.be.equal(oracleId)
  })

  it('native build of oracle extends tx', async () => {
    const callerId = await client.address()
    const params = { oracleId, callerId, oracleTtl }
    const orTtl = (await client.getOracle(oracleId)).ttl

    const txFromAPI = await client.oracleExtendTx(params)
    const nativeTx = await clientNative.oracleExtendTx(params)

    txFromAPI.should.be.equal(nativeTx)

    await client.send(nativeTx)
    const orNewTtl = (await client.getOracle(oracleId)).ttl
    orNewTtl.should.be.equal(orTtl + oracleTtl.value)
  })

  it('native build of oracle post query tx', async () => {
    const senderId = await client.address()

    const params = { oracleId, responseTtl, query, queryTtl, queryFee, senderId }

    const { tx: txFromAPI, queryId: oracleQueryId } = await client.oraclePostQueryTx(params)
    const { tx: nativeTx } = await clientNative.oraclePostQueryTx(params)

    txFromAPI.should.be.equal(nativeTx)

    await client.send(nativeTx)

    const oracleQuery = (await client.getOracleQuery(oracleId, oracleQueryId))
    oracleQuery.id.should.be.equal(oracleQueryId)
    queryId = oracleQueryId
  })

  it('native build of oracle respond query tx', async () => {
    const callerId = await client.address()
    const params = { oracleId, callerId, responseTtl, queryId, response: queryResponse }

    const txFromAPI = await client.oracleRespondTx(params)
    const nativeTx = await clientNative.oracleRespondTx(params)
    txFromAPI.should.be.equal(nativeTx)

    await client.send(nativeTx)

    const orQuery = (await client.getOracleQuery(oracleId, queryId))
    orQuery.response.should.be.equal(`or_${encodeBase64Check(queryResponse)}`)
  })
})
