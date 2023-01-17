import BigNumber from 'bignumber.js';
import { hash, verify } from '../utils/crypto';
import { TxUnpacked } from './builder/schema';
import { CtVersion, ProtocolToVmAbi } from './builder/field-types/ct-version';
import { Tag, ConsensusProtocolVersion } from './builder/constants';
import { buildTx, unpackTx } from './builder';
import { concatBuffers, isAccountNotFoundError } from '../utils/other';
import { Encoded, decode } from '../utils/encoder';
import Node, { TransformNodeType } from '../Node';
import { Account } from '../apis/node';
import { genAggressiveCacheGetResponsesPolicy } from '../utils/autorest';
import { UnexpectedTsError } from '../utils/errors';

export interface ValidatorResult {
  message: string;
  key: string;
  checkedKeys: string[];
}

type Validator = (
  tx: TxUnpacked,
  options: {
    // TODO: remove after fixing node types
    account?: TransformNodeType<Account> & { id: Encoded.AccountAddress };
    nodeNetworkId: string;
    parentTxTypes: Tag[];
    node: Node;
    height: number;
    consensusProtocolVersion: ConsensusProtocolVersion;
  }
) => ValidatorResult[] | Promise<ValidatorResult[]>;

const validators: Validator[] = [];

const getSenderAddress = (tx: TxUnpacked): Encoded.AccountAddress | undefined => [
  'senderId', 'accountId', 'ownerId', 'callerId',
  'oracleId', 'fromId', 'initiator', 'gaId', 'payerId',
]
  .map((key: keyof TxUnpacked) => tx[key])
  .filter((a) => a)
  .map((a) => a?.toString().replace(/^ok_/, 'ak_'))[0] as Encoded.AccountAddress | undefined;

async function verifyTransactionInternal(
  tx: TxUnpacked,
  node: Node,
  parentTxTypes: Tag[],
): Promise<ValidatorResult[]> {
  const address = getSenderAddress(tx)
    ?? (tx.tag === Tag.SignedTx ? getSenderAddress(tx.encodedTx) : undefined);
  const [account, { height }, { consensusProtocolVersion, nodeNetworkId }] = await Promise.all([
    address == null
      ? undefined
      : node.getAccountByPubkey(address)
        .catch((error) => {
          if (!isAccountNotFoundError(error)) throw error;
          return { id: address, balance: 0n, nonce: 0 };
        })
        // TODO: remove after fixing https://github.com/aeternity/aepp-sdk-js/issues/1537
        .then((acc) => ({ ...acc, id: acc.id as Encoded.AccountAddress })),
    node.getCurrentKeyBlockHeight(),
    node.getNodeInfo(),
  ]);

  return (await Promise.all(
    validators.map((v) => v(
      tx,
      {
        node, account, height, consensusProtocolVersion, nodeNetworkId, parentTxTypes,
      },
    )),
  )).flat();
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
  const node = new Node(nodeNotCached.$host, { ignoreVersion: true });
  node.pipeline.addPolicy(genAggressiveCacheGetResponsesPolicy());
  return verifyTransactionInternal(unpackTx(transaction), node, []);
}

validators.push(
  (tx, { account, nodeNetworkId, parentTxTypes }) => {
    if (tx.tag !== Tag.SignedTx) return [];
    const { encodedTx, signatures } = tx;
    if ((encodedTx ?? signatures) == null) return [];
    if (account == null) return [];
    if (signatures.length !== 1) return []; // TODO: Support multisignature like in state channels
    const prefix = Buffer.from([
      nodeNetworkId,
      ...parentTxTypes.includes(Tag.PayingForTx) ? ['inner_tx'] : [],
    ].join('-'));
    const txBinary = decode(buildTx(encodedTx));
    const txWithNetworkId = concatBuffers([prefix, txBinary]);
    const txHashWithNetworkId = concatBuffers([prefix, hash(txBinary)]);
    if (verify(txWithNetworkId, signatures[0], account.id)
      || verify(txHashWithNetworkId, signatures[0], account.id)) return [];
    return [{
      message: 'Signature cannot be verified, please ensure that you transaction have'
        + ' the correct prefix and the correct private key for the sender address',
      key: 'InvalidSignature',
      checkedKeys: ['encodedTx', 'signatures'],
    }];
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
    if (tx.ttl === 0 || tx.ttl >= height) return [];
    return [{
      message: `TTL ${tx.ttl} is already expired, current height is ${height}`,
      key: 'ExpiredTTL',
      checkedKeys: ['ttl'],
    }];
  },
  (tx, { account, parentTxTypes }) => {
    if (account == null) return [];
    const cost = new BigNumber('fee' in tx ? tx.fee : 0)
      .plus('nameFee' in tx ? tx.nameFee : 0)
      .plus('amount' in tx ? tx.amount : 0)
      // TODO: calculate nested tx fee more accurate
      .plus(tx.tag === Tag.PayingForTx ? tx.tx.encodedTx.fee : 0)
      .minus(parentTxTypes.includes(Tag.PayingForTx) && 'fee' in tx ? tx.fee : 0);
    if (cost.lte(account.balance.toString())) return [];
    return [{
      message: `Account balance ${account.balance.toString()} is not enough to execute the transaction that costs ${cost.toFixed()}`,
      key: 'InsufficientBalance',
      checkedKeys: ['amount', 'fee', 'nameFee'],
    }];
  },
  (tx, { account }) => {
    if (account == null) return [];
    let message;
    if (tx.tag === Tag.SignedTx && account.kind === 'generalized' && tx.signatures.length !== 0) {
      message = 'Generalized account can\'t be used to generate SignedTx with signatures';
    }
    if (tx.tag === Tag.GaMetaTx && account.kind === 'basic') {
      message = 'Basic account can\'t be used to generate GaMetaTx';
    }
    if (message == null) return [];
    return [{ message, key: 'InvalidAccountType', checkedKeys: ['tag'] }];
  },
  (tx, { account, parentTxTypes }) => {
    if (!('nonce' in tx) || account == null || parentTxTypes.includes(Tag.GaMetaTx)) return [];
    const validNonce = account.nonce + 1;
    if (tx.nonce === validNonce) return [];
    return [{
      ...tx.nonce < validNonce
        ? {
          message: `Nonce ${tx.nonce} is already used, valid nonce is ${validNonce}`,
          key: 'NonceAlreadyUsed',
        }
        : {
          message: `Nonce ${tx.nonce} is too high, valid nonce is ${validNonce}`,
          key: 'NonceHigh',
        },
      checkedKeys: ['nonce'],
    }];
  },
  (tx, { consensusProtocolVersion }) => {
    const oracleCall = Tag.Oracle === tx.tag || Tag.OracleRegisterTx === tx.tag;
    const contractCreate = Tag.ContractCreateTx === tx.tag || Tag.GaAttachTx === tx.tag;
    const contractCall = Tag.ContractCallTx === tx.tag || Tag.GaMetaTx === tx.tag;
    const type = (oracleCall ? 'oracle-call' : null)
      ?? (contractCreate ? 'contract-create' : null)
      ?? (contractCall ? 'contract-call' : null);
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
      !protocol.abiVersion.includes(ctVersion.abiVersion)
      || (contractCreate && !protocol.vmVersion.includes(ctVersion.vmVersion))
    ) {
      return [{
        message: `ABI/VM version ${JSON.stringify(ctVersion)} is wrong, supported is: ${JSON.stringify(protocol)}`,
        key: 'VmAndAbiVersionMismatch',
        checkedKeys: ['ctVersion', 'abiVersion'],
      }];
    }
    return [];
  },
  async (tx, { node }) => {
    if (Tag.ContractCallTx !== tx.tag) return [];
    try {
      const { active } = await node.getContract(tx.contractId);
      if (active) return [];
      return [{
        message: `Contract ${tx.contractId} is not active`,
        key: 'ContractNotActive',
        checkedKeys: ['contractId'],
      }];
    } catch (error) {
      if (error.response?.parsedBody?.reason == null) throw error;
      return [{
        message: error.response.parsedBody.reason,
        key: 'ContractNotFound',
        checkedKeys: ['contractId'],
      }];
    }
  },
);
