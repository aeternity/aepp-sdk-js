import * as R from 'ramda'
import fs from "fs"

import { HASH_TYPES } from './constant'
import { printError } from './print'


export function readJSONFile (filePath) {
  try {
    return JSON.parse(readFile(filePath))
  } catch (e) {
    printError('READ FILE ERROR: ' + e.message)
    process.exit(1)
  }
}

export function getBlock(hash) {
  return async (client) => {
    if (hash.indexOf(HASH_TYPES.block  + '_') !== -1) {
      return await client.api.getKeyBlockByHash(hash)
    }
    if (hash.indexOf(HASH_TYPES.micro_block  + '_') !== -1) {
      return R.merge(
        await client.api.getMicroBlockHeaderByHash(hash),
        await client.api.getMicroBlockTransactionsByHash(hash)
      )
    }
  }
}

export function checkPref (hash, hashType) {
  if (hash.length < 3 || hash.indexOf('_') === -1)
    throw new Error(`Invalid input, likely you forgot to escape the $ sign (use \\$)`)

  // block and micro block check
  if (Array.isArray(hashType)) {
    const res = hashType.find(ht => hash.slice(0, 3) === ht + '_')
    if (res)
      return res
    throw new Error('Invalid block hash, it should be like: mh_.... or kh._...')
  }

  if (hash.slice(0, 3) !== hashType + '_') {
    let msg
    switch (hashType) {
      case HASH_TYPES.transaction:
        msg = 'Invalid transaction hash, it should be like: th_....'
        break
      case HASH_TYPES.account:
        msg = 'Invalid account address, it should be like: ak_....'
        break
    }
    throw new Error(msg)
  }

}

// FILE I/O
export function writeFile (name, data, errTitle = 'WRITE FILE ERROR') {
  try {
    fs.writeFileSync(
      name,
      data
    )
    return true
  } catch (e) {
    printError(`${errTitle}: ` + e)
    process.exit(1)
  }
}

export function readFile (path, encoding = null, errTitle = 'READ FILE ERR') {
  try {
    return fs.readFileSync(
      path,
      encoding
    )
  } catch (e) {
    switch (e.code) {
      case 'ENOENT':
        throw new Error('File not found')
        break
      default:
        throw e
    }
    process.exit(1)
  }
}