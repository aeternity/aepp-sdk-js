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

const program = require('commander')
const R = require('ramda')

const {
  getCmdFromArguments,
  printError,
  unknownCommandHandler
} = require('./utils')

require = require('esm')(module/*, options*/) //use to handle es6 import/export
const {AENS} = require('./commands')

let AENS_NAME

initAensName()
  .then((name) => {
    AENS_NAME = name

    // remove wallet_name from argv
    process.argv = process.argv.filter((e, i) => i !== 2)

    program.parse(R.init(process.argv))
    if (program.args.length === 0) program.help()
  })
  .catch(e => printError(e))

program
  .usage('<aens-name> [options] [commands]')
  .option('-H, --host [hostname]', 'Node to connect to', 'https://sdk-testnet.aepps.com')
  .option('-N, --nameTtl [ttl]', 'Name life Ttl', 50000)

program
  .command('claim')
  .description('Claim a domain name')
  .action(async (...arguments) => await AENS.claim(AENS_NAME, getCmdFromArguments(arguments)))

program
  .command('revoke')
  .description('Claim a domain name')
  .action(async (...arguments) => await AENS.revokeName(AENS_NAME, getCmdFromArguments(arguments)))

program
  .command('transfer <address>')
  .description('Transfer a name to another account')
  .action(async (address, ...arguments) => await AENS.transferName(AENS_NAME, address, getCmdFromArguments(arguments)))

program
  .command('update <address>')
  .description('Update a name pointer')
  .action(async (address, ...arguments) => await AENS.updateName(AENS_NAME, address, getCmdFromArguments(arguments)))

program.on('command:*', () => unknownCommandHandler(program)())

//HELPERS
async function initAensName () {
  return new Promise((resolve, reject) => {
    program
      .arguments('<aens_name> [command]')
      .action(async (aens_name, command) => {
        if (!command) program.help()

        if (aens_name.slice(aens_name.length - 4) === '.aet')
          resolve(aens_name)
        else
          reject('AENS TLDs must end in .aet')
      })
      .parse(process.argv)

    if (program.args.length === 0) program.help()
  })
}
