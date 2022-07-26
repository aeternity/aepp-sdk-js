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
 */

import { AensName } from '../tx/builder/constants';
import { produceNameId } from '../tx/builder/helpers';
import { concatBuffers } from '../utils/other';
import { decode, Encoded } from '../utils/encoder';
import AccountBase from '../account/Base';
import Node from '../Node';

export { default as getContractInstance } from './aci';

/**
 * Utility method to create a delegate signature for a contract
 * @category contract
 * @param ids - The list of id's to prepend
 * @param opt - Options
 * @param opt.onNode - Node to use
 * @param opt.onAccount - Account to use
 * @returns Signature in hex representation
 */
async function delegateSignatureCommon(
  ids: Encoded.Any[],
  { onAccount, onNode, ...opt }:
  { onAccount: AccountBase; onNode: Node } & Parameters<AccountBase['sign']>[1],
): Promise<string> {
  const signature = await onAccount.sign(
    concatBuffers([
      Buffer.from((await onNode.getStatus()).networkId),
      ...ids.map((e) => decode(e)),
    ]),
    opt,
  );
  return Buffer.from(signature).toString('hex');
}

/**
 * Helper to generate a signature to delegate pre-claim/claim/transfer/revoke of a name to
 * a contract.
 * @category contract
 * @param contractId - Contract Id
 * @param opt - Options
 * @param opt.name - The name
 * @returns Signature for delegation
 * @example
 * ```js
 * const aeSdk = new AeSdk({ ... })
 * const contractId = 'ct_asd2ks...' // contract address
 * const name = 'example.chain' // AENS name
 * const onAccount = await aeSdk.address() // Sign with a specific account
 * // Preclaim signature
 * const preclaimSig = await aeSdk.createAensDelegationSignature(contractId, { onAccount: current })
 * // Claim, transfer and revoke signature
 * const aensDelegationSig = await contract.createAensDelegationSignature(
 *   contractId, { name, onAccount: current }
 * )
 * ```
 */
export async function createAensDelegationSignature(
  contractId: Encoded.ContractAddress,
  opt: Parameters<AccountBase['address']>[0] & Parameters<typeof delegateSignatureCommon>[1] &
  { name?: AensName },
): Promise<string> {
  return delegateSignatureCommon(
    [
      await opt.onAccount.address(opt),
      ...opt.name != null ? [produceNameId(opt.name)] : [],
      contractId,
    ],
    opt,
  );
}

/**
 * Helper to generate a signature to delegate register/extend/respond of a Oracle to a contract.
 * @category contract
 * @param contractId - Contract Id
 * @param opt - Options
 * @param opt.queryId - Oracle Query Id
 * @returns Signature for delegation
 * @example
 * ```js
 * const aeSdk = new AeSdk({ ... })
 * const contractId = 'ct_asd2ks...' // contract address
 * const queryId = 'oq_...' // Oracle Query Id
 * const onAccount = await aeSdk.address() // Sign with a specific account
 * // Oracle register and extend signature
 * const oracleDelegationSig = await aeSdk.createOracleDelegationSignature(contractId)
 * // Oracle respond signature
 * const respondSig = await aeSdk.createOracleDelegationSignature(contractId, { queryId })
 * ```
 */
export async function createOracleDelegationSignature(
  contractId: Encoded.ContractAddress,
  opt: Parameters<AccountBase['address']>[0] & Parameters<typeof delegateSignatureCommon>[1] &
  { queryId?: Encoded.OracleQueryId },
): Promise<string> {
  return delegateSignatureCommon(
    [opt.queryId ?? await opt.onAccount.address(opt), contractId],
    opt,
  );
}
