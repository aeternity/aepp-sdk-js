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
import { spawn } from 'child_process'
import * as R from 'ramda'
import Ae from '../../es/ae/cli'
import { generateKeyPair } from '../../es/utils/crypto'

const cliCommand = './bin/aecli.js'

const url = process.env.TEST_URL || 'http://localhost:3013'
const internalUrl = process.env.TEST_INTERNAL_URL || 'http://localhost:3113'
const TIMEOUT = 18000000

export const KEY_PAIR = generateKeyPair()
export const WALLET_NAME = 'mywallet'

export const BaseAe = Ae.compose({
  deepProps: { Swagger: { defaults: { debug: !!process.env['DEBUG'] } } },
  props: { url, internalUrl, process }
})

export function configure (mocha) {
  mocha.timeout(TIMEOUT)
}

let planned = 0
let charged = false

export function plan (amount) {
  planned += amount
}

export async function ready (mocha) {
  configure(mocha)

  const ae = await BaseAe()
  try {
    await ae.awaitHeight(5)
  } catch (e) {
    console.log(e)
  }

  if (!charged && planned > 0) {
    console.log(`Charging new wallet ${KEY_PAIR.pub} with ${planned}`)
    await ae.spend(planned, KEY_PAIR.pub)
    charged = true
  }

  const client = await BaseAe()
  client.setKeypair(KEY_PAIR)
  await execute(['account', 'save', WALLET_NAME, '--password', 'test', KEY_PAIR.priv])
  return client
}

export async function execute (args) {
  return new Promise((resolve, reject) => {
    let result = ''
    const child = spawn(cliCommand, [...args, '--host', url, '--internalUrl', internalUrl])
    child.stdin.setEncoding('utf-8')
    child.stdout.on('data', (data) => {
      result += (data.toString())
    })

    child.stderr.on('data', (data) => {
      reject(data)
    })

    child.on('close', (code) => {
      resolve(result)
    })
  })
}

export function parseBlock (res) {
  return res
    .split('\n')
    .reduce((acc, val) => {
      let v = val.split(/__/)
      if (v.length < 2) { v = val.split(':') }
      return Object.assign(
        acc,
        {
          [R.head(v).replace(' ', '_').replace(' ', '_').toLowerCase()]: R.last(R.last(v).split(/_ /)).trim()
        }
      )
    }, {})
}
