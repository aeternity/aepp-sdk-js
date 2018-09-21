#!/usr/bin/env node
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

//  _   _
// | \ | |
// |  \| | __ _ _ __ ___   ___  ___
// | . ` |/ _` | '_ ` _ \ / _ \/ __|
// | |\  | (_| | | | | | |  __/\__ \
// |_| \_|\__,_|_| |_| |_|\___||___/

import {
  initClient,
  print,
  printError,
  getWalletByPathAndDecrypt
} from '../utils'

const updateNameStatus = (name) => async (client) => {
  try {
    return await client.api.getNameEntryByName(name)
  } catch (e) {
    if (e.response && e.response.status === 404)
      return {name, status: 'AVAILABLE'}
    throw e
  }
}

const isAvailable = (name) => name.status === 'AVAILABLE'

async function claim (domain, {host, ttl, nameTtl, internalUrl}) {
  try {
    const keypair = await getWalletByPathAndDecrypt()
    const client = await initClient(host, keypair, internalUrl)

    // Retrieve name
    const name = await updateNameStatus(domain)(client)
    if (!isAvailable(name)) {
      print('Domain not available')
      process.exit(1)
    }

    // Preclaim name before claim
    const {salt, height} = await client.aensPreclaim(domain, {nameTtl, ttl})
    print('Pre-Claimed')
    // Wait for next block and claim name
    await client.aensClaim(domain, salt, (height + 1), {nameTtl, ttl})
    print('Claimed')
    // Update name pointer
    const {nameHash} = await updateNameStatus(domain)(client)
    const {hash} = await client.aensUpdate(nameHash, await client.address(), {nameTtl, ttl})
    print('Updated')

    print(`Name ${domain} claimed`)
    print('Transaction hash -------> ' + hash)
  } catch (e) {
    printError(e.message)
  }
}

async function transferName (domain, address, {host, ttl, nameTtl, internalUrl}) {
  if (!address) {
    program.outputHelp()
    process.exit(1)
  }
  try {
    const keypair = await getWalletByPathAndDecrypt()
    const client = await initClient(host, keypair, internalUrl)

    // Retrieve name
    const name = await updateNameStatus(domain)(client)

    if (isAvailable(name)) {
      print(`Domain is available, nothing to transfer`)
      process.exit(1)
    }

    const transferTX = await client.aensTransfer(name.nameHash, address, {ttl, nameTtl})
    print('Transfer Success')
    print('Transaction hash -------> ' + transferTX.hash)
  } catch (e) {
    printError(e.message)
  }
}

async function updateName (domain, address, {host, ttl, nameTtl, internalUrl}) {
  if (!address) {
    program.outputHelp()
    process.exit(1)
  }

  try {
    const keypair = await getWalletByPathAndDecrypt()
    const client = await initClient(host, keypair, internalUrl)

    // Retrieve name
    const name = await updateNameStatus(domain)(client)
    if (isAvailable(name)) {
      print(`Domain is ${name.status} and cannot be transferred`)
      process.exit(1)
    }

    const updateNameTx = await client.aensUpdate(name.nameHash, address, {ttl, nameTtl})
    print('Update Success')
    print('Transaction Hash -------> ' + updateNameTx.hash)
  } catch (e) {
    printError(e.message)
  }
}

async function revokeName (domain, {host, ttl, nameTtl, internalUrl}) {
  try {
    const keypair = await getWalletByPathAndDecrypt()
    const client = await initClient(host, keypair, internalUrl)

    // Retrieve name
    const name = await updateNameStatus(domain)(client)

    if (isAvailable(name)) {
      print(`Domain is available, nothing to revoke`)
      process.exit(1)
    }

    const revokeTx = await client.aensRevoke(name.nameHash, {ttl, nameTtl})
    print('Revoke Success')
    print('Transaction hash -------> ' + revokeTx.hash)
  } catch (e) {
    printError(e.message)
  }
}

export const AENS = {
  revokeName,
  updateName,
  claim,
  transferName
}