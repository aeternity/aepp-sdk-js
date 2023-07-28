import { decode, Encoded } from '../utils/encoder';
import { ArgumentError } from '../utils/errors';
import { AensName } from '../tx/builder/constants';
import AccountBase from '../account/Base';
import { isNameValid } from '../tx/builder/helpers';
import Node from '../Node';

function ensureOracleQuery(oq: string): asserts oq is Encoded.OracleQueryId {
  if (!oq.startsWith('oq_')) throw new ArgumentError('oq', 'oracle query', oq);
}

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
 * @deprecated use methods `sign*DelegationToContract` of Account instance instead
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
  { onAccount, omitAddress, ...options }: {
    omitAddress?: boolean;
    onAccount: AccountBase;
    onNode: Node;
  },
): Promise<Uint8Array> {
  if (ids.length > 1) throw new ArgumentError('ids', 'shorter than 2', ids);
  const networkId = await options.onNode.getNetworkId();
  if (ids.length === 0) {
    if (omitAddress === true) {
      throw new ArgumentError('omitAddress', 'equal false', omitAddress);
    }
    return decode(await onAccount.signDelegationToContract(contractAddress, { networkId }));
  }

  const [payload] = ids;
  if (isNameValid(payload)) {
    if (omitAddress === true) {
      throw new ArgumentError('omitAddress', 'equal false', omitAddress);
    }
    return decode(
      await onAccount.signNameDelegationToContract(contractAddress, payload, { networkId }),
    );
  }

  ensureOracleQuery(payload);
  if (omitAddress !== true) {
    throw new ArgumentError('omitAddress', 'equal true', omitAddress);
  }
  return decode(
    await onAccount.signOracleQueryDelegationToContract(contractAddress, payload, { networkId }),
  );
}
