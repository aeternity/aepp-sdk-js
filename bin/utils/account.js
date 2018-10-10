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
import path from 'path'
import prompt from 'prompt'

import * as Crypto from '../../es/utils/crypto'
import { print } from './print'
import { readJSONFile, writeFile } from './helpers'
import { dump, getAddressFromPriv, recover } from './keystore'

// #The `prompt` library provides concealed input of passwords.

// `prompt` schema
const PROMPT_SCHEMA = {
  properties: {
    password: {
      type: 'string',
      description: 'Enter your password',
      hidden: true,
      required: false,
      replace: '*',
      conform: function () {
        return true
      }
    }
  }
}

// Prompt password using `prompt`
async function promptPasswordAsync () {
  return new Promise(
    (resolve, reject) => {
      prompt.start()
      prompt.get(
        PROMPT_SCHEMA,
        (err, res) => {
          if (err || !res || !res.password) {
            reject(err)
          } else {
            resolve(res.password)
          }
        }
      )
    }
  )
}

// #WALLET HELPERS

// Generate `keypair` encrypt it using password and write to filesystem
export async function generateSecureWallet (name, { output, password }) {
  password = password || await promptPasswordAsync()
  const { priv, pub } = Crypto.generateKeyPair()

  writeFile(path.join(output, name), JSON.stringify(await dump(password, priv)))

  print(`
    Wallet saved
    Wallet address________________ ${pub}
    Wallet path___________________ ${path.resolve(process.cwd(), path.join(output, name))}
  `)
}

// Generate `keypair` from `PRIVATE KEY` encrypt it using password and write to filesystem
export async function generateSecureWalletFromPrivKey (name, priv, { output, password }) {
  password = password || await promptPasswordAsync()

  const hexStr = Crypto.hexStringToByte(priv.trim())
  const keys = Crypto.generateKeyPairFromSecret(hexStr)

  const encryptedKeyPair = await dump(password, keys.secretKey)

  writeFile(path.join(output, name), JSON.stringify(encryptedKeyPair))

  print(`
    Wallet saved
    Wallet address________________ ${Crypto.aeEncodeKey(keys.publicKey)}
    Wallet path___________________ ${path.resolve(process.cwd(), name)}
  `)
}

// Get account files by path, decrypt it using password and return `keypair`
// Also can generate `keypair` using `PRIVATE KEY`
export async function getWalletByPathAndDecrypt (walletPath, { password } = {}) {
  try {
    const keyFile = readJSONFile(path.resolve(process.cwd(), walletPath))

    if (!password || typeof password !== 'string' || !password.length) password = await promptPasswordAsync()

    const privKey = await recover(password, keyFile)

    return {
      priv: privKey,
      pub: getAddressFromPriv(privKey)
    }
  } catch (e) {
    throw new Error('GET WALLET ERROR: ' + e.message)
  }
}
