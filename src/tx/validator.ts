import { RestError } from '@azure/core-rest-pipeline';
import { hash, isEncoded, verifySignature } from '../utils/crypto.js';
import { TxUnpacked } from './builder/schema.generated.js';
import { CtVersion, ProtocolToVmAbi } from './builder/field-types/ct-version.js';
import { Tag, ConsensusProtocolVersion } from './builder/constants.js';
import { buildTx, unpackTx } from './builder/index.js';
import { concatBuffers, isAccountNotFoundError } from '../utils/other.js';
import { Encoded, Encoding, decode } from '../utils/encoder.js';
import Node from '../Node.js';
import { Account } from '../apis/node/index.js';
import { genAggressiveCacheGetResponsesPolicy } from '../utils/autorest.js';
import { UnexpectedTsError } from '../utils/errors.js';
import getTransactionSignerAddress from './transaction-signer.js';
import { getExecutionCostUsingNode } from './execution-cost.js';

export interface ValidatorResult {
  message: string;
  key: string;
  checkedKeys: string[];
}

type Validator = (
  tx: TxUnpacked,
  options: {
    // TODO: remove after fixing node types
    account: Account & { id: Encoded.AccountAddress };
    nodeNetworkId: string;
    parentTxTypes: Tag[];
    node: Node;
    height: number;
    consensusProtocolVersion: ConsensusProtocolVersion;
  },
) => ValidatorResult[] | Promise<ValidatorResult[]>;

const validators: Validator[] = [];

async function verifyTransactionInternal(
  tx: TxUnpacked,
  node: Node,
  parentTxTypes: Tag[],
): Promise<ValidatorResult[]> {
  const address = getTransactionSignerAddress(buildTx(tx));
  const [account, { height }, { consensusProtocolVersion, nodeNetworkId }] = await Promise.all([
    node
      .getAccountByPubkey(address)
      .catch((error) => {
        if (!isAccountNotFoundError(error)) throw error;
        return { id: address, balance: 0n, nonce: 0 };
      })
      // TODO: remove after fixing https://github.com/aeternity/aepp-sdk-js/issues/1537
      .then((acc) => ({ ...acc, id: acc.id as Encoded.AccountAddress })),
    node.getCurrentKeyBlockHeight(), // TODO: don't request height on each validation, use caching
    node.getNodeInfo(),
  ]);

  return (
    await Promise.all(
      validators.map(async (v) =>
        v(tx, {
          node,
          account,
          height,
          consensusProtocolVersion,
          nodeNetworkId,
          parentTxTypes,
        }),
      ),
    )
  ).flat();
}

/**
 * Transaction Validator
 * This function validates some transaction properties,
 * to make sure it can be posted it to the chain
 * @category transaction builder
 * @param transaction - Base64Check-encoded transaction
 * @param nodeNotCached - Node to validate transaction against
 * @returns Array with verification errors
 * @example const errors = await verifyTransaction(transaction, node)
 */
export default async function verifyTransaction(
  transaction: Parameters<typeof unpackTx>[0],
  nodeNotCached: Node,
): Promise<ValidatorResult[]> {
  const pipeline = nodeNotCached.pipeline.clone();
  pipeline.removePolicy({ name: 'parse-big-int' });
  const node = new Node(nodeNotCached.$host, {
    ignoreVersion: true,
    pipeline,
    additionalPolicies: [genAggressiveCacheGetResponsesPolicy()],
  });
  node._getCachedStatus = async () => nodeNotCached._getCachedStatus();
  return verifyTransactionInternal(unpackTx(transaction), node, []);
}

validators.push(
  (tx, { account, nodeNetworkId, parentTxTypes }) => {
    if (tx.tag !== Tag.SignedTx) return [];
    const { encodedTx, signatures } = tx;
    if ((encodedTx ?? signatures) == null) return [];
    if (signatures.length !== 1) return []; // TODO: Support multisignature like in state channels
    const prefix = Buffer.from(
      [nodeNetworkId, ...(parentTxTypes.includes(Tag.PayingForTx) ? ['inner_tx'] : [])].join('-'),
    );
    const txBinary = decode(buildTx(encodedTx));
    const txWithNetworkId = concatBuffers([prefix, txBinary]);
    const txHashWithNetworkId = concatBuffers([prefix, hash(txBinary)]);
    if (
      verifySignature(txWithNetworkId, signatures[0], account.id) ||
      verifySignature(txHashWithNetworkId, signatures[0], account.id)
    )
      return [];
    return [
      {
        message:
          'Signature cannot be verified, please ensure that you transaction have' +
          ' the correct prefix and the correct private key for the sender address',
        key: 'InvalidSignature',
        checkedKeys: ['encodedTx', 'signatures'],
      },
    ];
  },
  async (tx, { node, parentTxTypes }) => {
    let nestedTx;
    if ('encodedTx' in tx) nestedTx = tx.encodedTx;
    if ('tx' in tx) nestedTx = tx.tx;
    if (nestedTx == null) return [];
    return verifyTransactionInternal(nestedTx, node, [...parentTxTypes, tx.tag]);
  },
  (tx, { height }) => {
    if (!('ttl' in tx)) return [];
    if (tx.ttl === 0 || tx.ttl > height) return [];
    return [
      {
        message: `TTL ${tx.ttl} is already expired, current height is ${height}`,
        key: 'ExpiredTTL',
        checkedKeys: ['ttl'],
      },
    ];
  },
  async (tx, { account, parentTxTypes, node }) => {
    if (parentTxTypes.length !== 0) return [];
    const cost = await getExecutionCostUsingNode(buildTx(tx), node).catch(() => 0n);
    if (cost <= account.balance) return [];
    return [
      {
        message: `Account balance ${account.balance} is not enough to execute the transaction that costs ${cost}`,
        key: 'InsufficientBalance',
        checkedKeys: ['amount', 'fee', 'nameFee', 'gasLimit', 'gasPrice'],
      },
    ];
  },
  async (tx, { node }) => {
    if (tx.tag !== Tag.SpendTx || isEncoded(tx.recipientId, Encoding.Name)) return [];
    const recipient = await node.getAccountByPubkey(tx.recipientId).catch((error) => {
      if (!isAccountNotFoundError(error)) throw error;
      return null;
    });
    if (recipient == null || recipient.payable === true) return [];
    return [
      {
        message: 'Recipient account is not payable',
        key: 'RecipientAccountNotPayable',
        checkedKeys: ['recipientId'],
      },
    ];
  },
  (tx, { account }) => {
    let message;
    if (tx.tag === Tag.SignedTx && account.kind === 'generalized' && tx.signatures.length !== 0) {
      message = "Generalized account can't be used to generate SignedTx with signatures";
    }
    if (tx.tag === Tag.GaMetaTx && account.kind === 'basic') {
      message = "Basic account can't be used to generate GaMetaTx";
    }
    if (message == null) return [];
    return [{ message, key: 'InvalidAccountType', checkedKeys: ['tag'] }];
  },
  // TODO: revert nonce check
  // TODO: ensure nonce valid when paying for own tx
  (tx, { consensusProtocolVersion }) => {
    const oracleCall = Tag.OracleRegisterTx === tx.tag;
    const contractCreate = Tag.ContractCreateTx === tx.tag || Tag.GaAttachTx === tx.tag;
    const contractCall = Tag.ContractCallTx === tx.tag || Tag.GaMetaTx === tx.tag;
    const type =
      (oracleCall ? 'oracle-call' : null) ??
      (contractCreate ? 'contract-create' : null) ??
      (contractCall ? 'contract-call' : null);
    if (type == null) return [];
    const protocol = ProtocolToVmAbi[consensusProtocolVersion][type] as {
      abiVersion: readonly any[];
      vmVersion: readonly any[];
    };

    let ctVersion: Partial<CtVersion> | undefined;
    if ('abiVersion' in tx) ctVersion = { abiVersion: tx.abiVersion };
    if ('ctVersion' in tx) ctVersion = tx.ctVersion;
    if (ctVersion == null) throw new UnexpectedTsError();
    if (
      !protocol.abiVersion.includes(ctVersion.abiVersion) ||
      (contractCreate && !protocol.vmVersion.includes(ctVersion.vmVersion))
    ) {
      return [
        {
          message: `ABI/VM version ${JSON.stringify(ctVersion)} is wrong, supported is: ${JSON.stringify(protocol)}`,
          key: 'VmAndAbiVersionMismatch',
          checkedKeys: ['ctVersion', 'abiVersion'],
        },
      ];
    }
    return [];
  },
  async (tx, { node }) => {
    if (Tag.ContractCallTx !== tx.tag) return [];
    // TODO: remove after solving https://github.com/aeternity/aeternity/issues/3669
    if (tx.contractId.startsWith('nm_')) return [];
    try {
      const { active } = await node.getContract(tx.contractId);
      if (active) return [];
      return [
        {
          message: `Contract ${tx.contractId} is not active`,
          key: 'ContractNotActive',
          checkedKeys: ['contractId'],
        },
      ];
    } catch (error) {
      if (!(error instanceof RestError) || error.response?.bodyAsText == null) throw error;
      return [
        {
          message: JSON.parse(error.response.bodyAsText).reason, // TODO: use parsedBody instead
          key: 'ContractNotFound',
          checkedKeys: ['contractId'],
        },
      ];
    }
  },
);
