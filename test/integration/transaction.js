/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
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
import { expect } from 'chai'
import { BaseAe, spendPromise, publicKey } from './index'
import { commitmentHash, oracleQueryId, decode, encode } from '../../src/tx/builder/helpers'
import { GAS_MAX } from '../../src/tx/builder/schema'
import { AE_AMOUNT_FORMATS } from '../../src/utils/amount-formatter'

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

// Name
const nameSalt = 4204563566073083
const commitmentId = commitmentHash(name, nameSalt)

describe('Transaction', function () {
  let aeSdk
  const address = publicKey
  const oracleId = encode(decode(address, 'ak'), 'ok')
  let contract

  before(async () => {
    aeSdk = await BaseAe()
    await spendPromise
    contract = await aeSdk.getContractInstance({ source: contractSource })
  })

  it('build spend tx using denomination amount', async () => {
    const params = { senderId, recipientId, nonce, payload: 'test' }
    const spendAe = await aeSdk.spendTx(
      { ...params, amount: 1, denomination: AE_AMOUNT_FORMATS.AE }
    )
    const spendAettos = await aeSdk.spendTx({ ...params, amount: 1e18, payload: 'test' })
    spendAe.should.be.equal(spendAettos)
  })

  const contractId = 'ct_TCQVoset7Y4qEyV5tgEAJAqa2Foz8J1EXqoGpq3fB6dWH5roe';
  [[
    'spend',
    'tx_+F0MAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ChAeEyuPHdt6BOY7f6lkeaVLvFJaUxp/G8DOSSEhkDBn+wiBvBbWdOyAAAhg9e1n8oAAABhHRlc3QLK3OW',
    () => aeSdk.spendTx({
      senderId, recipientId, nonce, payload: 'test', amount: 2, denomination: AE_AMOUNT_FORMATS.AE
    })
  ], [
    'name pre-claim',
    'tx_+E8hAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQOvDVCf43V7alNbsUvTarXaCf7rjtWX36YLS4+JTa4jn4YPHaUyOAAAxRZ6Sg==',
    () => aeSdk.namePreclaimTx({ accountId: senderId, nonce, commitmentId })
  ], [
    'name claim',
    'tx_+FEgAqEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABkXRlc3QxMjN0ZXN0LmNoYWluhw7wBz3KlPuJNjXJrcXeoAAAhg8m9WHIAABl9JBX',
    () => aeSdk.nameClaimTx({ accountId: senderId, nonce, name, nameSalt, nameFee })
  ], [
    'name update',
    'tx_+IQiAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPAHy8Y5hY2NvdW50X3B1YmtleaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABhhAUch6gAADR52s+',
    () => aeSdk.nameUpdateTx({ accountId: senderId, nonce, nameId, nameTtl, pointers, clientTtl })
  ], [
    'name revoke',
    'tx_+E8jAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPIYPHaUyOAAA94BVgw==',
    () => aeSdk.nameRevokeTx({ accountId: senderId, nonce, nameId })
  ], [
    'name transfer',
    'tx_+HEkAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPKEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7CGD7v4WsgAAL1d+NM=',
    () => aeSdk.nameTransferTx({ accountId: senderId, nonce, nameId, recipientId })
  ], [
    'contract create',
    'tx_+LAqAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBuGr4aEYDoKEijZbj/w2AeiWwAbldusME5pm3ZgPuomnZ3TbUbYgrwLg7nv5E1kQfADcANwAaDoI/AQM//oB4IJIANwEHBwEBAJgvAhFE1kQfEWluaXQRgHggkhlnZXRBcmeCLwCFNi4xLjAAgwcAA4ZHcyzkwAAAAACDGBf4hDuaygCHKxFE1kQfP+Jcll0=',
    async () => {
      const nativeTx = await aeSdk.contractCreateTx({
        nonce,
        ownerId: address,
        code: await contract.compile(),
        amount,
        gasLimit: GAS_MAX,
        callData: contract.calldata.encode('Identity', 'init', [])
      })
      expect(nativeTx.contractId).to.be.equal(contractId)
      return nativeTx.tx
    }
  ], [
    'contract call',
    'tx_+GMrAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBoQU7e5ChtHAGM1Nh0MVEV74SbrYb1b5FQ3WBd7OBpwALyQOGpYvVcSgAAACDGBf4hDuaygCIKxGAeCCSGwQL3c3m',
    () => aeSdk.contractCallTx({
      nonce,
      callerId: address,
      contractId,
      amount,
      gasLimit: GAS_MAX,
      callData: contract.calldata.encode('Identity', 'getArg', [2])
    })
  ], [
    'oracle register',
    'tx_+FAWAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBjXsnY2l0eSc6IHN0cn2Meyd0bXAnOiBudW19gnUwAIIB9IYPN7jqmAAAAGsRIcw=',
    () => aeSdk.oracleRegisterTx({
      nonce, accountId: address, queryFormat, responseFormat, queryFee, oracleTtl
    })
  ], [
    'oracle extend',
    'tx_8RkBoQTVzwhADpiCIvJutLAsj4kHdFdGchGm5tlV7bcHScajOwEAggH0hg6itfGYAADwE/X7',
    () => aeSdk.oracleExtendTx({ nonce, oracleId, callerId: address, oracleTtl })
  ], [
    'oracle post query',
    'tx_+GkXAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBoQTVzwhADpiCIvJutLAsj4kHdFdGchGm5tlV7bcHScajO5J7J2NpdHknOiAnQmVybGluJ32CdTAAZABkhg+bJBmGAAAtn7nr',
    () => aeSdk.oraclePostQueryTx({
      nonce, oracleId, responseTtl, query, queryTtl, queryFee, senderId: address
    })
  ], [
    'oracle respond query',
    'tx_+F0YAaEE1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBoClgM30zCmbxGvUfzRbIZXGzOT8KCzYAUMRdnxbBX2Q9jHsndG1wJzogMTAxfQBkhg9jQvwmAADfRUs7',
    () => aeSdk.oracleRespondTx({
      nonce,
      oracleId,
      callerId: address,
      responseTtl,
      queryId: oracleQueryId(address, nonce, oracleId),
      response: queryResponse
    })
  ]].forEach(([name, expected, getter]) =>
    it(`build of ${name} transaction`, async () => {
      expect(await getter()).to.be.equal(expected)
    }))

  it('Get next account nonce', async () => {
    const { nonce: accountNonce } = await aeSdk.api.getAccountByPubkey(address)
    expect(await aeSdk.getAccountNonce(address)).to.be.equal(accountNonce + 1)
    expect(await aeSdk.getAccountNonce(address, 1)).to.be.equal(1)
  })

  it('Destroy instance finishes without error', () => {
    aeSdk.destroyInstance()
  })
})
