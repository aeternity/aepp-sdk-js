/**
 * Generalized Account module - routines to use generalized account
 */

import { ConsensusProtocolVersion, Int, Tag } from '../tx/builder/constants';
import {
  buildContractIdByContractTx, buildTx, buildTxAsync, BuildTxOptions, unpackTx,
} from '../tx/builder';
import { hash } from '../utils/crypto';
import {
  decode, encode, Encoded, Encoding,
} from '../utils/encoder';
import { ArgumentError, IllegalArgumentError } from '../utils/errors';
import { concatBuffers } from '../utils/other';
import AccountBase from '../account/Base';
import Contract from './Contract';
import Node from '../Node';
import { sendTransaction, SendTransactionOptions, getAccount } from '../chain';
import CompilerBase from './compiler/Base';

/**
 * Convert current account to GA
 * @category contract
 * @param authFnName - Authorization function name
 * @param sourceCode - Auth contract source code
 * @param args - init arguments
 * @param options - Options
 * @returns General Account Object
 */
export async function createGeneralizedAccount(
  authFnName: string,
  args: any[],
  {
    onAccount, onCompiler, onNode, bytecode, aci, sourceCodePath, sourceCode, fileSystem, ...options
  }: CreateGeneralizedAccountOptions,
): Promise<Readonly<{
    owner: Encoded.AccountAddress;
    transaction: Encoded.TxHash;
    rawTx: Encoded.Transaction;
    gaContractId: Encoded.ContractAddress;
  }>> {
  const ownerId = onAccount.address;
  if ((await getAccount(ownerId, { onNode })).kind === 'generalized') {
    throw new IllegalArgumentError(`Account ${ownerId} is already GA`);
  }

  const contract = await Contract.initialize<{ init: (...a: any[]) => void }>({
    onAccount, onCompiler, onNode, bytecode, aci, sourceCodePath, sourceCode, fileSystem,
  });

  const tx = await buildTxAsync({
    ...options,
    tag: Tag.GaAttachTx,
    onNode,
    code: await contract.$compile(),
    gasLimit: options.gasLimit ?? await contract._estimateGas('init', args, options),
    ownerId,
    callData: contract._calldata.encode(contract._name, 'init', args),
    authFun: hash(authFnName),
  });
  const contractId = buildContractIdByContractTx(tx);
  const { hash: transaction, rawTx } = await sendTransaction(tx, {
    onNode, onAccount, onCompiler, ...options,
  });

  return Object.freeze({
    owner: ownerId,
    transaction,
    rawTx,
    gaContractId: contractId,
  });
}

interface CreateGeneralizedAccountOptions extends
  BuildTxOptions<Tag.GaAttachTx, 'authFun' | 'callData' | 'code' | 'ownerId' | 'gasLimit'>,
  SendTransactionOptions,
  Pick<
  Parameters<typeof Contract.initialize>[0],
  'bytecode' | 'aci' | 'sourceCodePath' | 'sourceCode' | 'fileSystem'
  > {
  onAccount: AccountBase;
  onCompiler: CompilerBase;
  onNode: Node;
  gasLimit?: number;
}

/**
 * Build a transaction hash the same as `Auth.tx_hash` by GaMetaTx payload
 * @category contract
 * @param transaction - tx-encoded transaction
 * @param options - Options
 * @param options.fee - GaMetaTx fee, required in Ceres
 * @param options.gasPrice - GaMetaTx gasPrice, required in Ceres
 * @param options.onNode - Node to use
 * @returns Transaction hash
 */
export async function buildAuthTxHash(
  transaction: Encoded.Transaction,
  { fee, gasPrice, onNode }: { fee?: Int; gasPrice?: Int; onNode: Node },
): Promise<Buffer> {
  const { nodeNetworkId, consensusProtocolVersion } = await onNode.getNodeInfo();
  let payload = hash(concatBuffers([Buffer.from(nodeNetworkId), decode(transaction)]));
  if (consensusProtocolVersion === ConsensusProtocolVersion.Ceres) {
    if (fee == null) throw new ArgumentError('fee', 'provided (in Ceres)', fee);
    if (gasPrice == null) throw new ArgumentError('gasPrice', 'provided (in Ceres)', gasPrice);
    payload = hash(decode(buildTx({
      tag: Tag.GaMetaTxAuthData,
      fee,
      gasPrice,
      txHash: encode(payload, Encoding.TxHash),
    })));
  }
  return payload;
}

/**
 * Build a transaction hash the same as `Auth.tx_hash` by GaMetaTx
 * @category contract
 * @param transaction - tx-encoded signed GaMeta transaction
 * @param options - Options
 * @param options.onNode - Node to use
 * @returns Transaction hash
 */
export async function buildAuthTxHashByGaMetaTx(
  transaction: Encoded.Transaction,
  { onNode }: { onNode: Node },
): Promise<Buffer> {
  const txParams = unpackTx(transaction, Tag.SignedTx);
  if (txParams.encodedTx.tag !== Tag.GaMetaTx) {
    throw new ArgumentError('transaction', 'to include GaMetaTx', Tag[txParams.encodedTx.tag]);
  }
  return buildAuthTxHash(buildTx(txParams.encodedTx.tx.encodedTx), {
    fee: txParams.encodedTx.fee,
    gasPrice: txParams.encodedTx.gasPrice,
    onNode,
  });
}
