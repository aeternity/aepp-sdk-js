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


const AeternityClient = require('../index')
const WebSocketProvider = require('../lib/providers/ws')

const program = require('commander')
const axios = require('axios')

let runOracleServer = (options) => {

  console.log(`${options.host} ${options.port} ${options.httpPort}`)

  let client = new AeternityClient(new WebSocketProvider(options.host, options.port))

  let wsProvider = client.provider

  wsProvider.on ('open', function () {
      console.log ('Websocket connection is open')
      client.oracles.register ('queryFormat', 'responseFormat', 4, 500, 5)
    }
  )
  wsProvider.on ('registeredOracle', function (oracleId) {
      console.log (`Oracle id ${oracleId}`)
      client.oracles.subscribe (oracleId)
      client.oracles.query (oracleId, 4, 10, 10, 7, 'q9KS5jrMp83vTS7ZN')
    }
  )
  wsProvider.on ('query', function (queryId) {
      console.log (`Query id ${queryId}`)
      client.oracles.subscribeQuery (queryId)
    }
  )
  wsProvider.on ('subscribed', function (queryId) {
      console.log (`Subscription event ${JSON.stringify (queryId)}`)
    }
  )

  wsProvider.on ('newQuery', function (queryData) {
    console.log (`New query data ${JSON.stringify(queryData)}`)
    console.log(`Received query ${queryData['query']}`)
    let statementId = queryData['query']
    axios.get(`https://vote.aepps.com/statements/${statementId}/json`).then((response) => {
      client.oracles.respond (queryData['query_id'], 4, JSON.stringify(response.data))
    }).catch(
      (error) => {
        console.error(error)
      }
    )
  })

  wsProvider.on ('response', function (response) {
    console.log(`CLIENT RESPONSE: ${JSON.stringify(response)}`)
  })
}

program
  .version('0.1.0')
  .command('start')
  .description('Starts an oracle server')
  .option('-p, --port [port]', 'Websocket port', 3104)
  .option('-h, --host [host]', 'Websocket host', 'localhost')
  .action(runOracleServer)

program.parse(process.argv)

if (program.args.length === 0) program.help();
