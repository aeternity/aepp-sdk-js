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

const actions = {
  MINED_BLOCK: 'mined_block',
  NEW_BLOCK: 'new_block',
  REGISTER: 'register',
  RESPONSE: 'response',
  NEW_ORACLE_QUERY: 'new_oracle_query',
  NEW_ORACLE_RESPONSE: 'new_oracle_response',
  QUERY: 'query',
  SUBSCRIBE: 'subscribe'
}

const origins = {
  ORACLE: 'oracle',
  CHAIN: 'chain'
}

const targets = {
  CHAIN: 'chain',
  ORACLE: 'oracle'
}

export {
  actions,
  origins,
  targets
}
