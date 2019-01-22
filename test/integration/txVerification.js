import { describe, it } from 'mocha'
import { verifyTx } from '../../es/tx/validator'
import { configure } from '.'
import { buildRawTx, buildTx, unpackTx } from '../../es/tx/tx_builder'
import { encodeTx } from '../../es/utils/crypto'
import { TX_TYPE } from '../../es/tx/schema'

const signedTx = 'tx_+JcLAfhCuEC7Fwdj1SRQbmPj+l5wh3piyyd10AxKVLQWs/Jvx6UJN+2HkE+K5OXlpq3jqTCzMR0v7p3XdgiUWibwRQjz5mYHuE/4TQwBoQErhur1eJn/RBV05rwez1XXy/p0Zlghrxdc1gWlCHrKrqEBHxOjsIvwAUAGYqaLadh194A87EwIZH9u1dhMeJe9UKMKgk4gAAOAy9r6gQ=='
const notSIgnedTx = 'tx_+E0MAaEBK4bq9XiZ/0QVdOa8Hs9V18v6dGZYIa8XXNYFpQh6yq6hAR8To7CL8AFABmKmi2nYdfeAPOxMCGR/btXYTHiXvVCjCoJOIAADgFcJyZ8='

const wrongNonce = 'tx_+E0MAaEBK4bq9XiZ/0QVdOa8Hs9V18v6dGZYIa8XXNYFpQh6yq6hAR8To7CL8AFABmKmi2nYdfeAPOxMCGR/btXYTHiXvVCjCoJOIAABgL6cZFo='
const wrongNonceSigned = 'tx_+JcLAfhCuEBNJFiUWl6JqGyWfWfLAqZBBxYjCZ6xtPyBBH+GxqinRsh5ihh32R0r3tBKJbVLgZL3/KGmgAKZiOP5x7qw68IAuE/4TQwBoQErhur1eJn/RBV05rwez1XXy/p0Zlghrxdc1gWlCHrKrqEBHxOjsIvwAUAGYqaLadh194A87EwIZH9u1dhMeJe9UKMKgk4gAAGAg6YBPw=='

const wrongTtl = 'tx_+E8MAaEBK4bq9XiZ/0QVdOa8Hs9V18v6dGZYIa8XXNYFpQh6yq6hAR8To7CL8AFABmKmi2nYdfeAPOxMCGR/btXYTHiXvVCjCoJOIIJb0QOAwBDHLA=='
const wrongTtlSigned = 'tx_+JkLAfhCuECAwe+YUav8kp5FfDx9UPb/Jyo7Do5ST8TC33qdnyuutNqtNB0czfDFsqCX1xuY9foGw1kmiT4s5kWxeoymAWQLuFH4TwwBoQErhur1eJn/RBV05rwez1XXy/p0Zlghrxdc1gWlCHrKrqEBHxOjsIvwAUAGYqaLadh194A87EwIZH9u1dhMeJe9UKMKgk4gglvRA4BJC++8'

const insufficientFunds = 'tx_+FYMAaEBK4bq9XiZ/0QVdOa8Hs9V18v6dGZYIa8XXNYFpQh6yq6hAR8To7CL8AFABmKmi2nYdfeAPOxMCGR/btXYTHiXvVCjiQEkLwajNzk404JOIAADgI/LEbc='
const insufficientFundsSigned = 'tx_+KALAfhCuEAqViws7fNwWejZkVjet3NqOlb3vufsB2EwALrgS7pASl4c6taG7fJAPHBBiFvQ3JWwiPqTSKUfmDtMBM+aeIQOuFj4VgwBoQErhur1eJn/RBV05rwez1XXy/p0Zlghrxdc1gWlCHrKrqEBHxOjsIvwAUAGYqaLadh194A87EwIZH9u1dhMeJe9UKOJASQvBqM3OTjTgk4gAAOAo3qFhw=='

const ErrInsufficientBalanceForAmountFee = 'tx_+FYMAaEBK4bq9XiZ/0QVdOa8Hs9V18v6dGZYIa8XXNYFpQh6yq6hAR8To7CL8AFABmKmi2nYdfeAPOxMCGR/btXYTHiXvVCjiQEWTk/vj9U064JOIAADgEPSsps='
const ErrInsufficientBalanceForAmountFeeSigned = 'tx_+KALAfhCuEBdQA6ncxYmigV8Oh4FXFdHQK6s5GU+2MIJamVOiShbf7alrjYl8k9sgPBvHwUVfOEWIHRstqvU6EUEQcAaHlIEuFj4VgwBoQErhur1eJn/RBV05rwez1XXy/p0Zlghrxdc1gWlCHrKrqEBHxOjsIvwAUAGYqaLadh194A87EwIZH9u1dhMeJe9UKOJARZOT++P1TTrgk4gAAOAFwK2og=='

const invalidSignature = 'tx_+JcLAfhCuEAYzU9Pb1qnsEcimr5FhabQaKX0izfWYjR20WZus4PUvHYF2LOuOqx2srhg8NQ41kh+Hnp/nUETf3C/8/SMKmEJuE/4TQwBoQErhur1eJn/RBV05rwez1XXy/p0Zlghrxdc1gWlCHrKrqEBHxOjsIvwAUAGYqaLadh194A87EwIZH9u1dhMeJe9UKMKgk4gAAOAI0NCNg=='
const invalidSignature2 = 'tx_+KALAfhCuEBTBBApRxrRlTWGO0uJaIl5KuskBs034w76KzJCwlPMU4yS7cfq/2QDFlne6NOGuxT+MjP5d4cfJ6Kg54mhUwgJuFj4VgwBoQErhur1eJn/RBV05rwez1XXy/p0Zlghrxdc1gWlCHrKrqEBHxOjsIvwAUAGYqaLadh194A87EwIZH9u1dhMeJe9UKOJARZOT++P1TTrgk4gAAOAdIOwmw=='

const params = {
  tag: '12',
  VSN: '1',
  senderId: 'ak_LAqgfAAjAbpt4hhyrAfHyVg9xfVQWsk1kaHaii6fYXt6AJAGe',
  recipientId: 'ak_Egp9yVdpxmvAfQ7vsXGvpnyfNq71msbdUpkMNYGTeTe8kPL3v',
  amount: '10',
  fee: '20000',
  ttl: '0',
  nonce: '3',
  payload: ''
}
describe('Verify TransACTION', function () {
  configure(this)
  it('valid tx', async () => {
    const unpacked = unpackTx(signedTx)
    console.log(unpacked.tx)

    // console.log(buildTx(params, TX_TYPE.spend))
  })
  it('valid signed tx', async () => {
    const unpacked = unpackTx(signedTx)
    console.log(await verifyTx(unpacked))
  })

  it('wrong nonce tx', async () => {
    const unpacked = unpackTx(wrongNonce)
    console.log(await verifyTx(unpacked))
  })
  it('wrong nonce signed tx', async () => {
    const unpacked = unpackTx(wrongNonceSigned)
    console.log(await verifyTx(unpacked))
  })

  it('wrong ttl tx', async () => {
    const unpacked = unpackTx(wrongTtl)
    console.log(await verifyTx(unpacked))
  })
  it('wrong ttl signed tx', async () => {
    const unpacked = unpackTx(wrongTtlSigned)
    console.log(await verifyTx(unpacked))
  })

  it('not enough balance tx', async () => {
    const unpacked = unpackTx(insufficientFunds)
    console.log(await verifyTx(unpacked))
  })
  it('not enough balance signed tx', async () => {
    const unpacked = unpackTx(insufficientFundsSigned)
    console.log(await verifyTx(unpacked))
  })

  it('not enough balance tx(amount + fee)', async () => {
    const unpacked = unpackTx(ErrInsufficientBalanceForAmountFee)
    console.log(await verifyTx(unpacked))
  })
  it('not enough balance signed tx(amount + fee)', async () => {
    const unpacked = unpackTx(ErrInsufficientBalanceForAmountFeeSigned)
    console.log(await verifyTx(unpacked))
  })

  it('invalid signature tx', async () => {
    const unpacked = unpackTx(invalidSignature)
    console.log(await verifyTx(unpacked))
  })
  it('invalid signature tx 2', async () => {
    const unpacked = unpackTx(invalidSignature2)
    console.log(await verifyTx(unpacked))
  })
})
