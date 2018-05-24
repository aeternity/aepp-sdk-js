/*
  ISC License (ISC)
  Copyright (c) 2018 aeternity developers

  Permission to use, copy, modify, and/or distribute this software for
  any purpose with or without fee is hereby granted, provided that the
  above copyright notice and this permission notice appear in all
  copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
  WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
  AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
  DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR
  PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
  TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.

*/

import { Crypto } from '../../../../'
import HttpService from './index'

/**
 * Wraps all AENS related services of the Epoch HTTP API
 *
 * {@link https://github.com/aeternity/protocol/blob/master/AENS.md}
 *
 */
class AENS extends HttpService {
  /**
   * Retrieves the commitment hash for the AENS pre-claim commitment
   *
   * @param name The name to be claimed. Must end with `.aet` or `.test`
   * @param salt An int64 value to be used as salt for the hashing function.
   *             The caller should make sure that the salt is random and can not
   *             be guessed by any miner.
   * @returns {Promise<string>}
   */
  async getCommitmentHash (name, salt) {
    const { commitment } = await this.client.ae.getCommitmentHash(name, salt)
    return commitment
  }

  /**
   * Retrieves all public information about a claimed name
   *
   * @param name
   * @returns {Promise<*>}
   */
  async getName (name) {
    return this.client.ae.getName(name)
  }

  /**
   * Pre-claims a name on the block-chain. This operation is the first step
   * of the two-step name claiming process which is completed by
   * {@link AENS#claim}. To protect claimers from malicious nodes stealing
   * claims, a name is represented by a hash of the name and a salt
   * {@link AENS#getCommitmentHash}.
   *
   * @param commitment
   * @param fee
   * @param options
   * @returns {Promise<*>}
   */
  async preClaim (commitment, fee, account, options = {}) {
    const { pub, priv } = account
    if (priv) {
      let payload = {
        'fee': fee,
        'commitment': commitment,
        'nonce': options && options.nonce,
        'account': pub
      }
      const data = await this.client.ae.postNamePreclaim(payload)
      await this.client.tx.sendSigned(data.tx, priv)
      return data
    } else {
      throw new Error('Private key must be set')
    }
  }

  /**
   * Claims a name on the blockchain that has previously been pre-claimed.
   *
   * @param name
   * @param salt the same salt as used for the pre-claim step
   * @param fee
   * @param options
   * @returns {Promise<*>} resolves the name as a hashed form
   */
  async claim (name, salt, fee, account, options = {}) {
    const { pub, priv } = account
    if (typeof priv !== 'undefined') {
      let payload = {
        'name_salt': salt,
        'fee': fee,
        'name': `nm$${Crypto.encodeBase58Check(Buffer.from(name))}`,
        'nonce': options && options.nonce,
        'account': pub
      }
      const data = await this.client.ae.postNameClaim(payload)
      let txHash = data.tx
      await this.client.tx.sendSigned(txHash, priv)
      return data
    } else {
      throw new Error('Private key must be set')
    }
  }

  /**
   * Points a name to an address. This address can be either an account or an
   * oracle
   *
   * @param target account or oracle address
   * @param nameHash
   * @param account
   * @param options
   * @returns {Promise<*>}
   */
  async update (target, nameHash, account, options = {}) {
    const { nameTtl = 600000, ttl = 1, fee = 1 } = options
    const { pub, priv } = account
    if (typeof priv !== 'undefined') {
      let pointers
      if (target.startsWith('ak')) {
        pointers = JSON.stringify({'account_pubkey': target})
      } else if (target.startsWith('ok')) {
        pointers = JSON.stringify({'oracle_pubkey': target})
      } else {
        throw new Error('Target does not match account or oracle key')
      }

      let inputData = {
        'name_hash': nameHash,
        'name_ttl': nameTtl,
        ttl,
        fee,
        pointers,
        account: pub
      }
      const data = await this.client.ae.postNameUpdate(inputData)
      await this.client.tx.sendSigned(data.tx, priv)
      return data
    } else {
      throw new Error('Private key must be set')
    }
  }

  /**
   * Transfer ownership of a name
   *
   * @param nameHash
   * @param recipient
   * @param fee
   * @param account
   * @param options
   * @returns {Promise<*>}
   */
  async transfer (nameHash, recipient, account, options = {}) {
    let {fee = 1} = options
    let {priv, pub} = account
    let payload = {'name_hash': nameHash, 'recipient_pubkey': recipient, fee}
    if (priv) {
      payload = {
        ...payload,
        nonce: options && options.nonce,
        account: pub
      }
      const data = await this.client.ae.postNameTransfer(payload)
      await this.client.tx.sendSigned(data.tx, priv)
      return data
    } else {
      throw new Error('Private key must be set')
    }
  }

  /**
   * Revoke a name
   *
   * @param nameHash
   * @param account
   * @param options
   * @returns {Promise<*>}
   */
  async revoke (nameHash, account, options = {}) {
    const { fee = 1 } = options
    const { pub, priv } = account
    let payload = {'name_hash': nameHash, fee}
    if (priv) {
      payload = {
        ...payload,
        nonce: options && options.nonce,
        account: pub
      }
      const data = await this.client.ae.postNameRevoke(payload)
      await this.client.tx.sendSigned(data.tx, priv)
      return data
    } else {
      throw new Error('Private key must be set')
    }
  }

  /**
   * Executes the complete two-step process for claiming a name
   *
   * @param domain
   * @param preClaimFee
   * @param claimFee
   * @param account
   * @param options
   * @returns {Promise<*>}
   */
  async fullClaim (domain, preClaimFee, claimFee, account, options = {}) {
    let salt = options && options.salt
    if (typeof salt === 'undefined') {
      salt = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER))
    }
    // get a commitment hash
    let commitment = await this.getCommitmentHash(domain, salt)
    // preclaim the domain
    let data = await this.preClaim(commitment, preClaimFee, account, options)

    // wait one block
    await this.client.tx.waitForTransaction(data['tx_hash'])
    // claim the domain
    return this.claim(domain, salt, claimFee, account, options)
  }
}

export default AENS
