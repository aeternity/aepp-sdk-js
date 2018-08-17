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

import { top, mempool, play, version } from './chain';
import { spend } from './wallet';

/**
 * CLI Interface module
 * @module @aeternity/aepp-sdk/es/cli
 * @export CLI
 */


function printConfig() {
  const epochUrl = process.env['EPOCH_URL'] ? process.env['EPOCH_URL'] : 'https://sdk-testnet.aepps.com';
  console.log('WALLET_PUB___________' + process.env['WALLET_PUB']);
  console.log('EPOCH_URL___________' + epochUrl);
}


async function init() {

  // CONFIG
  sc
    .command('config', {
      desc: 'Print Config',
      callback: () => printConfig()
    })

  //<-----------------------------------------------


  // CHAIN CLI
  const chain = sc.command( 'chain', {
    desc: 'Interact with Chain',
    callback: () => chain.usage()
  })
    .option('interval', {
    abbr: 'i',
    desc: 'interval for polling'
  });

  chain.command( 'top',
    {
      desc: 'Get top of Chain',
      callback: async function ( options ) {
        await top();
      }
    }
  );

  chain
    .command('version',
    {
      desc: 'Get Epoch version',
      callback: async function ( options ) {
        await version();
      }
    }
    );

  chain
    .command('play',
      {
        desc: 'Real-time block monitoring',
        callback: async function ( options ) {
          await play();
        }
      })

  chain
    .command('mempool',
      {
        desc: 'Get mempool of Chain',
        callback: async function ( options ) {
          await mempool();
        }
      })

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