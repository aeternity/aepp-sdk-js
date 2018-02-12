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

/*
 * Wraps all AENS related endpoints of the Epoch HTTP API
 */
class AENS {

  constructor(epochClient) {
    this.client = epochClient
  }

  async getCommitmentHash(name, salt) {
    let {data} = await this.client.get ('commitment-hash', {name, salt})
    return data.commitment
  }

  async query(name) {
    try {
      let {data} = await this.client.get ('name', {name: name})
      return data
    } catch (e) {
      return ''
    }
  }

  async preClaim(commitment, fee) {
    let {data} = await this.client.post (
      'name-preclaim-tx',
      {commitment, fee},
      {internal: true})
    return data.commitment
  }

  async claim(name, salt, fee) {
    let {data} = await this.client.post (
      'name-claim-tx',
      {name, 'name_salt': salt, fee},
      {internal: true})
    return data['name_hash']
  }

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

  async transfer(nameHash, recipient, fee = 1) {
    let inputData = {'name_hash': nameHash, 'recipient_pubkey': recipient, fee}
    let {data} = await this.client.post (
      'name-transfer-tx', inputData, {internal: true})
    return data['name_hash']
  }

  async revoke(nameHash, fee = 1) {
    let {data} = await this.client.post (
      'name-revoke-tx',
      {'name_hash': nameHash, fee},
      {internal: true})
    return data['name_hash']
  }

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