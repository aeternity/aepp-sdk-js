import {
  decodeTx,
  encodeBase58Check,
  decode,
  encode,
  verify,
  decodeBase58Check,
  assertedType
} from '../utils/crypto'
import Universal from '../ae/universal'
import { BigNumber } from 'bignumber.js'

const url = 'https://sdk-mainnet.aepps.com'
const internalUrl = 'https://sdk-mainnet.aepps.com'
const NETWORK_ID = 'ae_mainnet'

const FIELD_TYPES = {
  int: 'int',
  binary: 'binary',
  id: 'id'
}
const TX_FIELD = (name, type) => [name, type]
const SPEND_TX = [
  TX_FIELD('tag', FIELD_TYPES.int),
  TX_FIELD('VSN', FIELD_TYPES.int),
  TX_FIELD('senderId', FIELD_TYPES.id),
  TX_FIELD('recipientId', FIELD_TYPES.id),
  TX_FIELD('amount', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('payload', FIELD_TYPES.binary)
]

function readInt (buf) {
  // return buf.readIntBE(0, buf.length)
  return BigNumber(buf.toString('hex'), 16).toString(10)
}

function readId (buf) {
  const type = buf.readUIntBE(0, 1)
  const prefix = {
    1: 'ak',
    2: 'nm',
    3: 'cm',
    4: 'ok',
    5: 'ct',
    6: 'ch'
  }[type]
  const hash = encodeBase58Check(buf.slice(1, buf.length))
  return `${prefix}_${hash}`
}

// Unpack staff
export function unpackTx (tx) {
  const decodedTx = decodeTx(tx)
  const objId = decodedTx[0]

  if (objId.toString() === Buffer.from([11]).toString()) {
    const [objId, vsn, signature, data] = decodedTx
    const rawTx = decode(data)
    return { txObject: buildTxObject(rawTx), signature, encodedTx: data }
  }
  return { txObject: buildTxObject(decodedTx), encodedTx: encode(decodedTx) }
}

function buildTxObject (rawTx) {
  return SPEND_TX.reduce((acc, [key, type], i) => {
    const value = rawTx[i]
    return { ...acc, [key]: deserializeField(value, type) }
  }, {})
}

export async function verifyTx ({ txObject, signature, encodedTx }) {
  return signature
    ? {
      ErrSignatureVerfication: validateSignature(encodedTx, signature[0], txObject.senderId),
      ...(await validateBase(txObject, encodedTx))
    }
    : validateBase(txObject, encodedTx)
}

// -------------------

// Verify signature
function validateSignature (data, sig, pub, networkId = NETWORK_ID) {
  const txWithNetworkId = Buffer.concat([Buffer.from(networkId), data])
  return verify(txWithNetworkId, sig, decodeBase58Check(assertedType(pub, 'ak')))
}

async function validateBase (txObject, encodedTx) {
  const epoch = await Universal({ url, internalUrl })
  const { ttl, nonce, amount, fee, senderId: accountId } = txObject

  const minFee = 15000 + 20 * (encodedTx.length - 2) // -2 is 2 bytes for 20000 fee
  const height = await epoch.height()
  const balance = await epoch.balance(accountId, { format: false })
  const { nonce: accountNonce } = await epoch.api.getAccountByPubkey(accountId)

  return {
    ErrInsufficientFee: minFee <= +fee ? true : fee,
    ErrExpiredTTL: +ttl !== 0 ? (height < +ttl ? true : height) : true,
    ErrInsufficientBalanceForAmountFee: BigNumber(balance).gt(BigNumber(amount).plus(+fee)) ? true : balance,
    ErrInsufficientBalanceForAmount: BigNumber(balance).gt(BigNumber(amount)) ? true : balance,
    ErrNonceUsed: +accountNonce <= (+nonce) ? true : (+accountNonce + 1),
    WarnNonceHigh: +nonce > (+accountNonce + 1) ? (+accountNonce + 1) : true
  }
}

function deserializeField (value, type) {
  switch (type) {
    case FIELD_TYPES.int:
      return readInt(value)
    case FIELD_TYPES.id:
      return readId(value)
    case FIELD_TYPES.binary:
      return value.toString()
  }
}
