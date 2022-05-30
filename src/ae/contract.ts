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
import { decode, produceNameId } from '../tx/builder/helpers'
// @ts-expect-error TODO remove
import { getNetworkId } from '../node'
import { EncodedData, EncodingType } from '../utils/encoder'
import { Account } from '../account/resolver'
export { default as getContractInstance } from '../contract/aci'

// TODO remove and import from node once it's merged
type GetNetworkIdOptions = any
type SignOptions = object
type DelegateSigOptions = GetNetworkIdOptions & SignOptions

/**
 * Utility method to create a delegate signature for a contract
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param ids The list of id's to prepend
 * @param opt Options
 * @return Signature in hex representation
 */
async function delegateSignatureCommon (
  onAccount: Account,
  ids: Array<EncodedData<EncodingType>> = [],
  opt: DelegateSigOptions = {}
): Promise<string> {
  const signature = await onAccount.sign(
    Buffer.concat([
      Buffer.from(getNetworkId(onAccount, opt)),
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
export async function createAensDelegationSignature (
  { contractId, name, onAccount }: {
    contractId: EncodedData<'ct'>
    name?: string
    onAccount: Account
  }, opt: DelegateSigOptions = {}): Promise<string> {
  return await delegateSignatureCommon(
    onAccount,
    [await onAccount.address(opt),
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
export async function createOracleDelegationSignature ({
  onAccount,
  contractId,
  queryId
}: {
  onAccount: Account
  contractId: EncodedData<'ct'>
  queryId?: EncodedData<'ct'>
}, opt: DelegateSigOptions = {}): Promise<string> {
  return await delegateSignatureCommon(
    onAccount, [queryId ?? await onAccount.address(opt), contractId], opt)
}
