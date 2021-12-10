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
import { encodeBase58Check, encodeBase64Check, generateKeyPair, salt } from '../../src/utils/crypto'
import { getSdk } from './index'
import { commitmentHash, oracleQueryId } from '../../src/tx/builder/helpers'
import { GAS_MAX, MIN_GAS_PRICE } from '../../src/tx/builder/schema'
import { MemoryAccount } from '../../src'
import { AE_AMOUNT_FORMATS } from '../../src/utils/amount-formatter'
import { unpackTx } from '../../src/tx/builder'

const nonce = 1
const nameTtl = 1
const clientTtl = 1
const amount = 0
const senderId = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688'
const recipientId = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688'
const name = 'test123test.chain'
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
const contractSource = `
contract Identity =
  entrypoint getArg(x : int) = x
`
let contractId
const deposit = 4

let _salt
let commitmentId

describe('Native Transaction', function () {
  let sdkNative
  let sdk
  let oracleId
  let queryId

  before(async () => {
    const keyPair = generateKeyPair()
    sdk = await getSdk({ nativeMode: false })
    sdkNative = await getSdk()
    await sdk.spend('16774200000000000000', keyPair.publicKey)
    await sdk.addAccount(MemoryAccount({ keypair: keyPair }), { select: true })
    await sdkNative.addAccount(MemoryAccount({ keypair: keyPair }), { select: true })
    oracleId = `ok_${(await sdk.address()).slice(3)}`
    _salt = salt()
    commitmentId = await commitmentHash(name, _salt)
  })

  it('Build tx using denomination amount', async () => {
    const params = { senderId, recipientId, nonce, payload: 'test' }
    const spendAe = await sdkNative.spendTx(
      { ...params, amount: 1, denomination: AE_AMOUNT_FORMATS.AE }
    )
    const spendAettos = await sdkNative.spendTx({ ...params, amount: 1e18, payload: 'test' })
    spendAe.should.be.equal(spendAettos)
    const { tx: { amount } } = unpackTx(spendAe)
    const { tx: { amount: amount2 } } = unpackTx(spendAettos)
    amount.should.be.equal(amount2)
  })

  it('native build of spend tx', async () => {
    const aeAmount = 2
    const aettosAmount = 2e18
    const params = { senderId, recipientId, nonce, payload: 'test' }
    const txFromAPI = await sdk.spendTx({ ...params, amount: aettosAmount })
    const nativeTx = await sdkNative.spendTx(
      { ...params, amount: aeAmount, denomination: AE_AMOUNT_FORMATS.AE }
    )
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of name pre-claim tx', async () => {
    const params = { accountId: senderId, nonce, commitmentId }
    const txFromAPI = await sdk.namePreclaimTx(params)
    const nativeTx = await sdkNative.namePreclaimTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of claim tx', async () => {
    const params = { accountId: senderId, nonce, name: nameHash, nameSalt: _salt, nameFee }
    const txFromAPI = await sdk.nameClaimTx(params)
    const nativeTx = await sdkNative.nameClaimTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of update tx', async () => {
    const params = { accountId: senderId, nonce, nameId, nameTtl, pointers, clientTtl }
    const nativeTx = await sdkNative.nameUpdateTx(params)
    const txFromAPI = await sdk.nameUpdateTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of revoke tx', async () => {
    const params = { accountId: senderId, nonce, nameId }
    const txFromAPI = await sdk.nameRevokeTx(params)
    const nativeTx = await sdkNative.nameRevokeTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of transfer tx', async () => {
    const params = { accountId: senderId, nonce, nameId, recipientId }
    const txFromAPI = await sdk.nameTransferTx(params)
    const nativeTx = await sdkNative.nameTransferTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  let contract
  it('native build of contract create tx', async () => {
    contract = await sdk.getContractInstance({ source: contractSource })
    await contract.compile()
    const params = {
      ownerId: await sdk.address(),
      code: contract.bytecode,
      deposit,
      amount,
      gas: GAS_MAX,
      gasPrice: MIN_GAS_PRICE,
      callData: contract.calldata.encode('Identity', 'init', [])
    }
    const txFromAPI = await sdk.contractCreateTx(params)
    const nativeTx = await sdkNative.contractCreateTx(params)

    txFromAPI.tx.should.be.equal(nativeTx.tx)
    txFromAPI.contractId.should.be.equal(nativeTx.contractId)
    // deploy contract
    await sdk.send(nativeTx.tx)
    contractId = txFromAPI.contractId
  })

  it('native build of contract call tx', async () => {
    const callData = contract.calldata.encode('Identity', 'getArg', [2])
    const owner = await sdk.address()

    const params = {
      callerId: owner,
      contractId,
      amount,
      gas: GAS_MAX,
      gasPrice: MIN_GAS_PRICE,
      callData
    }
    const txFromAPI = await sdk.contractCallTx(params)
    const nativeTx = await sdkNative.contractCallTx(params)
    txFromAPI.should.be.equal(nativeTx)

    const { hash } = await sdk.send(nativeTx)
    const { callInfo: { returnType } } = await sdk.api.getTransactionInfoByHash(hash)

    returnType.should.be.equal('ok')
  })

  it('native build of oracle create tx', async () => {
    const accountId = await sdk.address()
    const params = { accountId, queryFormat, responseFormat, queryFee, oracleTtl }

    const txFromAPI = await sdk.oracleRegisterTx(params)
    const nativeTx = await sdkNative.oracleRegisterTx(params)

    txFromAPI.should.be.equal(nativeTx)
    await sdkNative.send(nativeTx)

    const oId = (await sdk.api.getOracleByPubkey(oracleId)).id
    oId.should.be.equal(oracleId)
  })

  it('native build of oracle extends tx', async () => {
    const callerId = await sdk.address()
    const params = { oracleId, callerId, oracleTtl }
    const orTtl = (await sdk.api.getOracleByPubkey(oracleId)).ttl

    const txFromAPI = await sdk.oracleExtendTx(params)
    const nativeTx = await sdkNative.oracleExtendTx(params)

    txFromAPI.should.be.equal(nativeTx)

    await sdk.send(nativeTx)
    const orNewTtl = (await sdk.api.getOracleByPubkey(oracleId)).ttl
    orNewTtl.should.be.equal(orTtl + oracleTtl.value)
  })

  it('native build of oracle post query tx', async () => {
    const senderId = await sdk.address()

    const params = { oracleId, responseTtl, query, queryTtl, queryFee, senderId }

    const txFromAPI = await sdk.oraclePostQueryTx(params)
    const nativeTx = await sdkNative.oraclePostQueryTx(params)
    queryId = oracleQueryId(senderId, unpackTx(txFromAPI).tx.nonce, oracleId)

    txFromAPI.should.be.equal(nativeTx)

    await sdk.send(nativeTx)

    const oracleQuery = (await sdk.api.getOracleQueryByPubkeyAndQueryId(oracleId, queryId))
    oracleQuery.id.should.be.equal(queryId)
  })

  it('native build of oracle respond query tx', async () => {
    const callerId = await sdk.address()
    const params = { oracleId, callerId, responseTtl, queryId, response: queryResponse }

    const txFromAPI = await sdk.oracleRespondTx(params)
    const nativeTx = await sdkNative.oracleRespondTx(params)
    txFromAPI.should.be.equal(nativeTx)

    await sdk.send(nativeTx)

    const orQuery = (await sdk.api.getOracleQueryByPubkeyAndQueryId(oracleId, queryId))
    orQuery.response.should.be.equal(`or_${encodeBase64Check(queryResponse)}`)
  })
  it('Get next account nonce', async () => {
    const accountId = await sdk.address()
    const { nonce: accountNonce } = await sdk.api.getAccountByPubkey(accountId)
      .catch(() => ({ nonce: 0 }))
    const nonce = await sdk.getAccountNonce(await sdk.address())
    nonce.should.be.equal(accountNonce + 1)
    const nonceCustom = await sdk.getAccountNonce(await sdk.address(), 1)
    nonceCustom.should.be.equal(1)
  })
  it('Destroy instance finishes without error', () => {
    sdk.destroyInstance()
  })
})
