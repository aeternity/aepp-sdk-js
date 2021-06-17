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

import * as Crypto from './utils/crypto'
import * as Keystore from './utils/keystore'
import * as Bytes from './utils/bytes'
import * as TxBuilder from './tx/builder'
import * as TxBuilderHelper from './tx/builder/helpers'
import * as SCHEMA from './tx/builder/schema'
import * as ACIHelpers from './contract/aci/helpers'
import * as ACITransformation from './contract/aci/transformation'
import * as AmountFormatter from './utils/amount-formatter'
import HdWallet from './utils/hd-wallet'

import Ae from './ae'
import Chain from './chain'
import ChainNode from './chain/node'
import Node from './node'
import NodePool from './node-pool'
import Tx from './tx'
import Transaction from './tx/tx'
import TransactionValidator from './tx/validator'
import AccountBase from './account/base'
import AccountMultiple from './account/multiple'
import MemoryAccount from './account/memory'
import Aens from './ae/aens'
import Contract from './ae/contract'
import GeneralizeAccount from './contract/ga'
import ContractCompilerAPI from './contract/compiler'
import RpcAepp from './ae/aepp'
import RpcWallet from './ae/wallet'
import Oracle from './ae/oracle'
import genSwaggerClient from './utils/swagger'
import Channel from './channel'
import Universal from './ae/universal'

export { default as ContentScriptBridge } from './utils/aepp-wallet-communication/content-script-bridge'
export * as AeppWalletHelpers from './utils/aepp-wallet-communication/helpers'
export * as AeppWalletSchema from './utils/aepp-wallet-communication/schema'
export { default as WalletDetector } from './utils/aepp-wallet-communication/wallet-detector'
export { default as BrowserRuntimeConnection } from './utils/aepp-wallet-communication/connection/browser-runtime'
export { default as BrowserWindowMessageConnection } from './utils/aepp-wallet-communication/connection/browser-window-message'

export {
  AmountFormatter,
  AccountBase,
  AccountMultiple,
  Ae,
  Aens,
  Bytes,
  Contract,
  ContractCompilerAPI,
  ACIHelpers,
  ACITransformation,
  ChainNode,
  RpcAepp,
  RpcWallet,
  Channel,
  Crypto,
  Keystore,
  Chain,
  GeneralizeAccount,
  HdWallet,
  MemoryAccount,
  Node,
  NodePool,
  Oracle,
  genSwaggerClient,
  Transaction,
  TransactionValidator,
  Tx,
  TxBuilder,
  TxBuilderHelper,
  Universal,
  SCHEMA
}
