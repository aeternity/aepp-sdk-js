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
import { before, describe, it } from 'mocha'

import { configure, plan, ready, execute, parseBlock, BaseAe, KEY_PAIR, WALLET_NAME } from './index'
import { generateKeyPair } from '../../es/utils/crypto'

const walletName = 'test.wallet'

plan(1000000000)

describe('CLI Wallet Module', function () {
  configure(this)

  let wallet

  before(async function () {
    // Spend tokens for wallet
    wallet = await ready(this)
  })
  after(function () {
    // Remove wallet files
    if (fs.existsSync(walletName)) { fs.unlinkSync(walletName) }
    if (fs.existsSync(`${walletName}.pub`)) { fs.unlinkSync(`${walletName}.pub`) }
  })

  it('Create Wallet', async () => {
    // create wallet
    await execute(['account', 'create', walletName, '--password', 'test'])

    // check for wallet files
    fs.existsSync(walletName).should.equal(true)

    // check if wallet files valid
    parseBlock(await execute(['account', 'address', walletName, '--password', 'test']))['your_address_is'].should.be.a('string')
  })
  it('Create Wallet From Private Key', async () => {
    // create wallet
    await execute(['account', 'save', walletName, '--password', 'test', KEY_PAIR.priv])

    // check for wallet files
    fs.existsSync(walletName).should.equal(true)

    // check if wallet valid
    parseBlock(await execute(['account', 'address', walletName, '--password', 'test']))['your_address_is'].should.equal(KEY_PAIR.pub)
  })
  it('Check Wallet Address', async () => {
    // check if wallet valid
    parseBlock(await execute(['account', 'address', WALLET_NAME, '--password', 'test']))['your_address_is'].should.equal(KEY_PAIR.pub)
  })
  it('Check Wallet Address with Private Key', async () => {
    // check if wallet valid
    const res =  parseBlock(await execute(['account', 'address', WALLET_NAME, '--password', 'test', '--privateKey']))
    const [pub, priv] = Object.keys(res)
   res[priv].should.equal(KEY_PAIR.priv)
  })
  it('Check Wallet Balance', async () => {
    const balance = await wallet.balance(await wallet.address())
    const cliBalance = parseBlock(await execute(['account', 'balance', WALLET_NAME, '--password', 'test']))
    parseInt(cliBalance['your_balance_is']).should.equal(balance)
  })
  it('Spend coins to another wallet', async () => {
    const amount = 100
    const receiverKeys = generateKeyPair()
    const receiver = await BaseAe()
    receiver.setKeypair(receiverKeys)

    // send coins
    await execute(['account', 'spend', WALLET_NAME, '--password', 'test', await receiver.address(), amount])
    const receiverBalance = await receiver.balance(await receiver.address())
    await receiverBalance.should.equal(amount)
  })
})
