/*
  Copyright 2018 Æternity Anstalt

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

/**
 * Wraps all AENS related endpoints of the Epoch HTTP API
 *
 * {@link https://github.com/aeternity/protocol/blob/master/AENS.md}
 *
 */
class AENS {

  constructor(epochClient) {
    this.client = epochClient
  }

  /**
   * Retrieves the commitment hash for the AENS pre-claim commitment
   *
   * @param name The name to be claimed. Must end with `.aet` or `.test`
   * @param salt An int64 value to be used as salt for the hashing function.
   *             The caller should make sure that the salt is random and can not
   *             be guessed by any miner.
   * @returns {Promise<string>}
   */
  async getCommitmentHash(name, salt) {
    let {data} = await this.client.get ('commitment-hash', {name, salt})
    return data.commitment
  }

  /**
   * Retrieves all public information about a claimed name
   *
   * @param name
   * @returns {Promise<*>}
   */
  async query(name) {
    try {
      let {data} = await this.client.get ('name', {name: name})
      return data
    } catch (e) {
      return ''
    }
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
   * @returns {Promise<*>}
   */
  async preClaim(commitment, fee) {
    let {data} = await this.client.post (
      'name-preclaim-tx',
      {commitment, fee},
      {internal: true})
    return data.commitment
  }

  /**
   * Claims a name on the blockchain that has previously been pre-claimed.
   *
   * @param name
   * @param salt the same salt as used for the pre-claim step
   * @param fee
   * @returns {Promise<*>} resolves the name as a hashed form
   */
  async claim(name, salt, fee) {
    let {data} = await this.client.post (
      'name-claim-tx',
      {name, 'name_salt': salt, fee},
      {internal: true})
    return data['name_hash']
  }

  /**
   * Points a name to an address. This address can be either an account or an
   * oracle
   *
   * @param target account or oracle address
   * @param nameHash
   * @param nameTtl
   * @param ttl
   * @param fee
   * @returns {Promise<*>}
   */
  async update(target, nameHash, nameTtl = 600000, ttl = 1, fee = 1) {
    let pointers
    if (target.startsWith ('ak')) {
      pointers = JSON.stringify ({'account_pubkey': target})
    } else if (target.startsWith ('ok')) {
      pointers = JSON.stringify ({'oracle_pubkey': target})
    } else {
      throw 'Target does not match account or oracle key'
    }

    let inputData = {
      'name_hash': nameHash,
      'name_ttl': nameTtl,
      ttl,
      fee,
      pointers
    }
    let {data} = await this.client.post ('name-update-tx', inputData, {internal: true})
    return data['name_hash']
  }

  /**
   * Transfer ownership of a name
   *
   * @param nameHash
   * @param recipient
   * @param fee
   * @returns {Promise<*>}
   */
  async transfer(nameHash, recipient, fee = 1) {
    let inputData = {'name_hash': nameHash, 'recipient_pubkey': recipient, fee}
    let {data} = await this.client.post (
      'name-transfer-tx', inputData, {internal: true})
    return data['name_hash']
  }

  /**
   * Revoke a name
   *
   * @param nameHash
   * @param fee
   * @returns {Promise<*>}
   */
  async revoke(nameHash, fee = 1) {
    let {data} = await this.client.post (
      'name-revoke-tx',
      {'name_hash': nameHash, fee},
      {internal: true})
    return data['name_hash']
  }

  /**
   * Executes the complete two-step process for claiming a name
   *
   * @param domain
   * @param preClaimFee
   * @param claimFee
   * @returns {Promise<*>}
   */
  async fullClaim(domain, preClaimFee, claimFee) {
    // get a random salt
    let salt = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER))
    // get a commitment hash
    let commitment = await this.getCommitmentHash(domain, salt)
    // preclaim the domain
    await this.preClaim(commitment, preClaimFee)
    // wait one block
    await this.client.base.waitNBlocks(1)
    // claim the domain
    let nameHash = await this.claim(domain, salt, claimFee)
    return nameHash
  }


}

module.exports = AENS