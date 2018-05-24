#!/usr/bin/env node

const program = require('commander')
const aepp = require('@aeternity/aepp-sdk')
const RLP = require('rlp')

const OBJECT_TAGS = {
  SIGNED_TX: 11,
  CHANNEL_CREATE_TX: 50
}

function readInt(buf) {
  return buf.readIntBE(0, buf.length)
}

function readSignatures(buf) {
  const signatures = []

  for (let i = 0; i < buf.length; i++)
    signatures.push(aepp.Crypto.encodeBase58Check(buf[i]))

  return signatures
}

function deserializeObject(binary) {
  const obj = {
    tag: readInt(binary[0]),
    version: readInt(binary[1])
  }

  switch (obj.tag) {
    case OBJECT_TAGS.SIGNED_TX:
      return Object.assign(obj, {
        signatures: readSignatures(binary[2]),
        tx: deserializeObject(RLP.decode(binary[3]))
      })

    case OBJECT_TAGS.CHANNEL_CREATE_TX:
      return Object.assign(obj, {
        initiator: 'ak$' + aepp.Crypto.encodeBase58Check(binary[2]),
        initiatorAmount: readInt(binary[3]),
        responder: 'ak$' + aepp.Crypto.encodeBase58Check(binary[4]),
        responderAmount: readInt(binary[5]),
        channelReserve: readInt(binary[6]),
        lockPeriod: readInt(binary[7]),
        ttl: readInt(binary[8]),
        fee: readInt(binary[9]),
        nonce: readInt(binary[10])
      })
  }
}

function deserializeTx(tx) {
  return deserializeObject(aepp.Crypto.decodeTx(tx))
}

function unpackTx(tx) {
  const binaryTx = aepp.Crypto.decodeTx(tx)
  const deserializedTx = deserializeTx(tx)

  console.log(JSON.stringify(deserializedTx, undefined, 2))
}

program
  .usage('<tx>')
  .action(unpackTx)

program.parse(process.argv)
