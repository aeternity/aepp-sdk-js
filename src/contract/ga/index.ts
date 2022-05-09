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

/**
 * Generalized Account module - routines to use generalized account
 *
 * @module @aeternity/aepp-sdk/es/contract/ga
 * @export GeneralizedAccount
 * @example import { GeneralizedAccount } from '@aeternity/aepp-sdk'
 */
// @ts-expect-error TODO: remove me
import Ae from '../../ae'
import Contract, { _Contract } from '../../ae/contract'
// @ts-expect-error TODO: remove me
import { TX_TYPE } from '../../tx/builder/schema'
// @ts-expect-error TODO: remove me
import { buildContractIdByContractTx, buildTx, unpackTx } from '../../tx/builder'
import { prepareGaParams } from './helpers'
import { hash } from '../../utils/crypto'
import { decode, EncodedData } from '../../utils/encoder'
import { IllegalArgumentError, MissingParamError } from '../../utils/errors'
import { concatBuffers } from '../../utils/other'

export interface AuthData {
  gasLimit: number
  callData: string
  source?: string
  args?: object
}

interface GAObject {
  owner: string
  transaction: string
  rawTx: string
  gaContractId: string
}

interface Account {
  authFun: string
  balance: string
  contractId?: string
  id?: string
  kind: string
  nonce: number
  payable: true
}

export abstract class _GeneralizedAccount extends _Contract {
  /**
   * @alias module:@aeternity/aepp-sdk/es/contract/ga
   * Check if account is GA
   * @param address - Account address
   * @returns if account is GA
   */
  async isGA (address: string): Promise<boolean> {
    const { contractId } = await this.getAccount(address)
    return Boolean(contractId)
  }

  /**
   * Convert current account to GA
   * @alias module:@aeternity/aepp-sdk/es/contract/ga
   * @param authFnName - Authorization function name
   * @param source - Auth contract source code
   * @param args - init arguments
   * @param options - Options
   * @returns General Account Object
   */
  async createGeneralizedAccount (
    authFnName: string,
    source: string,
    args: any[] = [],
    options: object = {}):
    Promise<Readonly<GAObject>> {
    const opt = { ...this.Ae.defaults, ...options }
    const ownerId: string = await this.address(opt)
    if (await this.isGA(ownerId)) throw new IllegalArgumentError(`Account ${ownerId} is already GA`)

    const contract = await this.getContractInstance({ source })

    await contract.compile()
    const tx = await this.buildTx(TX_TYPE.gaAttach, {
      ...opt,
      gasLimit: opt.gasLimit ?? await contract._estimateGas('init', args, opt),
      ownerId,
      code: contract.bytecode,
      callData: contract.calldata.encode(contract._name, 'init', args),
      authFun: hash(authFnName)
    })
    const contractId = buildContractIdByContractTx(tx)
    const { hash: transaction, rawTx } = await this.send(tx, opt)

    return Object.freeze({
      owner: ownerId,
      transaction,
      rawTx,
      gaContractId: contractId
    })
  }

  /**
   * Create a metaTx transaction
   * @alias module:@aeternity/aepp-sdk/es/contract/ga
   * @param rawTransaction Inner transaction
   * @param authData Object with gaMeta params
   * @param authFnName - Authorization function name
   * @param options - Options
   * @returns Transaction string
   */
  async createMetaTx (
    rawTransaction: string,
    authData: AuthData,
    authFnName: string,
    options: object = {}): Promise<string> {
    if (Object.keys(authData).length <= 0) throw new MissingParamError('authData is required')
    // Check if authData is callData or if it's an object prepare a callData from source and args
    const { authCallData, gasLimit } = await prepareGaParams(this)(authData, authFnName)
    const opt = { ...this.Ae.defaults, ...options }
    const { abiVersion } = this.getVmVersion(TX_TYPE.contractCall)
    const wrappedTx = wrapInEmptySignedTx(unpackTx(rawTransaction))
    const params = {
      ...opt,
      tx: {
        ...wrappedTx,
        tx: wrappedTx.txObject
      },
      gaId: await this.address(opt),
      abiVersion,
      authData: authCallData,
      gasLimit,
      vsn: 2
    }
    const { fee }: {fee: number | string} = await this.prepareTxParams(TX_TYPE.gaMeta, params)
    const { rlpEncoded: metaTxRlp } = buildTx(
      { ...params, fee: `${fee}` },
      TX_TYPE.gaMeta,
      { vsn: 2 }
    )
    return wrapInEmptySignedTx(metaTxRlp).tx
  }

  /**
   * Build a transaction hash the same as `Auth.tx_hash`
   * @alias module:@aeternity/aepp-sdk/es/contract/ga
   * @param transaction tx-encoded transaction
   * @param options Options
   * @return Transaction hash
   */

  buildAuthTxHash (
    transaction: string,
    options?: {
      innerTx?: boolean
      networkId?: string
    }): Uint8Array {
    return new Uint8Array(hash(
      concatBuffers([Buffer.from(this.getNetworkId(options)), decode(transaction as EncodedData<'tx'>)])
    ))
  }

  /**
   * Get account by account public key
   * @instance
   * @abstract
   * @category async
   * @param address - Account public key
   * @param options - Options
   * @returns Account
  */
  abstract getAccount (address: string, options?: {
    height?: number
    hash?: string
    onNode?: string}): Promise<Account>

  abstract buildTx (txType: TX_TYPE, { ownerId, gasPrice }: {
    ownerId: string
    gasPrice?: number }, ...args: any[]): Promise<{
    tx: string
    contractId: string
  }>

  /**
   * Sign and post a transaction to the chain
   * @instance
   * @category async
   * @param tx - Transaction
   * @param options Options
   * @returns Transaction
   */
  abstract send (tx: any, options?: any): any

  /**
   * Validated vm/abi version or get default based on transaction type and NODE version
   *
   * @param txType Type of transaction
   * @param vmAbi Object with vm and abi version fields
   * @returns Object with vm/abi version ({ vmVersion: number, abiVersion: number })
   */
  abstract getVmVersion (
    txType: TX_TYPE,
    vmAbi?: {
      vmVersion: number
      abiVersion: number
    }): { vmVersion: number, abiVersion: number }

  /**
   * Calculate fee, get absolute ttl (ttl + height), get account nonce
   *
   * @param txType Type of transaction
   * @param params Object which contains all tx data
   * @return Object with account nonce, absolute ttl and transaction fee
   */
  abstract prepareTxParams (
    txType: TX_TYPE, ...args: any[]): Promise<{ ttl: number, nonce: number, fee: string | number }>

  abstract Ae: Ae
}

/**
   * GeneralizedAccount Stamp
   *
   * Provide Generalized Account implementation
   * {@link module:@aeternity/aepp-sdk/es/contract/ga} clients.
   * @alias module:@aeternity/aepp-sdk/es/contract/ga
   * @param options - Initializer object
   * @returns GeneralizedAccount instance
   * @example
   * const authContract = ``
   * await aeSdk.createGeneralizedAccount(authFnName, authContract, [...authFnArguments]
   * // Make spend using GA
   * const callData = 'cb_...' // encoded call data for auth contract
   * await aeSdk.spend(10000, receiverPub, { authData: { callData } })
   * // or
   * await aeSdk.spend(10000, receiverPub, {
   *   authData: { source: authContract, args: [...authContractArgs] }
   * }) // sdk will prepare callData itself
   */
export const GeneralizedAccount = Contract.compose<_GeneralizedAccount>({
  methods: {
    createGeneralizedAccount: _GeneralizedAccount.prototype.createGeneralizedAccount,
    createMetaTx: _GeneralizedAccount.prototype.createMetaTx,
    isGA: _GeneralizedAccount.prototype.isGA,
    buildAuthTxHash: _GeneralizedAccount.prototype.buildAuthTxHash
  }
})
export default GeneralizedAccount

const wrapInEmptySignedTx = (tx: string): {
  tx: string
  rlpEncoded: Uint8Array
  binary: any[]
  txObject: object
} => buildTx({ encodedTx: tx, signatures: [] }, TX_TYPE.signed)
