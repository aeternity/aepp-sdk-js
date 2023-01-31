import { decode, Encoded } from '../utils/encoder';
import { AensName } from '../tx/builder/constants';
import AccountBase from '../account/Base';
import { concatBuffers } from '../utils/other';
import { isNameValid, produceNameId } from '../tx/builder/helpers';
import Node from '../Node';

/**
 * Helper to generate a signature to delegate
 *  - pre-claim/claim/transfer/revoke of a name to a contract.
 *  - register/extend/respond of an Oracle to a contract.
 * @category contract
 * @param contractAddress - Address of contract to delegate access
 * @param ids - The list of id's to prepend
 * @param options - Options
 * @param options.omitAddress - Prepend delegation signature with an account address
 * @param options.onAccount - Account to use
 * @param options.onNode - Node to use
 * @returns Signature
 * @example
 * ```js
 * const aeSdk = new AeSdk({ ... })
 * const contractAddress = 'ct_asd2ks...'
 * const aensName = 'example.chain'
 * const onAccount = new MemoryAccount(...) // Sign with a specific account
 * // Preclaim signature
 * const preclaimSig = await aeSdk.createDelegationSignature(contractAddress, [], { onAccount })
 * // Claim, transfer and revoke signature
 * const aensDelegationSig = await aeSdk
 *   .createDelegationSignature(contractAddress, [aensName], { onAccount })
 *
 * const oracleQueryId = 'oq_...'
 * const onAccount = new MemoryAccount(...) // Sign with a specific account
 * // Oracle register and extend signature
 * const oracleDelegationSig = await aeSdk
 *   .createDelegationSignature(contractAddress, [], { onAccount })
 * // Oracle respond signature
 * const respondSig = await aeSdk
 *   .createDelegationSignature(contractAddress, [oracleQueryId], { onAccount, omitAddress: true })
 * ```
 */
export default async function createDelegationSignature(
  contractAddress: Encoded.ContractAddress,
  ids: Array<Encoded.Any | AensName>,
  options: { omitAddress?: boolean; onAccount: AccountBase; onNode: Node },
): Promise<Uint8Array> {
  return options.onAccount.sign(
    concatBuffers([
      Buffer.from(await options.onNode.getNetworkId()),
      ...options.omitAddress === true ? [] : [decode(options.onAccount.address)],
      ...ids.map((e) => (isNameValid(e) ? produceNameId(e) : e)).map((e) => decode(e)),
      decode(contractAddress),
    ]),
    options,
  );
}
