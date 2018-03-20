#!/usr/bin/env node

/*
 * Copyright 2018 aeternity developers
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


const AeternityClient = require ('../index.js')
const {AeSubscription} = require ('../lib/providers/ws/subscriptions')
const WebSocketProvider = require ('../lib/providers/ws')

const program = require ('commander')
const axios = require ('axios')
const ConnectionListener = require('../lib/utils/listeners').ConnectionListener

let runOracleServer = async (options) => {

  let client = new AeternityClient (new WebSocketProvider (options.host, options.port))

  client.addConnectionListener(new ConnectionListener({
    onOpen: () => {
      console.log ('Websocket connection is open')
      client.oracles.register ('queryFormat', 'responseFormat', 4, 500, 5).then (
        (oracleId) => {
          console.log (`Oracle online! ID: ${oracleId}`)
          client.oracles.setResolver ((queryData) => {
            console.log (`New query data ${JSON.stringify (queryData)}`)
            console.log (`Received query ${queryData['query']}`)
            let statementId = queryData['query']
            axios.get (`https://vote.aepps.com/statements/${statementId}/json`)
              .then ((response) => {
                client.oracles.respond (queryData['query_id'], 4, JSON.stringify (response.data))
              })
              .catch (
                (error) => {
                  console.error (error)
                }
              )
          })
        }
      )
    }})
  )

  // Activate logging
  client.addSubscription (new AeSubscription ({
    matches: (data) => true,
    update: (data) => console.log (`> ${JSON.stringify(data)}`)
  }))

}

const runOracleQueryClient = (oracle, query, options) => {
  let client = new AeternityClient (new WebSocketProvider (options.host, options.port))

  client.addConnectionListener(new ConnectionListener({
    onOpen: () => {
      console.log ('Websocket connection is open')
      client.oracles.query (oracle, 4, 10, 10, 7, query).then (
        (response) => {
          console.log (`New response:\n ${JSON.stringify (response)}`)
        }
      )
    }})
  )

  // Activate logging
  client.addSubscription (new AeSubscription ({
    matches: (data) => true,
    update: (data) => console.log (`> ${JSON.stringify(data)}`)
  }))

}

program
  .version ('0.1.0')
  .command ('serve')
  .description ('Starts an oracle server')
  .option ('-p, --port [port]', 'Websocket port', 3104)
  .option ('-h, --host [host]', 'Websocket host', 'localhost')
  .action (runOracleServer)

program
  .version ('0.1.0')
  .usage ('[options] <oracle_id> \'q9KS5jrMp83vTS7ZN\'')
  .command ('ask <oracle> <query>')
  .description ('Queries an oracle')
  .option ('-p, --port [port]', 'Websocket port', 3104)
  .option ('-h, --host [host]', 'Websocket host', 'localhost')
  .action (runOracleQueryClient)


program.parse (process.argv)

if (program.args.length === 0) program.help ()
