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

// CONTRACT DESCRIPTOR
const testContract = `contract Identity =
  type state = ()
  function main(x : int, y: int) = x + y
`
const walletName = 'test.wallet'

plan(1000000000)

describe.skip('CLI Contract Module', function () {
  configure(this)
  const contractFile = 'testContract'
  let wallet
  let deployDescriptor

  before(async function () {
    // Spend tokens for wallet
    // wallet = await ready(this)

    // TODO create wallet by ready function
    // Create wallet files for CLI
    await execute(['wallet', walletName, '--password', 'test', 'save', KEY_PAIR.priv])
  })
  after(function () {
    // Remove wallet files
    fs.unlinkSync(walletName)
    fs.unlinkSync(`${walletName}.pub`)
    // Remove contract files
    fs.unlinkSync(deployDescriptor)
    fs.unlinkSync(contractFile)
  })

  it('Compile Contract', async () => {
    // Create contract file
    fs.writeFileSync(contractFile, testContract)
    const wallet = await BaseAe()

    // Compile contract
    const compiled = await wallet.contractCompile(testContract)
    const compiledCLI = (await execute(['contract', 'compile', contractFile]))
    const bytecodeCLI = compiledCLI.split(':')[1].trim()

    bytecodeCLI.should.equal(compiled.bytecode)
  })
  it('Deploy Contract', async () => {

    // Deploy contract
    const res = await execute(['wallet', walletName, '--password', 'test', 'contract', 'deploy', contractFile])
    console.log(res)
    const {contract_address, transaction_hash, deploy_descriptor} = (parseBlock(res))
    deployDescriptor = deploy_descriptor
    const [name, pref, address] = deployDescriptor.split('.')

    contract_address.should.be.ok
    transaction_hash.should.be.ok
    name.should.equal(contractFile)
    pref.should.equal('deploy')
    address.should.equal(KEY_PAIR.pub.split('$')[1])
  })
  it.skip('Call Contract', async () => {

    // Call contract
    const callResponse = (parseBlock(await execute(['wallet', walletName, '--password', 'test', 'contract', 'call', deployDescriptor, 'main', 'int', '1', '2'])))

    callResponse['return_value_(decoded)'].should.equal('3')
    callResponse.return_remote_type.should.equal('word')
  })
})