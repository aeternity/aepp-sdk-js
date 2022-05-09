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
 * Contract module - routines to interact with the æternity contract
 *
 * High level documentation of the contracts are available at
 * https://github.com/aeternity/protocol/tree/master/contracts and
 *
 * @module @aeternity/aepp-sdk/es/ae/contract
 * @export Contract
 * @example import { Contract } from '@aeternity/aepp-sdk'
 */

// @ts-expect-error TODO remove
import Ae from '.'
import ContractCompilerHttp from '../contract/compiler'
import getContractInstance from '../contract/aci'
// @ts-expect-error TODO remove
import { AMOUNT } from '../tx/builder/schema'
// @ts-expect-error TODO remove
import { decode, produceNameId } from '../tx/builder/helpers'
// @ts-expect-error TODO remove
import { getNetworkId } from '../node'
import { concatBuffers } from '../utils/other'

export abstract class _Contract {
  /**
   * Utility method to create a delegate signature for a contract
   * @alias module:@aeternity/aepp-sdk/es/ae/contract
   * @category async
   * @param ids The list of id's to prepend
   * @param opt Options
   * @return Signature in hex representation
   */
  async delegateSignatureCommon (
    ids: string[] = [],
    opt: { onAccount?: string | object } = {}): Promise<string> {
    const signature = await this.sign(
      concatBuffers([
        Buffer.from(this.getNetworkId(opt)),
        ...ids.map(e => decode(e))
      ]),
      opt
    )
    return Buffer.from(signature).toString('hex')
  }

  /**
   * Helper to generate a signature to delegate pre-claim/claim/transfer/revoke of a name to
   * a contract.
   * @alias module:@aeternity/aepp-sdk/es/ae/contract
   * @category async
  *  @param args
   * @param args.contractId Contract Id
   * @param args.name The name
   * @param opt Options
   * @returns Signature for delegation
   * @example
   * const aeSdk = await Universal({ ... })
   * const contractId = 'ct_asd2ks...' // contract address
   * const name = 'example.chain' // AENS name
   * const onAccount = await aeSdk.address() // Sign with a specific account
   * // Preclaim signature
   * const params = { contractId }
   * const preclaimSig = await aeSdk.createAensDelegationSignature(params, { onAccount: current })
   * // Claim, transfer and revoke signature
   * const params = { contractId, name }
   * const aensDelegationSig = await contract.createAensDelegationSignature(
   *   params, name, { onAccount: current }
   * )
   */
  async createAensDelegationSignature (
    { contractId, name }: {contractId: string, name?: string[]},
    opt: { onAccount?: string | object } = {}): Promise<string> {
    return await this.delegateSignatureCommon(
      [await this.address(opt),
        ...(name?.length ?? -1) > 0 ? [produceNameId(name)] : [],
        contractId],
      opt
    )
  }

  /**
   * Helper to generate a signature to delegate register/extend/respond of a Oracle to a contract.
   * @alias module:@aeternity/aepp-sdk/es/ae/contract
   * @category async
   * @param args
   * @param args.contractId Contract Id
   * @param args.queryId Oracle Query Id
   * @param opt Options
   * @returns Signature for delegation
   * @example
   * const aeSdk = await Universal({ ... })
   * const contractId = 'ct_asd2ks...' // contract address
   * const queryId = 'oq_...' // Oracle Query Id
   * const onAccount = await aeSdk.address() // Sign with a specific account
   * // Oracle register and extend signature
   * const params = { contractId }
   * const oracleDelegationSig =
   * await contract.createOracleDelegationSignature(params, { onAccount })
   * // Oracle respond signature
   * const params = { contractId, queryId }
   * const respondSig = await contract.createOracleDelegationSignature(params, queryId)
   */
  async createOracleDelegationSignature ({
    contractId,
    queryId
  }: {
    contractId: string
    queryId?: string
  }, opt: { onAccount?: string | object } = {}): Promise<string> {
    return await this.delegateSignatureCommon([queryId ?? await this.address(opt), contractId], opt)
  }

  /**
   * Get network Id
   * @instance
   * @function getNetworkId
   * @category async
   * @rtype () => networkId: String
   * @returns Network Id
   */
  readonly getNetworkId = getNetworkId

  /**
   * Generate contract ACI object with predefined js methods for contract usage - can be used for
   * creating a reference to already deployed contracts
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @param options Options object
   * @returns JS Contract API
   * @example
   * const contractIns = await aeSdk.getContractInstance({ source })
   * await contractIns.deploy([321]) or await contractIns.methods.init(321)
   * const callResult = await contractIns.call('setState', [123]) or
   * await contractIns.methods.setState.send(123, options)
   * const staticCallResult = await contractIns.call('setState', [123], { callStatic: true }) or
   * await contractIns.methods.setState.get(123, options)
   * Also you can call contract like: await contractIns.methods.setState(123, options)
   * Then sdk decide to make on-chain or static call(dry-run API) transaction based on function is
   * stateful or not
   */
  readonly getContractInstance = getContractInstance

  /**
   * Sign data blob
   * @instance
   * @abstract
   * @category async
   * @param data - Data blob to sign
   * @param options
   * @returns Signed data blob
   */
  abstract sign (data: string | Buffer, options?: object): Promise<Uint8Array>

  /**
      * Obtain account address
      * @instance
      * @abstract
      * @category async
      * @return {String} Public account address
      */
  abstract address (opt?: object): Promise<string>
}

/**
 * Contract Stamp
 *
 * Provide contract implementation
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} clients.
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @returns Contract instance
 * @example
 * import { Transaction, MemoryAccount, ChainNode } from '@aeternity/aepp-sdk
 *
 * const ContractWithAE = await Contract
 *    .compose(Transaction, MemoryAccount, ChainNode) // AE implementation
 * const client = await ContractWithAe({ url, compilerUrl, keypair, ... }) *
 */

export default Ae.compose<_Contract>(ContractCompilerHttp, {
  methods: {
    getContractInstance,
    // Delegation for contract
    delegateSignatureCommon: _Contract.prototype.delegateSignatureCommon,
    // AENS
    createAensDelegationSignature: _Contract.prototype.createAensDelegationSignature,
    // Oracle
    createOracleDelegationSignature: _Contract.prototype.createOracleDelegationSignature
  },
  deepProps: {
    Ae: {
      defaults: {
        amount: AMOUNT
      }
    }
  }
})
