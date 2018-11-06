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
require = require('esm')(module /*, options */) // use to handle es6 import/export

import {
  printError,
  print
} from '../../../utils/print'
const utils = require('../../utils.js');
const { spawn } = require('promisify-child-process');
const dockerCLI = require('docker-cli-js');
const cli = require('./../../../utils/cli');
const docker = new dockerCLI.Docker();

const config = {
  host: "http://localhost:3001/",
	internalHost: "http://localhost:3001/internal/",
	keyPair: {
		secretKey: 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca',
		publicKey: 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'
  },
  nonce: 1
}

const defaultWallets = 
  [
    {
      publicKey: "ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk", 
      secretKey: "ak_HHC295F8zFpcagPpApwyapA2DXV6ki3WFZW7fbHi6jyhLMrpJsM1cannt2ySA9CsivEzAQzkLZhDzd6mAtgzbgxyiSru4"
    },
    {
      publicKey: "ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP",
      secretKey: "ak_HhegEtZYJE23JTXEGshDQ6xZ4CsC7qW8diCZsk893dSkP2ib5RCXzB2uofRV2csmiAWyuT6WfXwWA2uRJfRqZZbhTfeH6"
    },
    {
      publicKey: "ak_FHZrEbRmanKUe9ECPXVNTLLpRP2SeQCLCT6Vnvs9JuVu78J7V",
      secretKey: "ak_3keAmRQhg5XPQUWNPZ6GCkd7VpiwoYE8oMThJX6Tony8ZfRGp6R12teMCQq2dSA92EAvo3bPc4VMxdmH8LvJja2esASi4"
    },
    {
      publicKey: "ak_RYkcTuYcyxQ6fWZsL2G3Kj3K5WCRUEXsi76bPUNkEsoHc52Wp",
      secretKey: "ak_CcMj5Z9AR22Mw8CfQRqVi4sDVnBKsLJ91G3B92MTFEMkohPoUpVamBPReCAKWn3LZHX7Lj4bYiMKzWNFkZiziR696cKoR"
    },
    {
      publicKey: "ak_2VvB4fFu7BQHaSuW5EkQ7GCaM5qiA5BsFUHjJ7dYpAaBoeFCZi",
      secretKey: "ak_BW78ZXYUGCqofmemBqyEWGRSz8YWyC9QMyP162cwSBdZQPomdrrXhm9tfcxaiugABZXmtq7FzR8ZgPC67DKzEke7C59EG"
    },
    {
      publicKey: "ak_286tvbfP6xe4GY9sEbuN2ftx1LpavQwFVcPor9H4GxBtq5fXws",
      secretKey: "ak_FiS9o4tw9R87cshczZzEsRK29F1o1NDcX7AYAVgEFmuzXJR55aNVMwTLFJvnmxc2VZ3rPpsptbKAVnBL1vXtKcSGkDvhA"
    },
    {
      publicKey: "ak_f9bmi44rdvUGKDsTLp3vMCMLMvvqsMQVWyc3XDAYECmCXEbzy",
      secretKey: "ak_L9mrJp6fvifoUtR2amRZwz8wMySQP8GM5NJFkDTYQ81fKEdDerpZKk1GUMwY4Segy6yuVZL99cGCxwhJiURFoZxch3QLQ"
    },
    {
      publicKey: "ak_23p6pT7bajYMJRbnJ5BsbFUuYGX2PBoZAiiYcsrRHZ1BUY2zSF",
      secretKey: "ak_WUx8h4o18KAFJjHNt8Amti2WXn7wRf4gw5vxYbs3v93uCmGpe21QzQBVwvBFQU1Vhy1p6MNbpcEcipPu4TthebvskG9Dv"
    },
    {
      publicKey: "ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv",
      secretKey: "ak_FUwKv5yhtZHmk2o3ZKQSHtYT7gbY7cAU11QB6RZFXDhag5n3uqez1XDPkCHpHGDmE3Nfgs7smAabRhHLsiKXvMTfcMjVT"
    },
    {
      publicKey: "ak_zPoY7cSHy2wBKFsdWJGXM7LnSjVt6cn1TWBDdRBUMC7Tur2NQ",
      secretKey: "ak_87QPyEAD44fZTddnHi9vP1hSPaxPpmDy7TDHUqJxbeWgSLG27oLFAQaR4VC1zVTQXzmcW9cjcjjzVwnpHxmBw9DLgcyAM"
    }
  ]
  
async function dockerPs(){
  let running = false

  await docker.command('ps', function (err, data) {
    data.containerList.forEach(function (container) {
      if (container.image.startsWith("aeternity") && container.status.indexOf("healthy") != -1) {
        running = true;
      }
    })
  });

  return running;
}

async function fundWallets(){
  let client = await cli.initClient(
    {
      url: config.host, 
      keypair: config.keyPair, 
      internalUrl: config.internalHost
    })
  
  let balance = 0;
  while(parseInt(balance) > 0){
    try{
      process.stdout.write(".");
      utils.sleep(1500)
      balance = (await client.balance(await client.address()));
    }catch(e){
      //todo
    }
  }

  let walletIndex = 1;
  defaultWallets.forEach(async function(wallet){
    await fundWallet(client, wallet.publicKey)
    print(`#${walletIndex++} ------------------------------------------------------------`)
    print(`public key: ${wallet.publicKey}`)
    print(`private key: ${wallet.secretKey}`)
  })

}

async function fundWallet(client, recipient){
  const { tx } = await client.api.postSpend({
    fee: 1,
    amount: 100000000000000000,
    senderId: config.keyPair.publicKey,
    recipientId: recipient,
    payload: '',
    ttl: 55555,
    nonce: config.nonce++
  })

  const signed = await client.signTransaction(tx)
  await client.api.postTransaction({ tx: signed })
}

async function run(option) {

  try {
    var sdkInstallProcess;
    let running = await dockerPs();

    if (option.stop) {
      if(running){
        print('===== Stopping epoch =====');
      
        sdkInstallProcess = await spawn('docker-compose', ['down', '-v'], {});
  
        print('===== Epoch was successfully stopped! =====');
      } else {
        print('===== Epoch is not running! =====');
      }
    } else {
      if(!running){
        print('===== Starting epoch =====');

        sdkInstallProcess = spawn('docker-compose', ['up', '-d'], {});
        
        while(!(await dockerPs())){
          process.stdout.write(".");
          utils.sleep(1000);
        }
  
        print('\n\r===== Epoch was successfully started! =====');
        print('===== Funding default wallets! =====');
        
        await fundWallets();
        
        print('\r\n===== Default wallets was successfully funded! =====');
      } else {
        print('\r\n===== Epoch already started and healthy started! =====');
      }
    }
  } catch (e) {
    printError(e.message)
  }
}

module.exports = {
  run
}
