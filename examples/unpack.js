#!/usr/bin/env node

const program = require('commander')
const aepp = require('@aeternity/aepp-sdk')
const RLP = require('rlp')

const OBJECT_TAGS = {
  SIGNED_TX: 11,
  CHANNEL_CREATE_TX: 50,
  CHANNEL_CLOSE_MUTUAL_TX: 53,
  CHANNEL_OFFCHAIN_TX: 57
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

function readOffChainTXUpdates(buf) {
  const updates = []

  for (let i = 0; i < buf.length; i++)
    updates.push([
      'ak$' + aepp.Crypto.encodeBase58Check(buf[i][0]),
      'ak$' + aepp.Crypto.encodeBase58Check(buf[i][1]),
      readInt(buf[i][2])
    ])

  return updates
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

    case OBJECT_TAGS.CHANNEL_CLOSE_MUTUAL_TX:
      return Object.assign(obj, {
        channelId: aepp.Crypto.encodeBase58Check(binary[2]),
        initiatorAmount: readInt(binary[3]),
        responderAmount: readInt(binary[4]),
        ttl: readInt(binary[5]),
        fee: readInt(binary[6]),
        nonce: readInt(binary[7])
      })

    case OBJECT_TAGS.CHANNEL_OFFCHAIN_TX:
      return Object.assign(obj, {
        channelId: aepp.Crypto.encodeBase58Check(binary[2]),
        previousRound: readInt(binary[3]),
        round: readInt(binary[4]),
        initiator: 'ak$' + aepp.Crypto.encodeBase58Check(binary[5]),
        responder: 'ak$' + aepp.Crypto.encodeBase58Check(binary[6]),
        initiatorAmount: readInt(binary[7]),
        responderAmount: readInt(binary[8]),
        updates: readOffChainTXUpdates(binary[9]),
        state: aepp.Crypto.encodeBase58Check(binary[10])
      })
  }
}

function unpackTx(tx) {
  const binaryTx = aepp.Crypto.decodeTx(tx)
  const deserializedTx = deserializeObject(binaryTx)

  console.log(JSON.stringify(deserializedTx, undefined, 2))
}

program
  .usage('<tx>')
  .action(unpackTx)

program.parse(process.argv)
