/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

import nacl from 'tweetnacl'
import { full as hmac } from 'tweetnacl-auth'
import { fromString } from 'bip32-path'

const ED25519_CURVE = Buffer.from('ed25519 seed')
const HARDENED_OFFSET = 0x80000000

export function getMasterKeyFromSeed (seed) {
  const I = hmac(seed, ED25519_CURVE)
  const IL = I.slice(0, 32)
  const IR = I.slice(32)
  return {
    privateKey: IL,
    chainCode: IR
  }
}

export function deriveChild ({ privateKey, chainCode }, index) {
  if (index < HARDENED_OFFSET) {
    throw new Error(`Child index #${index} is not supported`)
  }
  const indexBuffer = Buffer.allocUnsafe(4)
  indexBuffer.writeUInt32BE(index, 0)

  const data = Buffer.concat([Buffer.alloc(1, 0), privateKey, indexBuffer])

  const I = hmac(data, chainCode)
  const IL = I.slice(0, 32)
  const IR = I.slice(32)
  return {
    privateKey: IL,
    chainCode: IR
  }
}

export function getKeyPair (privateKey) {
  return nacl.sign.keyPair.fromSeed(privateKey)
}

export function derivePathFromKey (path, key) {
  const segments = path === '' ? [] : fromString(path).toPathArray()
  segments.forEach((segment, i) => {
    if (segment < HARDENED_OFFSET) {
      throw new Error(`Segment #${i + 1} is not hardened`)
    }
  })

  return segments.reduce((parentKey, segment) => deriveChild(parentKey, segment), key)
}

export function derivePathFromSeed (path, seed) {
  if (!['m', 'm/'].includes(path.slice(0, 2))) {
    throw new Error('Invalid path')
  }
  const masterKey = getMasterKeyFromSeed(seed)
  return derivePathFromKey(path.slice(2), masterKey)
}
