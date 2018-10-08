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

/*  _   _
 * | \ | |
 * |  \| | __ _ _ __ ___   ___  ___
 * | . ` |/ _` | '_ ` _ \ / _ \/ __|
 * | |\  | (_| | | | | | |  __/\__ \
 * |_| \_|\__,_|_| |_| |_|\___||___/
 */

import * as R from 'ramda'

import { initClientByWalletFile } from '../utils/cli'
import { printError, print, printUnderscored } from '../utils/print'
import { handleApiError } from '../utils/errors'

// #Name helpers methods

// Get `name` status
const updateNameStatus = (name) => async (client) => {
  try {
    return await client.api.getNameEntryByName(name)
  } catch (e) {
    if (e.response && e.response.status === 404) { return { name, status: 'AVAILABLE' } }
    throw e
  }
}

// Check if `name` is `AVAILABLE`
const isAvailable = (name) => name.status === 'AVAILABLE'

// Validate `name`
const validateName = (name) => {
  if (R.last(name.split('.')) !== 'aet') { throw new Error('AENS TLDs must end in .aet') }
}

// #Claim `name` function
async function claim (walletPath, domain, options) {
  // Parse options(`ttl`, `nameTtl` and account `password`)
  const ttl = parseInt(options.ttl)
  const nameTtl = parseInt(options.nameTtl)
  try {
    // Validate `name`(check if `name` end on `.aet`)
    validateName(domain)

    // Get `keyPair` by `walletPath`, decrypt using password and initialize `Ae` client with this `keyPair`
    const client = await initClientByWalletFile(walletPath, options)

    await handleApiError(async () => {
      // Check if that `name' available
      const name = await updateNameStatus(domain)(client)
      if (!isAvailable(name)) {
        print('Domain not available')
        process.exit(1)
      }

      // Create `preclaimName` transaction
      const { salt, height } = await client.aensPreclaim(domain, { nameTtl, ttl })
      print('Pre-Claimed')

      // Wait for next block and create `claimName` transaction
      await client.aensClaim(domain, salt, (height + 1), { nameTtl, ttl })
      print('Claimed')

      // Update `name` pointer
      const { id } = await updateNameStatus(domain)(client)
      const { hash } = await client.aensUpdate(id, await client.address(), { nameTtl, ttl })
      print('Updated')

      print(`Name ${domain} claimed`)
      printUnderscored('Transaction hash', hash)
    })
  } catch (e) {
    printError(e.message)
  }
}

// #Transfer `name` function
async function transferName (walletPath, domain, address, options) {
  // Parse options(`ttl`, `nameTtl` and account `password`)
  const ttl = parseInt(options.ttl)
  const nameTtl = parseInt(options.nameTtl)

  if (!address) {
    program.outputHelp()
    process.exit(1)
  }
  try {
    // Get `keyPair` by `walletPath`, decrypt using password and initialize `Ae` client with this `keyPair`
    const client = await initClientByWalletFile(walletPath, options)

    await handleApiError(async () => {
      // Check if that `name` is unavailable and we can transfer it
      const name = await updateNameStatus(domain)(client)
      if (isAvailable(name)) {
        print(`Domain is available, nothing to transfer`)
        process.exit(1)
      }

      // Create `transferName` transaction
      const transferTX = await client.aensTransfer(name.id, address, { ttl, nameTtl })
      print('Transfer Success')
      printUnderscored('Transaction hash', transferTX.hash)
    })
  } catch (e) {
    printError(e.message)
  }
}

// #Update `name` function
async function updateName (walletPath, domain, address, options) {
  // Parse options(`ttl`, `nameTtl` and account `password`)
  const ttl = parseInt(options.ttl)
  const nameTtl = parseInt(options.nameTtl)

  if (!address) {
    program.outputHelp()
    process.exit(1)
  }

  try {
    // Get `keyPair` by `walletPath`, decrypt using password and initialize `Ae` client with this `keyPair`
    const client = await initClientByWalletFile(walletPath, options)

    await handleApiError(async () => {
      // Check if that `name` is unavailable and we can update it
      const name = await updateNameStatus(domain)(client)
      if (isAvailable(name)) {
        print(`Domain is ${name.status} and cannot be transferred`)
        process.exit(1)
      }

      // Create `updateName` transaction
      const updateNameTx = await client.aensUpdate(name.id, address, { ttl, nameTtl })
      print('Update Success')
      printUnderscored('Transaction Hash', updateNameTx.hash)
    })
  } catch (e) {
    printError(e.message)
  }
}

// #Revoke `name` function
async function revokeName (walletPath, domain, options) {
  // Parse options(`ttl` and account `password`)
  const ttl = parseInt(options.ttl)

  try {
    // Get `keyPair` by `walletPath`, decrypt using password and initialize `Ae` client with this `keyPair`
    const client = await initClientByWalletFile(walletPath, options)

    await handleApiError(async () => {
      // Check if `name` is unavailable and we can revoke it
      const name = await updateNameStatus(domain)(client)
      if (isAvailable(name)) {
        print(`Domain is available, nothing to revoke`)
        process.exit(1)
      }

      // Create `revokeName` transaction
      const revokeTx = await client.aensRevoke(name.id, { ttl })
      print('Revoke Success')
      printUnderscored('Transaction hash', revokeTx.hash)
    })
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
