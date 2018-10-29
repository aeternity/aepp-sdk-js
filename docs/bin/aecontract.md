





  

```js
#!/usr/bin/env node

```







# Simple Sophia Contract Compiler

This script demonstrates how to deal with the different phases of compiling
Sophia contracts to bytecode, deploying the bytecode to get a callable
contract address and ultimately, invoke the deployed contract on the
æternity blockchain.


  

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

'use strict'


```







We'll need the main client module `Ae` in the `Universal` flavor from the SDK.


  

```js
const { Universal: Ae } = require('@aeternity/aepp-sdk')
const program = require('commander')
const fs = require('fs')

function exec (infile, fn, args) {
  if (!infile || !fn) {
    program.outputHelp()
    process.exit(1)
  }

  const code = fs.readFileSync(infile, 'utf-8')


```







Most methods in the SDK return _Promises_, so the recommended way of
dealing with subsequent actions is `then` chaining with a final `catch`
callback.








`Ae` itself is asynchronous as it determines the node's version and
rest interface automatically. Only once the Promise is fulfilled, we know
we have a working ae client. Please take note `Ae` is not a constructor but
a factory factory, which means it's *not* invoked with `new`.
`contractCompile` takes a raw Sophia contract in string form and sends it
off to the node for bytecode compilation. This might in the future be done
without talking to the node, but requires a bytecode compiler
implementation directly in the SDK.


  

```js
  Ae({ url: program.host, debug: program.debug, process }).then(ae => {
    return ae.contractCompile(code)

```







Invoking `deploy` on the bytecode object will result in the contract
being written to the chain, once the block has been mined.
Sophia contracts always have an `init` method which needs to be invoked,
even when the contract's `state` is `unit` (`()`). The arguments to
`init` have to be provided at deployment time and will be written to the
block as well, together with the contract's bytecode.


  

```js
  }).then(bytecode => {
    console.log(`Obtained bytecode ${bytecode.bytecode}`)
    return bytecode.deploy({ initState: program.init })

```







Once the contract has been successfully mined, we can attempt to invoke
any public function defined within it. The miner who found the next block
will not only be rewarded a fixed amount, but also an amount depending on
the amount of gas spend.


  

```js
  }).then(deployed => {
    console.log(`Contract deployed at ${deployed.address}`)
    return deployed.call(fn, { args: args.join(' ') })

```







The execution result, if successful, will be an AEVM-encoded result
value. Once type decoding will be implemented in the SDK, this value will
not be a hexadecimal string, anymore.


  

```js
  }).then(value => {
    console.log(`Execution result: ${value}`)
  }).catch(e => console.log(e.message))
}


```







## Command Line Interface

The `commander` library provides maximum command line parsing convenience.


  

```js
program
  .version('0.1.0')
  .arguments('<infile> <function> [args...]')
  .option('-i, --init [state]', 'Arguments to contructor function')
  .option('-H, --host [hostname]', 'Node to connect to', 'http://localhost:3013')
  .option('--debug', 'Switch on debugging')
  .action(exec)
  .parse(process.argv)


```




