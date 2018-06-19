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

/**
 * @typedef {{ sender: string, recipient: number, amount: number, fee: number, ttl: number, nonce: number, payload: string }} SpendTx
 */
/**
 * @typedef {{ account: string, nonce: number, commitment: string, fee: number, ttl: number }} NamePreclaimTx
 */
/**
 * @typedef {{ account: string, nonce: number, name: string, nameSalt: string, fee: number, ttl: number }} NameClaimTx
 */
/**
 * @typedef {{ account: string, nonce: number, nameHash: string, recipientAccunt: string, fee: number, ttl: number }} NameTransferTx
 */
/**
 * @typedef {{ account: string, nonce: number, nameHash: string, nameTtl: number, pointers: string, clientTtl: number, fee: number, ttl: number }} NameUpdateTx
 */
/**
 * @typedef {{ account: string, nonce: number, nameHash: string, fee: number, ttl: number }} NameRevokeTx
 */
/**
 * @typedef {{ owner: string, nonce: number, code: string, vmVersion: number, deposit: number, amount: number, gas: number, gasPrice: number, fee: number, ttl: number, callData: string }} ContractCreateTx
 */
/**
 * @typedef {{ caller: string, nonce: number, contract: string, vmVersion: number, fee: number, ttl: number, amount: number, gas: number, gasPrice: number, callData: string }} ContractCallTx
 */

/**
 * @typedef {Object} Tx
 * @property {function (data: SpendTx): Promise<string>} spend - Create a `spend_tx` transaction
 * @property {function (data: NamePreclaimTx): Promise<string>} namePreclaim - Create a `name_preclaim` transaction
 * @property {function (data: NameClaimTx): Promise<string>} nameClaim - Create a `name_claim` transaction
 * @property {function (data: NameTransferTx): Promise<string>} nameTransfer - Create a `name_transfer` transaction
 * @property {function (data: NameUpdateTx): Promise<string>} nameUpdate - Create a `name_update` transaction
 * @property {function (data: NameRevokeTx): Promise<string>} nameRevoke - Create a `name_revoke` transaction
 * @property {function (data: ContractCreateTx): Promise<string>} contractCreate - Create a `contract_create` transaction
 * @property {function (data: ContractCallTx): Promise<string>} contractCall - Create a `contract_call` transaction
 * @property {function (name: string): Promise<string>} commitmentHash - Create a commitment hash
 */
