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
import { BaseAe, spendPromise } from './index'
import { commitmentHash, oracleQueryId } from '../../src/tx/builder/helpers'
import { GAS_MAX, MIN_GAS_PRICE } from '../../src/tx/builder/schema'
import { AE_AMOUNT_FORMATS } from '../../src/utils/amount-formatter'
import { unpackTx } from '../../src/tx/builder'

const nonce = 1
const nameTtl = 1
const clientTtl = 1
const amount = 0
const senderId = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688'
const recipientId = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688'
const name = 'test123test.chain'
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
const deposit = 0

const nameSalt = 4204563566073083
const commitmentId = commitmentHash(name, nameSalt)

describe('Native Transaction', function () {
  let aeSdkNative
  let aeSdk
  let oracleId
  let queryId

  before(async () => {
    aeSdk = await BaseAe({ nativeMode: false })
    aeSdkNative = await BaseAe()
    await spendPromise
    oracleId = `ok_${(await aeSdk.address()).slice(3)}`
  })

  it('Build tx using denomination amount', async () => {
    const params = { senderId, recipientId, nonce, payload: 'test' }
    const spendAe = await aeSdkNative.spendTx(
      { ...params, amount: 1, denomination: AE_AMOUNT_FORMATS.AE }
    )
    const spendAettos = await aeSdkNative.spendTx({ ...params, amount: 1e18, payload: 'test' })
    spendAe.should.be.equal(spendAettos)
    const { tx: { amount } } = unpackTx(spendAe)
    const { tx: { amount: amount2 } } = unpackTx(spendAettos)
    amount.should.be.equal(amount2)
  })

  it('native build of spend tx', async () => {
    const aeAmount = 2
    const params = { senderId, recipientId, nonce, payload: 'test' }
    const txFromAPI = 'tx_+F0MAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ChAeEyuPHdt6BOY7f6lkeaVLvFJaUxp/G8DOSSEhkDBn+wiBvBbWdOyAAAhg9e1n8oAAABhHRlc3QLK3OW'
    const nativeTx = await aeSdkNative.spendTx(
      { ...params, amount: aeAmount, denomination: AE_AMOUNT_FORMATS.AE }
    )
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of name pre-claim tx', async () => {
    const params = { accountId: senderId, nonce, commitmentId }
    const txFromAPI = 'tx_+E8hAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQOvDVCf43V7alNbsUvTarXaCf7rjtWX36YLS4+JTa4jn4YPHaUyOAAAxRZ6Sg=='
    const nativeTx = await aeSdkNative.namePreclaimTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of claim tx', async () => {
    const params = { accountId: senderId, nonce, name, nameSalt, nameFee }
    const txFromAPI = 'tx_+FEgAqEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABkXRlc3QxMjN0ZXN0LmNoYWluhw7wBz3KlPuJNjXJrcXeoAAAhg8m9WHIAABl9JBX'
    const nativeTx = await aeSdkNative.nameClaimTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of update tx', async () => {
    const params = { accountId: senderId, nonce, nameId, nameTtl, pointers, clientTtl }
    const nativeTx = await aeSdkNative.nameUpdateTx(params)
    const txFromAPI = 'tx_+IQiAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPAHy8Y5hY2NvdW50X3B1YmtleaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABhhAUch6gAADR52s+'
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of revoke tx', async () => {
    const params = { accountId: senderId, nonce, nameId }
    const txFromAPI = 'tx_+E8jAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPIYPHaUyOAAA94BVgw=='
    const nativeTx = await aeSdkNative.nameRevokeTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of transfer tx', async () => {
    const params = { accountId: senderId, nonce, nameId, recipientId }
    const txFromAPI = 'tx_+HEkAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPKEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7CGD7v4WsgAAL1d+NM='
    const nativeTx = await aeSdkNative.nameTransferTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  let contract
  it('native build of contract create tx', async () => {
    contract = await aeSdk.getContractInstance({ source: contractSource })
    await contract.compile()
    const params = {
      nonce,
      ownerId: await aeSdk.address(),
      code: contract.bytecode,
      deposit,
      amount,
      gasLimit: GAS_MAX,
      gasPrice: MIN_GAS_PRICE,
      callData: contract.calldata.encode('Identity', 'init', [])
    }
    const txFromAPI = {
      contractId: 'ct_TCQVoset7Y4qEyV5tgEAJAqa2Foz8J1EXqoGpq3fB6dWH5roe',
      tx: 'tx_+LAqAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBuGr4aEYDoKEijZbj/w2AeiWwAbldusME5pm3ZgPuomnZ3TbUbYgrwLg7nv5E1kQfADcANwAaDoI/AQM//oB4IJIANwEHBwEBAJgvAhFE1kQfEWluaXQRgHggkhlnZXRBcmeCLwCFNi4xLjAAgwcAA4ZHcyzkwAAAAACDGBf4hDuaygCHKxFE1kQfP+Jcll0='
    }
    const nativeTx = await aeSdkNative.contractCreateTx(params)

    txFromAPI.tx.should.be.equal(nativeTx.tx)
    txFromAPI.contractId.should.be.equal(nativeTx.contractId)
    contractId = txFromAPI.contractId
  })

  it('native build of contract call tx', async () => {
    const callData = contract.calldata.encode('Identity', 'getArg', [2])
    const owner = await aeSdk.address()

    const params = {
      nonce,
      callerId: owner,
      contractId,
      amount,
      gasLimit: GAS_MAX,
      gasPrice: MIN_GAS_PRICE,
      callData
    }
    const txFromAPI = 'tx_+GMrAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBoQU7e5ChtHAGM1Nh0MVEV74SbrYb1b5FQ3WBd7OBpwALyQOGpYvVcSgAAACDGBf4hDuaygCIKxGAeCCSGwQL3c3m'
    const nativeTx = await aeSdkNative.contractCallTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of oracle create tx', async () => {
    const accountId = await aeSdk.address()
    const params = { nonce, accountId, queryFormat, responseFormat, queryFee, oracleTtl }

    const txFromAPI = 'tx_+FAWAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBjXsnY2l0eSc6IHN0cn2Meyd0bXAnOiBudW19gnUwAIIB9IYPN7jqmAAAAGsRIcw='
    const nativeTx = await aeSdkNative.oracleRegisterTx(params)

    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of oracle extends tx', async () => {
    const callerId = await aeSdk.address()
    const params = { nonce, oracleId, callerId, oracleTtl }

    const txFromAPI = 'tx_8RkBoQTVzwhADpiCIvJutLAsj4kHdFdGchGm5tlV7bcHScajOwEAggH0hg6itfGYAADwE/X7'
    const nativeTx = await aeSdkNative.oracleExtendTx(params)

    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of oracle post query tx', async () => {
    const senderId = await aeSdk.address()

    const params = { nonce, oracleId, responseTtl, query, queryTtl, queryFee, senderId }

    const txFromAPI = 'tx_+GkXAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBoQTVzwhADpiCIvJutLAsj4kHdFdGchGm5tlV7bcHScajO5J7J2NpdHknOiAnQmVybGluJ32CdTAAZABkhg+bJBmGAAAtn7nr'
    const nativeTx = await aeSdkNative.oraclePostQueryTx(params)
    queryId = oracleQueryId(senderId, unpackTx(txFromAPI).tx.nonce, oracleId)

    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of oracle respond query tx', async () => {
    const callerId = await aeSdk.address()
    const params = { nonce, oracleId, callerId, responseTtl, queryId, response: queryResponse }

    const txFromAPI = 'tx_+F0YAaEE1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBoClgM30zCmbxGvUfzRbIZXGzOT8KCzYAUMRdnxbBX2Q9jHsndG1wJzogMTAxfQBkhg9jQvwmAADfRUs7'
    const nativeTx = await aeSdkNative.oracleRespondTx(params)
    txFromAPI.should.be.equal(nativeTx)
  })

  it('Get next account nonce', async () => {
    const accountId = await aeSdk.address()
    const { nonce: accountNonce } = await aeSdk.api.getAccountByPubkey(accountId)
      .catch(() => ({ nonce: 0 }))
    const nonce = await aeSdk.getAccountNonce(await aeSdk.address())
    nonce.should.be.equal(accountNonce + 1)
    const nonceCustom = await aeSdk.getAccountNonce(await aeSdk.address(), 1)
    nonceCustom.should.be.equal(1)
  })

  it('Destroy instance finishes without error', () => {
    aeSdk.destroyInstance()
  })
})
