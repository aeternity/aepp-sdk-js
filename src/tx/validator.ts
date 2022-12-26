import BigNumber from 'bignumber.js';
import { hash, verify } from '../utils/crypto';
import {
  PROTOCOL_VM_ABI,
  RawTxObject,
  TxParamsCommon,
  TxSchema,
} from './builder/schema';
import { Tag } from './builder/constants';
import { buildTx, unpackTx } from './builder';
import { UnsupportedProtocolError } from '../utils/errors';
import { concatBuffers, isAccountNotFoundError, isKeyOfObject } from '../utils/other';
import { Encoded, decode } from '../utils/encoder';
import Node, { TransformNodeType } from '../Node';
import { Account } from '../apis/node';
import { genAggressiveCacheGetResponsesPolicy } from '../utils/autorest';

export interface ValidatorResult {
  message: string;
  key: string;
  checkedKeys: string[];
}

type UnpackedTx = ReturnType<typeof unpackTx>['tx'];

type Validator = (
  tx: UnpackedTx,
  options: {
    // TODO: remove after fixing node types
    account?: TransformNodeType<Account> & { id: Encoded.AccountAddress };
    nodeNetworkId: string;
    parentTxTypes: Tag[];
    node: Node;
    height: number;
    consensusProtocolVersion: number;
  }
) => ValidatorResult[] | Promise<ValidatorResult[]>;

const validators: Validator[] = [];

const getSenderAddress = (
  tx: TxParamsCommon | RawTxObject<TxSchema>,
): Encoded.AccountAddress | undefined => [
  'senderId', 'accountId', 'ownerId', 'callerId',
  'oracleId', 'fromId', 'initiator', 'gaId', 'payerId',
]
  .map((key: keyof TxSchema) => tx[key])
  .filter((a) => a)
  .map((a) => a?.toString().replace(/^ok_/, 'ak_'))[0] as Encoded.AccountAddress | undefined;

async function verifyTransactionInternal(
  tx: UnpackedTx,
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
  ({ encodedTx, signatures }, { account, nodeNetworkId, parentTxTypes }) => {
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
  async ({ encodedTx, tx, tag }, { node, parentTxTypes }) => {
    if ((encodedTx ?? tx) == null) return [];
    return verifyTransactionInternal(encodedTx ?? tx, node, [...parentTxTypes, tag]);
  },
  ({ ttl }, { height }) => {
    if (ttl == null) return [];
    ttl = +ttl;
    if (ttl === 0 || ttl >= height) return [];
    return [{
      message: `TTL ${ttl} is already expired, current height is ${height}`,
      key: 'ExpiredTTL',
      checkedKeys: ['ttl'],
    }];
  },
  ({
    amount, fee, nameFee, tx, tag,
  }, { account, parentTxTypes }) => {
    if (account == null) return [];
    if ((amount ?? fee ?? nameFee) == null) return [];
    fee ??= 0;
    const cost = new BigNumber(fee).plus(nameFee ?? 0).plus(amount ?? 0)
      .plus(tag === Tag.PayingForTx ? tx.encodedTx.fee : 0)
      .minus(parentTxTypes.includes(Tag.PayingForTx) ? fee : 0);
    if (cost.lte(account.balance.toString())) return [];
    return [{
      message: `Account balance ${account.balance.toString()} is not enough to execute the transaction that costs ${cost.toFixed()}`,
      key: 'InsufficientBalance',
      checkedKeys: ['amount', 'fee', 'nameFee'],
    }];
  },
  ({ signatures, tag }, { account }) => {
    if (account == null) return [];
    let message;
    if (tag === Tag.SignedTx && account.kind === 'generalized' && signatures.length !== 0) {
      message = 'Generalized account can\'t be used to generate SignedTx with signatures';
    }
    if (tag === Tag.GaMetaTx && account.kind === 'basic') {
      message = 'Basic account can\'t be used to generate GaMetaTx';
    }
    if (message == null) return [];
    return [{ message, key: 'InvalidAccountType', checkedKeys: ['tag'] }];
  },
  ({ nonce }, { account, parentTxTypes }) => {
    if (nonce == null || account == null || parentTxTypes.includes(Tag.GaMetaTx)) return [];
    nonce = +nonce;
    const validNonce = account.nonce + 1;
    if (nonce === validNonce) return [];
    return [{
      ...nonce < validNonce
        ? {
          message: `Nonce ${nonce} is already used, valid nonce is ${validNonce}`,
          key: 'NonceAlreadyUsed',
        }
        : {
          message: `Nonce ${nonce} is too high, valid nonce is ${validNonce}`,
          key: 'NonceHigh',
        },
      checkedKeys: ['nonce'],
    }];
  },
  ({ ctVersion, abiVersion, tag }, { consensusProtocolVersion }) => {
    if (!isKeyOfObject(consensusProtocolVersion, PROTOCOL_VM_ABI)) {
      throw new UnsupportedProtocolError(`Unsupported protocol: ${consensusProtocolVersion}`);
    }
    const protocol = PROTOCOL_VM_ABI[consensusProtocolVersion];

    // If not contract create tx
    if (ctVersion == null) ctVersion = { abiVersion };
    const txProtocol = protocol[tag as keyof typeof protocol];
    if (txProtocol == null) return [];
    if (Object.entries(ctVersion).some(
      ([
        key,
        value,
      ]: [
        key:keyof typeof txProtocol,
        value:any]) => !(txProtocol[key].includes(+value as never)),
    )) {
      return [{
        message: `ABI/VM version ${JSON.stringify(ctVersion)} is wrong, supported is: ${JSON.stringify(txProtocol)}`,
        key: 'VmAndAbiVersionMismatch',
        checkedKeys: ['ctVersion', 'abiVersion'],
      }];
    }
    return [];
  },
  async ({ contractId, tag }, { node }) => {
    if (Tag.ContractCallTx !== tag) return [];
    contractId = contractId as Encoded.ContractAddress;
    try {
      const { active } = await node.getContract(contractId);
      if (active) return [];
      return [{
        message: `Contract ${contractId} is not active`,
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
