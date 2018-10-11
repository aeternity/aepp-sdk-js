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
// # Utils `constant` Module
// That script contains default configuration for `CLI`

// ## HAST TYPES
export const HASH_TYPES = {
  transaction: 'th',
  contract: 'ct',
  block: 'kh',
  micro_block: 'mh',
  signature: 'sg',
  account: 'ak',
  stateHash: 'bs'
}

// ## CONNECTION
export const EPOCH_URL = 'https://sdk-edgenet.aepps.com'
export const EPOCH_INTERNAL_URL = 'https://sdk-edgenet.aepps.com'
export const EPOCH_WEBSOCKET_URL = 'https://sdk-edgenet.aepps.com'

// ## CHAIN
export const PLAY_LIMIT = 10
export const PLAY_INTERVAL = 1000

// ## CONTRACT
export const CONTRACT_TTL = 500
export const GAS = 1600000 - 21000 // MAX GAS

// ## AENS
export const AENS_TX_TTL = 500
export const NAME_TTL = 50000

// ## ACCOUNT
export const SPEND_TX_TTL = 500
