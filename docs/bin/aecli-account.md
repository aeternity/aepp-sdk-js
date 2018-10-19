





  

```js
#!/usr/bin/env node

```







# æternity CLI `account` file

This script initialize all `account` commands


  

```js
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

```







We'll use `commander` for parsing options

Also we need `esm` package to handle `ES imports`


  

```js
const program = require('commander')

require = require('esm')(module/*, options*/) //use to handle es6 import/export
const utils = require('./utils/index')
const { Wallet } = require('./commands')


```







## Initialize `options`


  

```js
program
  .option('-H, --host [hostname]', 'Node to connect to', utils.constant.EPOCH_URL)
  .option('-U, --internalUrl [internal]', 'Node to connect to(internal)', utils.constant.EPOCH_INTERNAL_URL)
  .option('-P, --password [password]', 'Wallet Password')
  .option('-n, --nonce [nonce]', 'Override the nonce that the transaction is going to be sent with')
  .option('-f --force', 'Ignore epoch version compatibility check')
  .option('--json ', 'Print result in json format')


```







## Initialize `spend` command

You can use this command to send tokens to another account

Example: `aecli account spend ./myWalletKeyFile ak_1241rioefwj23f2wfdsfsdsdfsasdf 100 --password testpassword`

You can set transaction `ttl(Time to leave)`. If not set use default.

Example: `aecli account spend ./myWalletKeyFile ak_1241rioefwj23f2wfdsfsdsdfsasdf 100 --password testpassword --ttl 20` --> this tx will leave for 20 blocks


  

```js
program
  .command('spend <wallet_path> <receiver> <amount>')
  .option('-T, --ttl [ttl]', 'Validity of the spend transaction in number of blocks (default forever)', utils.constant.SPEND_TX_TTL)
  .description('Create a transaction to another wallet')
  .action(async (walletPath, receiver, amount, ...arguments) => await Wallet.spend(walletPath, receiver, amount, utils.cli.getCmdFromArguments(arguments)))


```







## Initialize `balance` command

You can use this command to retrieve balance of account

Example: `aecli account balance ./myWalletKeyFile --password testpassword`


  

```js
program
  .command('balance <wallet_path>')
  .description('Get wallet balance')
  .action(async (walletPath, ...arguments) => await Wallet.getBalance(walletPath, utils.cli.getCmdFromArguments(arguments)))


```







## Initialize `address` command

You can use this command to retrieve get your public and private key

Example: `aecli account address ./myWalletKeyFile --password testpassword` --> show only public key

Example: `aecli account address ./myWalletKeyFile --password testpassword --privateKey` --> show  public key and private key


  

```js
program
  .command('address [wallet_path]')
  .option('-K, --privateKey', 'Print private key')
  .description('Get wallet address')
  .action(async (walletPath, ...arguments) => await Wallet.getAddress(walletPath, utils.cli.getCmdFromArguments(arguments)))


```







## Initialize `create` command

You can use this command to generate `keypair` and encrypt it by password.
This command create `ethereum like keyfile`.

You can use `--output ./keys` to set directory to save you key.

Example: `aecli account create myWalletName --password testpassword`

Example: `aecli account create myWalletName --password testpassword --output ./mykeys` --> create `key-file` in `mykeys` directory


  

```js
program
  .command('create <name>')
  .option('-O, --output [output]', 'Output directory', '.')
  .description('Create a secure wallet')
  .action(async (name, ...arguments) => await Wallet.createSecureWallet(name, utils.cli.getCmdFromArguments(arguments)))


```







## Initialize `save` command

You can use this command to generate `keypair` from `private-key` and encrypt it by password.
This command create `ethereum like keyfile`.

You can use `--output ./keys` to set directory to save you key

Example: `aecli account save myWalletName 1902855723940510273412074210842018342148234  --password testpassword`

Example: `aecli account save myWalletName 1902855723940510273412074210842018342148234 --password testpassword --output ./mykeys` --> create `key-file` in `mykeys` directory


  

```js
program
  .command('save <name> <privkey>')
  .option('-O, --output [output]', 'Output directory', '.')
  .description('Save a private keys string to a password protected file wallet')
  .action(async (name, priv, ...arguments) => await Wallet.createSecureWalletByPrivKey(name, priv, utils.cli.getCmdFromArguments(arguments)))


```







Handle unknown command's


  

```js
program.on('command:*', () => utils.errors.unknownCommandHandler(program)())


```







Parse arguments or show `help` if argument's is empty


  

```js
program.parse(process.argv)
if (program.args.length === 0) program.help()


```




