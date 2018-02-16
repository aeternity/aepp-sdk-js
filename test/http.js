/*
 * ISC License (ISC)
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


const AeHttpProvider = require('../lib/providers/http')

let httpProvider = new AeHttpProvider('localhost', 3013, {internalPort: 3113, secured: false})


httpProvider.base.getBlockByHeight(2)
  .then((data) => {
    httpProvider.base.getBlockByHash(data['prev_hash'])
      .then((data) => {
        console.log('success')
      })
      .catch(error => console.error('err'))
    httpProvider.base.getCountByHash(data['prev_hash'])
      .then((data) => {
        console.log('getCountByHash success')
      })
      .catch(error => console.error('getCountByHash error'))

  })
  .catch(error => console.error('getBlockByHeight error'))

httpProvider.accounts.getTransactions()
  .then(data => console.log('getTransactions success'))
  .catch(error => console.error(error))

httpProvider.base.getBalances()
  .then(data => console.log('getBalances success'))
  .catch(error => console.error(error))

httpProvider.base.getVersion()
  .then(data => console.log('getVersion success'))
  .catch(error => console.error(error))

httpProvider.base.getInfo()
  .then(data => console.log('getInfo success'))
  .catch(error => console.error(error))

httpProvider.oracles.getOracles()
  .then(data => console.log('getOracles success'))
  .catch(error => console.error(error))

httpProvider.oracles.getOracleQuestions('ok$bulloks')
  .then(data => console.log('getOracleQuestions success'))
  .catch(error => console.error('getOracleQuestions failed'))

httpProvider.base.getPendingBlock()
  .then(data => console.log('getPendingBlock success'))
  .catch(error => console.error('getPendingBlock failed'))

httpProvider.base.getGenesisBlock()
  .then(data => console.log('getGenesisBlock success'))
  .catch(error => console.error('getGenesisBlock failed'))
