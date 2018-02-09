/*
  Æternity Naming System interface
  Author: Till Kolter
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


const sha256 = require('sha256')


// const _commitment = (name, nameSalt) => {
//   Hash(NameHash(name) + name_salt)
// }

const _nameHash = (name) => {
  if (!name) {
    return padLeft('', 32)
  } else {
    let firstColon = name.indexOf('.')
    let label = name.substr(0,firstColon)
    let remainder = name.substr(firstColon + 1)
    return sha256(_nameHash(remainder) + sha256(label))
  }
}

const getCommitmentHash = async (client, name, salt) => {
  let {data} = await client.get('commitment-hash', {name, salt})
  return data.commitment
}

const query = async (client, name) => {
  try {
    let {data} = await client.get('name', {name: name})
    return data
  } catch (e) {
    return ''
  }
}

const preClaim = async (client, commitment, fee) => {
  let config = {headers: {'Content-Type': 'application/json'}}
  let {data} = await client.post('name-preclaim-tx', {commitment, fee}, config)
  return data.commitment
}

const claim = async (client, name, salt, fee) => {
  let {data} = await client.post('name-claim-tx', {name, 'name_salt': salt, fee})
  return data['name_hash']
}

const update = async (client, target, nameHash, nameTtl = 600000, ttl = 1, fee = 1) => {
  let pointers
  if (target.startsWith('ak')) {
    pointers = JSON.stringify({'account_key': target})
  } else if (target.startsWith('ok')) {
    pointers = JSON.stringify({'oracle_pubkey': target})
  } else {
    throw 'Target does not match account or oracle key'
  }

  let {data} = await client.post('name-update-tx', {'name_hash': nameHash, 'name_ttl': nameTtl, ttl, fee, pointers})
  return data['name_hash']
}

const transfer = async (client, nameHash, recipient, fee = 1) => {
  let {data} = await client.post('name-transfer-tx', {'name_hash': nameHash, 'recipient_pubkey': recipient, fee})
  return data['name_hash']
}

const revoke = async (client, nameHash, fee = 1) => {
  let {data} = await client.post('name-revoke-tx', {'name_hash': nameHash, fee})
  return data['name_hash']
}

module.exports = {
  getCommitmentHash,
  query,
  preClaim,
  claim,
  update,
  transfer,
  revoke
}
