





  

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







# Utils `print` Module
That script contains helper function for `console` print


  

```js
import * as R from 'ramda'

import { HASH_TYPES } from './constant'


```







## CONSTANT


  

```js
const TX_TYPE_PRINT_MAP = {
  'spend_tx': printSpendTransaction,
  'contract_create_tx': printContractCreateTransaction,
  'contract_call_tx': printContractCallTransaction,
  'name_preclaim_tx': printNamePreclaimTransaction ,
  'name_claim_tx': printNameClaimTransaction,
  'name_transfer_tx': printNameTransferTransaction,
  'name_update_tx': printNameUpdateTransaction,
  'name_revoke_tx': printNameRevokeTransaction
}

```







## Row width


  

```js
const WIDTH = 40



```







## CONSOLE PRINT HELPERS








Calculate tabs length


  

```js
function getTabs(tabs) {
  if (!tabs) return ''
  return R.repeat(' ', tabs*4).reduce((a, b) => a += b, '')
}


```







Print helper


  

```js
export function print (msg, obj) {
  if (obj) { console.log(msg, obj) } else { console.log(msg) }
}


```







Print error helper


  

```js
export function printError (msg) {
  console.log(msg)
}


```







Print `underscored`


  

```js
export function printUnderscored(key, val) {
  print(`${key}${R.repeat('_', WIDTH - key.length).reduce((a,b) => a += b, '')} ${val}`)
}


```







## BLOCK

Print block


  

```js
export function printBlock (block, json) {
  if (json) {
    print(block)
    return
  }
  const type = Object.keys(HASH_TYPES).find(t => block.hash.indexOf(HASH_TYPES[t] + '') !== -1)
  const tabs = type === 'MICRO_BLOCK' ? 1 : 0
  const tabString = getTabs(tabs)

  print(tabString + '<<--------------- ' + type.toUpperCase() + ' --------------->>')

  printUnderscored(tabString + 'Block hash', R.prop('hash', block))
  printUnderscored(tabString + 'Block height', R.prop('height', block))
  printUnderscored(tabString + 'State hash', R.prop('stateHash', block))
  printUnderscored(tabString + 'Miner', R.defaultTo('N/A', R.prop('miner', block)))
  printUnderscored(tabString + 'Time', new Date(R.prop('time', block)))
  printUnderscored(tabString + 'Previous block hash', R.prop('prevHash', block))
  printUnderscored(tabString + 'Previous key block hash', R.prop('prevKeyHash', block))
  printUnderscored(tabString + 'Version', R.prop('version', block))
  printUnderscored(tabString + 'Target', R.prop('target', block))
  printUnderscored(tabString + 'Transactions', R.defaultTo(0, R.path(['transactions', 'length'], block)))
  if (R.defaultTo(0, R.path(['transactions', 'length'], block)))
    printBlockTransactions(block.transactions, false, tabs + 1)

  print('<<------------------------------------->>')
}


```







Print block `transactions`


  

```js
export function printBlockTransactions (ts, json, tabs = 0) {
  if (json) {
    print(ts)
    return
  }
  const tabsString = getTabs(tabs)
  ts.forEach(
    (tx, i) => {
      print(tabsString + '----------------  TX  ----------------')
      printTransaction(tx, false, tabs + 1)
      print(tabsString + '--------------------------------------')
    })
}


```







## TX

Print base `tx` info


  

```js
function printTxBase(tx = {}, tabs = '') {
  printUnderscored(tabs + 'Tx hash', tx.hash)
  printUnderscored(tabs + 'Block hash', tx.blockHash)
  printUnderscored(tabs + 'Block height', tx.blockHeight)
  printUnderscored(tabs + 'Signatures', tx.signatures)

  printUnderscored(tabs + 'Tx Type', R.defaultTo('N/A', R.path(['tx', 'type'], tx)))
}


```







Print `contract_create_tx` info


  

```js
function printContractCreateTransaction(tx = {}, tabs = '') {
  printUnderscored(tabs + 'Owner', R.defaultTo('N/A', R.path(['tx', 'ownerId'], tx)))
  printUnderscored(tabs + 'Amount', R.defaultTo('N/A', R.path(['tx', 'amount'], tx)))
  printUnderscored(tabs + 'Deposit', R.defaultTo('N/A', R.path(['tx', 'deposit'], tx)))
  printUnderscored(tabs + 'Gas', R.defaultTo('N/A', R.path(['tx', 'gas'], tx)))
  printUnderscored(tabs + 'Gas Price', R.defaultTo('N/A', R.path(['tx', 'gasPrice'], tx)))
  printUnderscored(tabs + 'Payload', R.defaultTo('N/A', R.path(['tx', 'payload'], tx)))

  printUnderscored(tabs + 'Fee', R.defaultTo('N/A', R.path(['tx', 'fee'], tx)))
  printUnderscored(tabs + 'Nonce', R.defaultTo('N/A', R.path(['tx', 'nonce'], tx)))
  printUnderscored(tabs + 'TTL', R.defaultTo('N/A', R.path(['tx', 'ttl'], tx)))
  printUnderscored(tabs + 'Version', R.defaultTo('N/A', R.path(['tx', 'version'], tx)))
  printUnderscored(tabs + 'VM Version', R.defaultTo('N/A', R.path(['tx', 'vmVersion'], tx)))
}


```







Print `contract_call_tx` info


  

```js
function printContractCallTransaction(tx = {}, tabs = '') {
  printUnderscored(tabs + 'Caller Account', R.defaultTo('N/A', R.path(['tx', 'callerId'], tx)))
  printUnderscored(tabs + 'Contract Hash', R.defaultTo('N/A', R.path(['tx', 'contractId'], tx)))
  printUnderscored(tabs + 'Amount', R.defaultTo('N/A', R.path(['tx', 'amount'], tx)))
  printUnderscored(tabs + 'Deposit', R.defaultTo('N/A', R.path(['tx', 'deposit'], tx)))
  printUnderscored(tabs + 'Gas', R.defaultTo('N/A', R.path(['tx', 'gas'], tx)))
  printUnderscored(tabs + 'Gas Price', R.defaultTo('N/A', R.path(['tx', 'gasPrice'], tx)))
  printUnderscored(tabs + 'Payload', R.defaultTo('N/A', R.path(['tx', 'payload'], tx)))

  printUnderscored(tabs + 'Fee', R.defaultTo('N/A', R.path(['tx', 'fee'], tx)))
  printUnderscored(tabs + 'Nonce', R.defaultTo('N/A', R.path(['tx', 'nonce'], tx)))
  printUnderscored(tabs + 'TTL', R.defaultTo('N/A', R.path(['tx', 'ttl'], tx)))
  printUnderscored(tabs + 'Version', R.defaultTo('N/A', R.path(['tx', 'version'], tx)))
  printUnderscored(tabs + 'VM Version', R.defaultTo('N/A', R.path(['tx', 'vmVersion'], tx)))
}


```







Print `spend_tx` info


  

```js
function printSpendTransaction(tx = {}, tabs = '') {

  printUnderscored(tabs + 'Sender account', R.defaultTo('N/A', R.path(['tx', 'senderId'], tx)))
  printUnderscored(tabs + 'Recipient account', R.defaultTo('N/A', R.path(['tx', 'recipientId'], tx)))
  printUnderscored(tabs + 'Amount', R.defaultTo('N/A', R.path(['tx', 'amount'], tx)))
  printUnderscored(tabs + 'Payload', R.defaultTo('N/A', R.path(['tx', 'payload'], tx)))

  printUnderscored(tabs + 'Fee', R.defaultTo('N/A', R.path(['tx', 'fee'], tx)))
  printUnderscored(tabs + 'Nonce', R.defaultTo('N/A', R.path(['tx', 'nonce'], tx)))
  printUnderscored(tabs + 'TTL', R.defaultTo('N/A', R.path(['tx', 'ttl'], tx)))
  printUnderscored(tabs + 'Version', R.defaultTo('N/A', R.path(['tx', 'version'], tx)))
}


```







Print `pre_claim_tx` info


  

```js
function printNamePreclaimTransaction(tx = {}, tabs = '') {
  printUnderscored(tabs + 'Account', R.defaultTo('N/A', R.path(['tx', 'accountId'], tx)))
  printUnderscored(tabs + 'Commitment', R.defaultTo('N/A', R.path(['tx', 'commitmentId'], tx)))

  printUnderscored(tabs + 'Fee', R.defaultTo('N/A', R.path(['tx', 'fee'], tx)))
  printUnderscored(tabs + 'Nonce', R.defaultTo('N/A', R.path(['tx', 'nonce'], tx)))
  printUnderscored(tabs + 'TTL', R.defaultTo('N/A', R.path(['tx', 'ttl'], tx)))
  printUnderscored(tabs + 'Version', R.defaultTo('N/A', R.path(['tx', 'version'], tx)))
}


```







Print `claim_tx` info


  

```js
function printNameClaimTransaction(tx = {}, tabs = '') {

  printUnderscored(tabs + 'Account', R.defaultTo('N/A', R.path(['tx', 'accountId'], tx)))
  printUnderscored(tabs + 'Name', R.defaultTo('N/A', R.path(['tx', 'name'], tx)))
  printUnderscored(tabs + 'Name Salt', R.defaultTo('N/A', R.path(['tx', 'nameSalt'], tx)))

  printUnderscored(tabs + 'Fee', R.defaultTo('N/A', R.path(['tx', 'fee'], tx)))
  printUnderscored(tabs + 'Nonce', R.defaultTo('N/A', R.path(['tx', 'nonce'], tx)))
  printUnderscored(tabs + 'TTL', R.defaultTo('N/A', R.path(['tx', 'ttl'], tx)))
  printUnderscored(tabs + 'Version', R.defaultTo('N/A', R.path(['tx', 'version'], tx)))
}


```







Print `update_name_tx` info


  

```js
function printNameUpdateTransaction(tx = {}, tabs = '') {
  printUnderscored(tabs + 'Account', R.defaultTo('N/A', R.path(['tx', 'accountId'], tx)))
  printUnderscored(tabs + 'Client TTL', R.defaultTo('N/A', R.path(['tx', 'clientTtl'], tx)))
  printUnderscored(tabs + 'Name ID', R.defaultTo('N/A', R.path(['tx', 'nameId'], tx)))
  printUnderscored(tabs + 'Name TTL', R.defaultTo('N/A', R.path(['tx', 'nameTtl'], tx)))
  printUnderscored(tabs + 'Pointers', R.defaultTo('N/A', R.path(['tx', 'pointers'], tx)))

  printUnderscored(tabs + 'Fee', R.defaultTo('N/A', R.path(['tx', 'fee'], tx)))
  printUnderscored(tabs + 'Nonce', R.defaultTo('N/A', R.path(['tx', 'nonce'], tx)))
  printUnderscored(tabs + 'TTL', R.defaultTo('N/A', R.path(['tx', 'ttl'], tx)))
  printUnderscored(tabs + 'Version', R.defaultTo('N/A', R.path(['tx', 'version'], tx)))
}


```







Print `transfer_name_tx` info


  

```js
function printNameTransferTransaction(tx = {}, tabs = '') {
  printUnderscored(tabs + 'Account', R.defaultTo('N/A', R.path(['tx', 'accountId'], tx)))
  printUnderscored(tabs + 'Recipient', R.defaultTo('N/A', R.path(['tx', 'recipientId'], tx)))
  printUnderscored(tabs + 'Name ID', R.defaultTo('N/A', R.path(['tx', 'nameId'], tx)))

  printUnderscored(tabs + 'Fee', R.defaultTo('N/A', R.path(['tx', 'fee'], tx)))
  printUnderscored(tabs + 'Nonce', R.defaultTo('N/A', R.path(['tx', 'nonce'], tx)))
  printUnderscored(tabs + 'TTL', R.defaultTo('N/A', R.path(['tx', 'ttl'], tx)))
  printUnderscored(tabs + 'Version', R.defaultTo('N/A', R.path(['tx', 'version'], tx)))
}


```







Print `revoke_name_tx` info


  

```js
function printNameRevokeTransaction(tx = {}, tabs = '') {
  printUnderscored(tabs + 'Account', R.defaultTo('N/A', R.path(['tx', 'accountId'], tx)))
  printUnderscored(tabs + 'Name ID', R.defaultTo('N/A', R.path(['tx', 'nameId'], tx)))

  printUnderscored(tabs + 'Fee', R.defaultTo('N/A', R.path(['tx', 'fee'], tx)))
  printUnderscored(tabs + 'Nonce', R.defaultTo('N/A', R.path(['tx', 'nonce'], tx)))
  printUnderscored(tabs + 'TTL', R.defaultTo('N/A', R.path(['tx', 'ttl'], tx)))
  printUnderscored(tabs + 'Version', R.defaultTo('N/A', R.path(['tx', 'version'], tx)))
}


```







Function which print `tx`
Get type of `tx` to now which `print` method to use


  

```js
export function printTransaction (tx, json, tabs = 0) {
  if (json) {
    print(tx)
    return
  }
  const tabsString = getTabs(tabs)
  printTxBase(tx, tabsString)
  TX_TYPE_PRINT_MAP[R.path(['tx', 'type'], tx)](tx, tabsString)

}



```







##OTHER

Print `name`


  

```js
export function printName (name, json) {
  if (json) {
    print(name)
    return
  }
  printUnderscored('Status', R.defaultTo('N/A', R.prop('status', name)))
  printUnderscored('Name hash', R.defaultTo('N/A', R.prop('id', name)))
  printUnderscored('Pointers', R.defaultTo('N/A', R.prop('pointers', name)))
  printUnderscored('TTL', R.defaultTo(0, R.prop('nameTtl', name)))
}


```







Print `contract_descriptor` file


  

```js
export function printContractDescr (descriptor, json) {
  if (json) {
    print(descriptor)
    return
  }
  printUnderscored('Source ' + descriptor.source)
  printUnderscored('Bytecode ' + descriptor.bytecode)
  printUnderscored('Address ' + descriptor.address)
  printUnderscored('Transaction ' + descriptor.transaction)
  printUnderscored('Owner ' + descriptor.owner)
  printUnderscored('CreatedAt ' + descriptor.createdAt)
}


```







Print `contract_descriptor` file base info


  

```js
export function logContractDescriptor (desc, title = '', json) {
  if (json) {
    print(desc)
    return
  }
  print(`${title}`)
  printUnderscored('Contract address', desc.address)
  printUnderscored('Transaction hash', desc.transaction)
  printUnderscored('Deploy descriptor', desc.descPath)
}


```







Print `config`


  

```js
export function printConfig ({ host }) {
  print('WALLET_PUB' + process.env['WALLET_PUB'])
  print('EPOCH_URL' + host)
}

```




