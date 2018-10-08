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

import readline from 'readline'
import chalk from 'chalk'
import Channel from '../../es/channel'
import { decodeTx, deserialize } from '../../es/utils/crypto'

const COMMANDS = ([
  ['sign', 's', `(${chalk.bold('s')})ign`],
  ['reject', 'r', `(${chalk.bold('r')})eject`],
  ['update', 'u', `(${chalk.bold('u')})pdate`],
  ['shutdown', 's', `(${chalk.bold('s')})hutdown`]
]).reduce((commands, [cmd, short, pretty]) => ({
  ...commands,
  [cmd]: { cmd, short, pretty }
}), {})

let activeReadline

function prettyTx (tx) {
  return JSON.stringify(deserialize(decodeTx(tx), {prettyTags: true}), undefined, 2)
}

function ask (query, insertNewline = true) {
  if (activeReadline) {
    activeReadline.close()
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question(query, (answer) => {
      rl.close()
      activeReadline = null
      if (insertNewline) {
        process.stdout.write('\n')
      }
      resolve(answer)
    })
    activeReadline = rl
  })
}

function execCommand (commands) {
  return (async function repeat() {
    const query = (() => {
      const [head, ...tail] = Object.keys(commands)
      return tail.reduce((prev, cmd) => `${prev} ${COMMANDS[cmd].pretty}`, COMMANDS[head].pretty)
    })()

    const input = await ask(`${query}: `)
    const cmd = input.toLowerCase()
    const command = Object.keys(commands).find(key =>
      cmd === COMMANDS[key].short || cmd === COMMANDS[key].cmd)
    if (!command) {
      console.log(`\n${chalk.red.bold('Unknown command:')} ${cmd}`)
      return repeat()
    }
    return Promise.resolve(commands[command](repeat))
  })()
}

function signTx (account, tag, tx) {
  if (activeReadline) {
    console.log('\n')
  }
  console.log(chalk.green.bold(tag))
  console.log(chalk.grey(prettyTx(tx)))
  process.stdout.write('\n')

  return execCommand({
    async sign() {
      return await account.signTransaction(tx)
    },
    reject() {
      return null
    }
  })
}

async function execUserCommand (channel, account) {
  const repeat = await execCommand({
    async update() {
      const from = await ask(`${chalk.black.bold('from:')} `, false)
      const to = await ask(`${chalk.black.bold('to:')} `, false)
      const amount = Number(await ask(`${chalk.black.bold('amount:')} `))
      try {
        const result = await channel.update(from, to, amount, async (tx) =>
          signTx(account, 'update', tx))
        console.log(`${chalk.grey(JSON.stringify(result, undefined, 2))}`)
      } catch (err) {
        console.log(`${chalk.red.bold('Error')}`)
        console.log(chalk.grey(err.message))
      } finally {
        process.stdout.write('\n')
        return true
      }
    },
    async shutdown() {
      const tx = await channel.shutdown((tx) => signTx(account, 'shutdown', tx))
      console.log(`${chalk.green.bold('onchain transaction')}`)
      console.log(chalk.grey(prettyTx(tx)))
      process.stdout.write('\n')
      return false
    }
  })
  if (repeat) {
    execUserCommand(channel, account)
  }
}

export async function repl (account, params) {
  const channel = await Channel({
    ...params,
    async sign (tag, tx) {
      const signedTx = await signTx(account, tag, tx)
      if (tag === 'update_ack') {
        execUserCommand(channel, account)
      }
      return signedTx
    }
  })
  channel.on('onChainTx', (tx) => {
    console.log(chalk.yellow.bold('onchain transaction'))
    console.log(chalk.grey(prettyTx(tx)))
    process.stdout.write('\n')
  })
  channel.on('stateChanged', (state) => {
    console.log(chalk.yellow.bold('state changed'))
    console.log(chalk.grey(state))
    process.stdout.write('\n')
  })
  channel.on('statusChanged', (status) => {
    switch (status) {
      case 'open':
        return execUserCommand(channel, account)
      case 'disconnected':
      case 'died':
        console.log(`${chalk.red.bold(status)}`)
        return process.exit(0)
    }
  })
}