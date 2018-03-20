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


const createTxParams = ({txTypes, excludeTxTypes}) => {
  let params = {}
  if (Array.isArray(txTypes)) {
    params['tx_types'] = txTypes.join(',')
  } else {
    params['tx_types'] = txTypes
  }
  if (Array.isArray(excludeTxTypes)) {
    params['exclude_tx_types'] = excludeTxTypes.join(',')
  } else {
    params['exclude_tx_types'] = excludeTxTypes
  }
  return params
}

const createTxRangeParams = (from, to, {txTypes, excludeTxTypes}) => {
  let params = createTxParams({txTypes, excludeTxTypes})
  params.from = from
  params.to = to
  params['tx_encoding'] = 'json'
  return params
}

const createTxCallParams = (options) => {
  return {
    'gas_price': options.gasPrice || 1,
    'amount': options.amount || 4,
    'fee': options.fee || 10,
    'gas': options.gas || 4,
    'nonce': options.nonce
  }
}

module.exports = {
  createTxRangeParams,
  createTxParams,
  createTxCallParams
}