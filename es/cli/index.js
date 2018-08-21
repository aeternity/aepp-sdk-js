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

import sc from 'subcommander';

import initChainCommands from './chain'
import { spend } from './wallet';

/**
 * CLI Interface module
 * @module @aeternity/aepp-sdk/es/cli
 * @export CLI
 */


function printConfig({host}) {
  const epochUrl = host;
  console.log('WALLET_PUB___________' + process.env['WALLET_PUB']);
  console.log('EPOCH_URL___________' + epochUrl);
}


async function init() {

  // Top level Options
  sc
    .option('host', {
    abbr: 'h',
    desc: 'Node to connect',
    default: 'https://sdk-testnet.aepps.com'
  });
  //<-----------------------------------------------


  // CONFIG
  sc
    .command('config', {
      desc: 'Print Config',
      callback: (options) => printConfig(options)
    })

  //<-----------------------------------------------


  // CHAIN CLI
  const chain = sc.command('chain', {
    desc: 'Interact with Chain',
    callback: () => chain.usage()
  })
    .option('limit', {
    abbr: 'l',
    desc: 'Limit for play command',
    default: 10
  });

  // Init chain Sub-Commands
  initChainCommands(chain);
  // <--------------------------------------------------->

  // WALLET CLI
  const wallet = sc.command( 'wallet', {
    desc: 'Wallet implementation',
    callback: () => wallet.usage()
  })
    .option('name', {
      abbr: 'n',
      desc: 'Wallet name *require'
    });

  const spend = wallet.command('spend',
    {
      desc: 'Get top of Chain',
      callback: async function ( {name, recipient, amount} ) {
        if (!name || !recipient || amount) {
          spend.usage();
        };
      }
    }
  )
    .option('recipient', { abbr: 'r', desc: 'Recipient Account *require'})
    .option('amount', { abbr: 'a', desc: 'Amount to transfer *require'});
  // <------------------------------------------------>

  if(process.argv.length < 3) {
    sc.usage()
    process.exit(0)
  }

  sc.parse();
}

export default init;