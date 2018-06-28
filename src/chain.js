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

import stampit from '@stamp/it'
import {required} from '@stamp/required'

/**
 * @typedef {Object} Chain
 * @property {function (tx: string, options: ?Object): Promise<string>} sendTransaction - Commit a signed transaction
 * @property {function (): Promise<number>} height - Current height of the chain
 * @property {function (h: number, options: ?Object): Promise<number>} awaitHeight - Wait for the chain to reach given height
 * @property {function (th: string, options: ?Object): Promise<string>} poll - Wait for transaction (hash) to be mined
 * @property {function (address: string, options: ?Object): Promise<number>} balance - Determine balance of public key `address`
 * @property {function (hash: string, options: ?Object): Promise<string>} tx - Find transaction by hash
 * @property {function (): Promise<string[]>} mempool - Open transactions in the mempool
 */

const Chain = stampit({
  deepProps: {Chain: {defaults: {waitMined: true}}},
  statics: {waitMined (bool) { return this.deepProps({Chain: {defaults: {waitMined: bool}}}) }}
}, required({
  methods: {
    sendTransaction: required,
    height: required,
    awaitHeight: required,
    poll: required,
    balance: required,
    tx: required,
    mempool: required
  }
}))

export default Chain
