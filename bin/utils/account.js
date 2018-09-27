import path from "path"
import prompt from 'prompt'


import * as Crypto from '../../es/utils/crypto'
import { print } from './print'
import { readFile, writeFile } from './helpers'

// The `prompt` library provides concealed input of passwords.
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

// WALLET HELPERS
export async function generateSecureWallet (name, {output, password}) {
  password = password || await promptPasswordAsync()
  const {pub, priv} = Crypto.generateSaveWallet(password)
  const data = [
    [path.join(output, name), priv],
    [path.join(output, `${name}.pub`), pub]
  ]

  data.forEach(([walletPath, data]) => {
    writeFile(walletPath, data)
    print(`Wrote ${path.resolve(process.cwd(), walletPath)}`)
  })
}

export async function generateSecureWalletFromPrivKey (name, priv, { output, password }) {
  password = password || await promptPasswordAsync()

  const hexStr = Crypto.hexStringToByte(priv.trim())
  const keys = Crypto.generateKeyPairFromSecret(hexStr)

  const encryptedKeyPair = {
    pub: Crypto.encryptPublicKey(password, keys.publicKey),
    priv: Crypto.encryptPrivateKey(password, keys.secretKey)
  }

  const data = [
    [path.join(output, name), encryptedKeyPair.priv],
    [path.join(output, `${name}.pub`), encryptedKeyPair.pub]
  ]

  data.forEach(([path, data]) => {
    writeFile(path, data)
  })

  print(`
    Wallet saved
    Wallet address________________ ${Crypto.aeEncodeKey(keys.publicKey)}
    Wallet path___________________ ${path.resolve(process.cwd(), name)}
  `)
}

export async function getWalletByPathAndDecrypt (walletPath, { privateKey, password } = {}) {
  try {
    if (privateKey) {
      const hexStr = Crypto.hexStringToByte(privateKey.trim())
      const keys = Crypto.generateKeyPairFromSecret(hexStr)

      return {
        priv: privateKey.trim(),
        pub: `ak_${Crypto.encodeBase58Check(keys.publicKey)}`
      }
    }

    const privBinaryKey = readFile(path.resolve(process.cwd(), walletPath))
    const pubBinaryKey = readFile(path.resolve(process.cwd(), `${walletPath}.pub`))

    if (!password || typeof password !== 'string' || !password.length) password = await promptPasswordAsync()

    const decryptedPriv = Crypto.decryptPrivateKey(password, privBinaryKey)
    const decryptedPub = Crypto.decryptPubKey(password, pubBinaryKey)

    return {
      priv: decryptedPriv.toString('hex'),
      pub: `ak_${Crypto.encodeBase58Check(decryptedPub)}`
    }
  } catch (e) {
    throw new Error('GET WALLET ERROR: ' + e.message)
  }
}

