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

import Ae from './ae'
import * as Crypto from './utils/crypto'
import Chain from './chain'
import EpochChain from './chain/epoch'
import Tx from './tx'
import EpochTx from './tx/epoch'
import JsTx from './tx/js'
import Account from './account'
import {PostMessageAccount, PostMessageAccountReceiver} from './account/post-message'
import MemoryAccount from './account/memory'
import Aens from './aens'
import Contract from './contract'

const Wallet = Ae.compose(EpochChain, EpochTx, JsTx, MemoryAccount, PostMessageAccountReceiver)
const Aepp = Ae.compose(EpochChain, EpochTx, JsTx, PostMessageAccount, Contract, Aens)

export default Ae

export {
  Wallet,
  Aepp,
  Crypto,
  Chain,
  EpochChain,
  Tx,
  EpochTx,
  Account,
  PostMessageAccount,
  PostMessageAccountReceiver,
  MemoryAccount,
  Aens,
  Contract
}
