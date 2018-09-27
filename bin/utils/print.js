import * as R from 'ramda'

import { HASH_TYPES } from './constant'

// CONSOLE PRINT HELPERS
export function print (msg, obj) {
  if (obj)
    console.log(msg, obj)
  else
    console.log(msg)
}

export function printError (msg) {
  console.log(msg)
}

export function printConfig ({ host }) {
  print('WALLET_PUB___________' + process.env['WALLET_PUB'])
  print('EPOCH_URL___________' + host)
}

export function printBlock (block, json) {
  if (json) {
    print(block)
    return
  }
  const type = Object.keys(HASH_TYPES).find(t => block.hash.indexOf(HASH_TYPES[t] + '_') !== -1)
  print('---------------- ' + type.toUpperCase() + ' ----------------')
  print(`Block hash____________________ ${R.prop('hash', block)}`)
  print(`Block height__________________ ${R.prop('height', block)}`)
  print(`State hash____________________ ${R.prop('stateHash', block)}`)
  print(`Miner_________________________ ${R.defaultTo('N/A', R.prop('miner', block))}`)
  print(`Time__________________________ ${new Date(R.prop('time', block))}`)
  print(`Previous block hash___________ ${R.prop('prevHash', block)}`)
  print(`Previous key block hash_______ ${R.prop('prevKeyHash', block)}`)
  print(`Transactions__________________ ${R.defaultTo(0, R.path(['transactions', 'length'], block))}`)
  if (R.defaultTo(0, R.path(['transactions', 'length'], block)))
    printBlockTransactions(block.transactions)
}

export function printName (name, json) {
  if (json) {
    print(name)
    return
  }
  print(`Status___________ ${R.defaultTo('N/A', R.prop('status', name))}`)
  print(`Name hash________ ${R.defaultTo('N/A', R.prop('id', name))}`)
  print(`Pointers_________`, R.defaultTo('N/A', R.prop('pointers', name)))
  print(`TTL______________ ${R.defaultTo(0, R.prop('nameTtl', name))}`)
}

export function printBlockTransactions (ts, json) {
  if (json) {
    print(ts)
    return
  }
  ts.forEach(
    tx => {
      printTransaction(tx)
    })
}

export function printTransaction (tx, json) {
  if (json) {
    print(tx)
    return
  }
  const senderId = R.path(['tx', 'senderId'], tx) || R.path(['tx', 'accountId'], tx)
  print(`Tx hash_______________________ ${tx.hash}`)
  print(`Block hash____________________ ${tx.blockHash}`)
  print(`Block height__________________ ${tx.blockHeight}`)
  print(`Signatures____________________ ${tx.signatures}`)
  print(`Tx Type_______________________ ${R.defaultTo('N/A', R.path(['tx', 'type'], tx))}`)
  print(`Sender account________________ ${R.defaultTo('N/A', senderId)}`)
  print(`Recipient account_____________ ${R.defaultTo('N/A', R.path(['tx', 'recipientId'], tx))}`)
  print(`Amount________________________ ${R.defaultTo('N/A', R.path(['tx', 'amount'], tx))}`)
  print(`Nonce_________________________ ${R.defaultTo('N/A', R.path(['tx', 'nonce'], tx))}`)
  print(`TTL___________________________ ${R.defaultTo('N/A', R.path(['tx', 'ttl'], tx))}`)
}

export function printContractDescr (descriptor, json) {
  if (json) {
    print(descriptor)
    return
  }
  print('Source________________________ ' + descriptor.source)
  print('Bytecode______________________ ' + descriptor.bytecode)
  print('Address_______________________ ' + descriptor.address)
  print('Transaction___________________ ' + descriptor.transaction)
  print('Owner_________________________ ' + descriptor.owner)
  print('Created_At____________________ ' + descriptor.createdAt)
}

export function logContractDescriptor (desc, title = '', json) {
  if (json) {
    print(desc)
    return
  }
  print(`${title}`)
  print(`Contract address________________ ${desc.address}`)
  print(`Transaction hash________________ ${desc.transaction}`)
  print(`Deploy descriptor_______________ ${desc.descPath}`)
}

//