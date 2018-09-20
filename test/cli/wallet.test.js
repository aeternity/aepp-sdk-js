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

import fs from 'fs'
import {before, describe, it} from 'mocha'

import {configure, plan, ready, execute, parseBlock, BaseAe, KEY_PAIR} from './index'
import {generateKeyPair} from '../../es/utils/crypto'

const walletName = 'test.wallet'

plan(1000000000)

describe.skip('CLI Wallet Module', function () {
  configure(this)

  let wallet

  before(async function () {
    // Spend tokens for wallet
    // wallet = await ready(this)

    // TODO create wallet by ready function
    // Create wallet files for CLI
    // await execute(['wallet', walletName, '--password', 'test', 'save', KEY_PAIR.priv])
  })
  after(function () {
    // Remove wallet files
    fs.unlinkSync(walletName)
    fs.unlinkSync(`${walletName}.pub`)
  })

  it('Create Wallet', async () => {
    // create wallet
    await execute(['wallet', walletName, 'create', '--password', 'test'])

    // check for wallet files
    fs.existsSync(walletName).should.equal(true)
    fs.existsSync(`${walletName}.pub`).should.equal(true)

    // check if wallet files valid
    parseBlock(await execute(['wallet', walletName, '--password', 'test', 'address']))['your_address_is'].should.be.a('string')
  })
  it('Create Wallet From Private Key', async () => {
    // create wallet
    await execute(['wallet', walletName, 'save', '--password', 'test', KEY_PAIR.priv])

    // check for wallet files
    fs.existsSync(walletName).should.equal(true)
    fs.existsSync(`${walletName}.pub`).should.equal(true)

    // check if wallet valid
    parseBlock(await execute(['wallet', walletName, '--password', 'test', 'address']))['your_address_is'].should.equal(KEY_PAIR.pub)
  })
  it('Check Wallet Address', async () => {
    // check if wallet valid
    parseBlock(await execute(['wallet', walletName, '--password', 'test', 'address']))['your_address_is'].should.equal(KEY_PAIR.pub)
  })
  it('Check Wallet Balance', async () => {
    const w = await BaseAe()
    w.setKeypair(KEY_PAIR)

    const balance = await w.balance(KEY_PAIR.pub)
    parseInt(parseBlock(await execute(['wallet', walletName, '--password', 'test', 'balance']))['your_balance_is']).should.equal(balance)
  })
  it('Spend coins to another wallet', async () => {
    const amount = 100
    const receiverKeys = generateKeyPair()
    const receiver = await BaseAe()
    receiver.setKeypair(receiverKeys)

    // send coins
    await execute(['wallet', walletName, '--password', 'test', 'spend', receiverKeys.pub, amount])

    return receiver.balance(receiverKeys.pub).should.equal(amount)

  })
})