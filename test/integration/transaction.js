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
import { getSdk } from './index'
import { commitmentHash, isNameValid, oracleQueryId } from '../../es/tx/builder/helpers'
import { MemoryAccount } from '../../es'
import { AE_AMOUNT_FORMATS } from '../../es/utils/amount-formatter'
import { unpackTx } from '../../es/tx/builder'

const nonce = 1
const nameTtl = 1
const clientTtl = 1
const amount = 0
const senderId = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688'
const recipientId = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688'
const name = 'test123test.test'
const nameHash = `nm_${encodeBase58Check(Buffer.from(name))}`
const nameId = 'nm_2sFnPHi5ziAqhdApSpRBsYdomCahtmk3YGNZKYUTtUNpVSMccC'
const nameFee = '1000000000000000000000'
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
  entrypoint main(x : int) = x
`
let contractId
const deposit = 4
const gasPrice = 1000000000
const gas = 1600000 - 21000 // MAX GAS

let _salt
let commitmentId

describe('Native Transaction', function () {
  let clientNative
  let client
  let oracleId
  let queryId

  before(async () => {
    const keyPair = generateKeyPair()
    client = await getSdk(false)
    clientNative = await getSdk()
    await client.spend('16774200000000000000', keyPair.publicKey)
    await client.addAccount(MemoryAccount({ keypair: keyPair }), { select: true })
    await clientNative.addAccount(MemoryAccount({ keypair: keyPair }), { select: true })
    oracleId = `ok_${(await client.address()).slice(3)}`
    _salt = salt()
    commitmentId = await commitmentHash(name, _salt)
  })
  it('Build tx using denomination amount', async () => {
    const spendAe = await clientNative.spendTx({ senderId, recipientId, amount: 1, nonce, payload: 'test', denomination: AE_AMOUNT_FORMATS.AE })
    const spendAettos = await clientNative.spendTx({ senderId, recipientId, amount: 1e18, nonce, payload: 'test' })
    spendAe.should.be.equal(spendAettos)
    const { tx: { amount } } = unpackTx(spendAe)
    const { tx: { amount: amount2 } } = unpackTx(spendAettos)
    amount.should.be.equal(amount2)
  })
  it('native build of spend tx', async () => {
    const aeAmount = 2
    const aettosAmount = 2e18
    const txFromAPI = await client.spendTx({ senderId, recipientId, amount: aettosAmount, nonce, payload: 'test' })
    const nativeTx = await clientNative.spendTx({ senderId, recipientId, amount: aeAmount, nonce, payload: 'test', denomination: AE_AMOUNT_FORMATS.AE })
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
      nameSalt: _salt,
      nameFee
    })
    const nativeTx = await clientNative.nameClaimTx({
      accountId: senderId,
      nonce,
      name: nameHash,
      nameSalt: _salt,
      nameFee
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

    const txFromAPI = await client.oraclePostQueryTx(params)
    const nativeTx = await clientNative.oraclePostQueryTx(params)
    queryId = oracleQueryId(senderId, unpackTx(txFromAPI).tx.nonce, oracleId)

    txFromAPI.should.be.equal(nativeTx)

    await client.send(nativeTx)

    const oracleQuery = (await client.getOracleQuery(oracleId, queryId))
    oracleQuery.id.should.be.equal(queryId)
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
  it('Get next account nonce', async () => {
    const accountId = await client.address()
    const { nonce: accountNonce } = await client.api.getAccountByPubkey(accountId).catch(() => ({ nonce: 0 }))
    const nonce = await client.getAccountNonce(await client.address())
    nonce.should.be.equal(accountNonce + 1)
    const nonceCustom = await client.getAccountNonce(await client.address(), 1)
    nonceCustom.should.be.equal(1)
  })
  it('Is name valid', () => {
    try {
      isNameValid('asdasdasd.testDomain')
    } catch (e) {
      e.message.indexOf('AENS: Invalid name domain').should.not.be.equal(-1)
    }
  })
  it('Destroy instance', () => {
    client.destroyInstance()
    console.log('Finish without error')
  })
})
