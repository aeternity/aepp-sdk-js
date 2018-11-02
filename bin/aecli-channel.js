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

const program = require('commander')

require = require('esm')(module/*, options*/) //use to handle es6 import/export
const utils = require('./utils/index')
const Account = require('../es/account/memory').default

program.on('command:channel', (args) => {
  if (!args.length) {
    program.help()
  }
})

program
  .command('channel <url> [privkey]')
  .option('--role <role>', 'Participant role ("initiator" or "responder")')
  .option('--initiatorId <initiatorId>', 'Initiator\'s public key')
  .option('--responderId <responderId>', 'Responder\'s public key')
  .option('--pushAmount <pushAmount>', 'Initial deposit in favour of the responder by the initiator', 0)
  .option('--initiatorAmount <initiatorAmount>', 'Amount of tokens the initiator has committed to the channel', 100)
  .option('--responderAmount <responderAmount>', 'Amount of tokens the responder has committed to the channel', 100)
  .option('--channelReserve <channelReserve>', 'The minimum amount both peers need to maintain', 10)
  .option('--ttl <ttl>', 'Minimum block height to include the channel_create_tx')
  .option('--host <host>', 'Host of the responder\'s node')
  .option('--port <port>', 'The port of the responders node')
  .option('--lockPeriod <lockPeriod>', 'Amount of blocks for disputing a solo close', 10)
  .option('--existingChannelId <existingChannelId>', 'Existing channel id')
  .option('--offchainTx <offchainTx>', 'Offchain transaction')
  .option('--file <file>', 'Private key file')
  .description('State channels')
  .action(async (url, privKey, options) => {
    const params = [
      'role',
      'initiatorId',
      'responderId',
      'pushAmount',
      'initiatorAmount',
      'responderAmount',
      'channelReserve',
      'ttl',
      'host',
      'port',
      'lockPeriod',
      'existingChannelId',
      'offchainTx'
    ].reduce((params, key) => {
      const value = options[key]
      if (value) {
        return {...params, [key]: value}
      }
      return params
    }, {})

    const required = [
      'role',
      'initiatorId',
      'responderId',
      'pushAmount',
      'initiatorAmount',
      'responderAmount',
      'channelReserve',
      'lockPeriod',
      ...(params.role === 'initiator' ? ['host', 'port'] : [])
    ]
    required.forEach((key) => {
      if (!params[key]) {
        throw Error(`Must provide --${key}`)
      }
    })

    if (!['initiator', 'responder'].includes(params.role)) {
      throw Error('--role must be either "initiator" or "responder"')
    }

    const secretKey = (() => {
      if (program.file) {
        return fs.readFileSync(program.file)
      } else if (privKey) {
        return Buffer.from(privKey, 'hex')
      } else {
        throw Error('Must provide either [privkey] or [file]')
      }
    })()
    const publicKey = ({
      initiator: params.initiatorId,
      responder: params.responderId
    })[params.role]
    const account = Account({
      keypair: {
        publicKey,
        secretKey,
      }
    })
    
    try {
      await utils.channel.repl(account, {
        url,
        ...params,
      })
    } catch (err) {
      console.log(err)
      process.exit(1)
    }
  })
