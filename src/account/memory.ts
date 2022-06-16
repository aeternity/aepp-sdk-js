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
import AccountBase from './base'
import { sign, isValidKeypair } from '../utils/crypto'
import { isHex } from '../utils/string'
import { decode } from '../tx/builder/helpers'
import { InvalidKeypairError, MissingParamError } from '../utils/errors'
import { EncodedData } from '../utils/encoder'

const secrets = new WeakMap()

export interface Keypair {
  publicKey: EncodedData<'ak'>
  secretKey: string | Uint8Array
}

/**
 * In-memory account stamp
 */
export default class AccountMemory extends AccountBase {
  isGa: boolean

  /**
   * @param options - Options
   * @param options.keypair - Key pair to use
   * @param options.keypair.publicKey - Public key
   * @param options.keypair.secretKey - Private key
   * @param options.gaId - Address of generalized account
   */
  constructor (
    { keypair, gaId, ...options }: { keypair?: Keypair, gaId?: EncodedData<'ak'> } & ConstructorParameters<typeof AccountBase>[0]
  ) {
    super(options)

    this.isGa = gaId != null
    if (this.isGa && gaId != null) {
      decode(gaId)
      secrets.set(this, { publicKey: gaId })
      return
    }

    if (keypair == null) throw new MissingParamError('Either gaId or keypair is required')

    if (
      !Buffer.isBuffer(keypair.secretKey) &&
      typeof keypair.secretKey === 'string' && !isHex(keypair.secretKey)
    ) throw new InvalidKeypairError('Secret key must be hex string or Buffer')
    const secretKey = typeof keypair.secretKey === 'string'
      ? Buffer.from(keypair.secretKey, 'hex')
      : keypair.secretKey
    if (!isValidKeypair(secretKey, decode(keypair.publicKey))) {
      throw new InvalidKeypairError('Invalid Key Pair')
    }

    secrets.set(this, {
      secretKey,
      publicKey: keypair.publicKey
    })
  }

  async sign (data: string | Uint8Array): Promise<Uint8Array> {
    if (this.isGa) throw new InvalidKeypairError('You are trying to sign data using generalized account without keypair')
    return sign(data, secrets.get(this).secretKey)
  }

  async address (): Promise<EncodedData<'ak'>> {
    return secrets.get(this).publicKey
  }
}
