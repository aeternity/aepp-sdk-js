/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
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

export * from './chain'
export * from './utils/crypto'
export * from './utils/keystore'
export * from './utils/bytes'
export * from './tx'
export * from './tx/builder'
export * from './tx/builder/helpers'
export * from './tx/builder/schema'
export * from './utils/amount-formatter'
export * from './utils/hd-wallet'
export * from './ae/contract'
export * from './contract/ga'

// @ts-expect-error
export { default as Ae } from './ae'
export { default as Node } from './node'
export { default as NodePool } from './node-pool'
export { default as verifyTransaction } from './tx/validator'
export { default as AccountBase } from './account/base'
export { default as AccountMultiple } from './account/multiple'
export { default as MemoryAccount } from './account/memory'
// @ts-expect-error
export { default as Aens } from './ae/aens'
export { default as ContractCompilerHttp } from './contract/compiler'
// @ts-expect-error
export { default as RpcAepp } from './ae/aepp'
// @ts-expect-error
export { default as RpcWallet } from './ae/wallet'
// @ts-expect-error
export { default as Oracle } from './ae/oracle'
export { default as Channel } from './channel'
// @ts-expect-error
export { default as Universal } from './ae/universal'

export { default as connectionProxy } from './utils/aepp-wallet-communication/connection-proxy'
export * from './utils/aepp-wallet-communication/schema'
export { default as walletDetector } from './utils/aepp-wallet-communication/wallet-detector'
export { default as BrowserRuntimeConnection } from './utils/aepp-wallet-communication/connection/BrowserRuntime'
export { default as BrowserWindowMessageConnection } from './utils/aepp-wallet-communication/connection/BrowserWindowMessage'
export * from './utils/errors'
