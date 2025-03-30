/**
 * Transaction Schema for TxBuilder
 */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import { Tag } from './constants.js';
import SchemaTypes from './SchemaTypes.js';
import abiVersion from './field-types/abi-version.js';
import address, { idTagToEncoding } from './field-types/address.js';
import array from './field-types/array.js';
import coinAmount from './field-types/coin-amount.js';
import ctVersion from './field-types/ct-version.js';
import encoded from './field-types/encoded.js';
import entry from './field-types/entry.js';
import enumeration from './field-types/enumeration.js';
import fee from './field-types/fee.js';
import gasLimit from './field-types/gas-limit.js';
import gasPrice from './field-types/gas-price.js';
import name from './field-types/name.js';
import nameFee from './field-types/name-fee.js';
import nameId from './field-types/name-id.js';
import nonce from './field-types/nonce.js';
import pointers from './field-types/pointers.js';
import queryFee from './field-types/query-fee.js';
import raw from './field-types/raw.js';
import shortUInt from './field-types/short-u-int.js';
import shortUIntConst from './field-types/short-u-int-const.js';
import string from './field-types/string.js';
import transaction from './field-types/transaction.js';
import ttl from './field-types/ttl.js';
import uInt from './field-types/u-int.js';
import withDefault from './field-types/with-default.js';
import withFormatting from './field-types/with-formatting.js';
import { Encoded, Encoding } from '../../utils/encoder.js';
import { ArgumentError } from '../../utils/errors.js';
import { EntryTag } from './entry/constants.js';
import { EntParams, EntUnpacked } from './entry/schema.generated.js';

export enum ORACLE_TTL_TYPES {
  delta = 0,
  block = 1,
}

// TODO: figure out how to omit overriding types of recursive fields
interface TransactionAny {
  serialize: (value: TxParams | Uint8Array | Encoded.Transaction) => Buffer;
  deserialize: (value: Buffer) => TxUnpacked;
  recursiveType: true;
}

const transactionAny = transaction() as unknown as TransactionAny;

interface TransactionSignedTx {
  serialize: (
    value: (TxParams & { tag: Tag.SignedTx }) | Uint8Array | Encoded.Transaction,
  ) => Buffer;
  deserialize: (value: Buffer) => TxUnpacked & { tag: Tag.SignedTx };
  recursiveType: true;
}

const transactionSignedTx = transaction(Tag.SignedTx) as unknown as TransactionSignedTx;

interface EntryTreesPoi {
  serialize: (
    value: (EntParams & { tag: EntryTag.TreesPoi }) | Uint8Array | Encoded.Transaction,
  ) => Buffer;
  deserialize: (value: Buffer) => EntUnpacked & { tag: EntryTag.TreesPoi };
  recursiveType: true;
}

const entryTreesPoi = entry(EntryTag.TreesPoi) as unknown as EntryTreesPoi;

const clientTtl = withDefault(60 * 60, shortUInt);
// https://github.com/aeternity/protocol/blob/fd17982/AENS.md#update
/**
 * Name ttl represented in number of blocks (Max value is 50000 blocks)
 */
const nameTtl = withFormatting((value) => {
  const NAME_TTL = 180000;
  value ??= NAME_TTL;
  if (value >= 1 && value <= NAME_TTL) return value;
  throw new ArgumentError('nameTtl', `a number between 1 and ${NAME_TTL} blocks`, value);
}, shortUInt);

/**
 * @see {@link https://github.com/aeternity/protocol/blob/c007deeac4a01e401238412801ac7084ac72d60e/serializations.md#accounts-version-1-basic-accounts}
 */
export const txSchema = [
  {
    tag: shortUIntConst(Tag.SignedTx),
    version: shortUIntConst(1, true),
    signatures: array(raw), // TODO: use sg_ (Encoding.Signature) instead
    encodedTx: transactionAny,
  },
  {
    tag: shortUIntConst(Tag.SpendTx),
    version: shortUIntConst(1, true),
    senderId: address(Encoding.AccountAddress),
    // TODO: accept also an AENS name
    recipientId: address(Encoding.AccountAddress, Encoding.ContractAddress, Encoding.Name),
    amount: coinAmount,
    fee,
    ttl,
    nonce: nonce('senderId'),
    payload: encoded(Encoding.Bytearray, true),
  },
  {
    tag: shortUIntConst(Tag.NamePreclaimTx),
    version: shortUIntConst(1, true),
    accountId: address(Encoding.AccountAddress),
    nonce: nonce('accountId'),
    commitmentId: address(Encoding.Commitment),
    fee,
    ttl,
  },
  {
    tag: shortUIntConst(Tag.NameClaimTx),
    version: shortUIntConst(2, true),
    accountId: address(Encoding.AccountAddress),
    nonce: nonce('accountId'),
    name,
    nameSalt: withDefault(0, uInt),
    nameFee,
    fee,
    ttl,
  },
  {
    tag: shortUIntConst(Tag.NameUpdateTx),
    version: shortUIntConst(1, true),
    accountId: address(Encoding.AccountAddress),
    nonce: nonce('accountId'),
    nameId,
    nameTtl,
    pointers: pointers(false),
    clientTtl,
    fee,
    ttl,
  },
  {
    tag: shortUIntConst(Tag.NameUpdateTx),
    version: shortUIntConst(2),
    accountId: address(Encoding.AccountAddress),
    nonce: nonce('accountId'),
    nameId,
    nameTtl,
    pointers: pointers(true),
    clientTtl,
    fee,
    ttl,
  },
  {
    tag: shortUIntConst(Tag.NameTransferTx),
    version: shortUIntConst(1, true),
    accountId: address(Encoding.AccountAddress),
    nonce: nonce('accountId'),
    nameId,
    // TODO: accept also an AENS name
    recipientId: address(Encoding.AccountAddress, Encoding.Name),
    fee,
    ttl,
  },
  {
    tag: shortUIntConst(Tag.NameRevokeTx),
    version: shortUIntConst(1, true),
    accountId: address(Encoding.AccountAddress),
    nonce: nonce('accountId'),
    nameId,
    fee,
    ttl,
  },
  {
    tag: shortUIntConst(Tag.ContractCreateTx),
    version: shortUIntConst(1, true),
    ownerId: address(Encoding.AccountAddress),
    nonce: nonce('ownerId'),
    code: encoded(Encoding.ContractBytearray),
    ctVersion,
    fee,
    ttl,
    deposit: withFormatting((value = 0) => {
      if (+value === 0) return value;
      throw new ArgumentError('deposit', 'equal 0 (because is not refundable)', value);
    }, coinAmount),
    amount: coinAmount,
    gasLimit,
    gasPrice,
    callData: encoded(Encoding.ContractBytearray),
  },
  {
    tag: shortUIntConst(Tag.ContractCallTx),
    version: shortUIntConst(1, true),
    callerId: address(Encoding.AccountAddress),
    nonce: nonce('callerId'),
    // TODO: accept also an AENS name
    contractId: address(Encoding.ContractAddress, Encoding.Name),
    abiVersion,
    fee,
    ttl,
    amount: coinAmount,
    gasLimit,
    gasPrice,
    callData: encoded(Encoding.ContractBytearray),
  },
  {
    tag: shortUIntConst(Tag.OracleRegisterTx),
    version: shortUIntConst(1, true),
    accountId: address(Encoding.AccountAddress),
    nonce: nonce('accountId'),
    queryFormat: string,
    responseFormat: string,
    queryFee: coinAmount,
    oracleTtlType: withDefault(ORACLE_TTL_TYPES.delta, enumeration(ORACLE_TTL_TYPES)),
    oracleTtlValue: withDefault(500, shortUInt),
    fee,
    ttl,
    abiVersion,
  },
  {
    tag: shortUIntConst(Tag.OracleExtendTx),
    version: shortUIntConst(1, true),
    // TODO: accept also an AENS name
    oracleId: address(Encoding.OracleAddress, Encoding.Name),
    nonce: nonce('oracleId'),
    oracleTtlType: withDefault(ORACLE_TTL_TYPES.delta, enumeration(ORACLE_TTL_TYPES)),
    oracleTtlValue: withDefault(500, shortUInt),
    fee,
    ttl,
  },
  {
    tag: shortUIntConst(Tag.OracleQueryTx),
    version: shortUIntConst(1, true),
    senderId: address(Encoding.AccountAddress),
    nonce: nonce('senderId'),
    // TODO: accept also an AENS name
    oracleId: address(Encoding.OracleAddress, Encoding.Name),
    query: string,
    queryFee,
    queryTtlType: withDefault(ORACLE_TTL_TYPES.delta, enumeration(ORACLE_TTL_TYPES)),
    queryTtlValue: withDefault(10, shortUInt),
    responseTtlType: withDefault(ORACLE_TTL_TYPES.delta, enumeration(ORACLE_TTL_TYPES)),
    responseTtlValue: withDefault(10, shortUInt),
    fee,
    ttl,
  },
  {
    tag: shortUIntConst(Tag.OracleRespondTx),
    version: shortUIntConst(1, true),
    oracleId: address(Encoding.OracleAddress),
    nonce: nonce('oracleId'),
    queryId: encoded(Encoding.OracleQueryId),
    response: string,
    responseTtlType: withDefault(ORACLE_TTL_TYPES.delta, enumeration(ORACLE_TTL_TYPES)),
    responseTtlValue: withDefault(10, shortUInt),
    fee,
    ttl,
  },
  {
    tag: shortUIntConst(Tag.ChannelCreateTx),
    version: shortUIntConst(2, true),
    initiator: address(Encoding.AccountAddress),
    initiatorAmount: uInt,
    responder: address(Encoding.AccountAddress),
    responderAmount: uInt,
    channelReserve: uInt,
    lockPeriod: uInt,
    ttl,
    fee,
    initiatorDelegateIds: array(address(...idTagToEncoding)),
    responderDelegateIds: array(address(...idTagToEncoding)),
    stateHash: encoded(Encoding.State),
    nonce: nonce('initiator'),
  },
  {
    tag: shortUIntConst(Tag.ChannelCloseMutualTx),
    version: shortUIntConst(1, true),
    channelId: address(Encoding.Channel),
    fromId: address(Encoding.AccountAddress),
    initiatorAmountFinal: uInt,
    responderAmountFinal: uInt,
    ttl,
    fee,
    nonce: nonce('fromId'),
  },
  {
    tag: shortUIntConst(Tag.ChannelCloseSoloTx),
    version: shortUIntConst(1, true),
    channelId: address(Encoding.Channel),
    fromId: address(Encoding.AccountAddress),
    payload: encoded(Encoding.Transaction),
    poi: entryTreesPoi,
    ttl,
    fee,
    nonce: nonce('fromId'),
  },
  {
    tag: shortUIntConst(Tag.ChannelSlashTx),
    version: shortUIntConst(1, true),
    channelId: address(Encoding.Channel),
    fromId: address(Encoding.AccountAddress),
    payload: encoded(Encoding.Transaction),
    poi: entryTreesPoi,
    ttl,
    fee,
    nonce: nonce('fromId'),
  },
  {
    tag: shortUIntConst(Tag.ChannelDepositTx),
    version: shortUIntConst(1, true),
    channelId: address(Encoding.Channel),
    fromId: address(Encoding.AccountAddress),
    amount: uInt,
    ttl,
    fee,
    stateHash: encoded(Encoding.State),
    round: shortUInt,
    nonce: nonce('fromId'),
  },
  {
    tag: shortUIntConst(Tag.ChannelWithdrawTx),
    version: shortUIntConst(1, true),
    channelId: address(Encoding.Channel),
    toId: address(Encoding.AccountAddress),
    amount: uInt,
    ttl,
    fee,
    stateHash: encoded(Encoding.State),
    round: shortUInt,
    nonce: nonce('fromId'),
  },
  {
    tag: shortUIntConst(Tag.ChannelSettleTx),
    version: shortUIntConst(1, true),
    channelId: address(Encoding.Channel),
    fromId: address(Encoding.AccountAddress),
    initiatorAmountFinal: uInt,
    responderAmountFinal: uInt,
    ttl,
    fee,
    nonce: nonce('fromId'),
  },
  {
    tag: shortUIntConst(Tag.ChannelForceProgressTx),
    version: shortUIntConst(1, true),
    channelId: address(Encoding.Channel),
    fromId: address(Encoding.AccountAddress),
    payload: encoded(Encoding.Transaction),
    round: shortUInt,
    update: encoded(Encoding.ContractBytearray),
    stateHash: encoded(Encoding.State),
    offChainTrees: encoded(Encoding.StateTrees),
    ttl,
    fee,
    nonce: nonce('fromId'),
  },
  {
    tag: shortUIntConst(Tag.ChannelOffChainTx),
    version: shortUIntConst(2, true),
    channelId: address(Encoding.Channel),
    round: shortUInt,
    stateHash: encoded(Encoding.State),
  },
  {
    tag: shortUIntConst(Tag.ChannelSnapshotSoloTx),
    version: shortUIntConst(1, true),
    channelId: address(Encoding.Channel),
    fromId: address(Encoding.AccountAddress),
    payload: encoded(Encoding.Transaction),
    ttl,
    fee,
    nonce: nonce('fromId'),
  },
  {
    tag: shortUIntConst(Tag.GaAttachTx),
    version: shortUIntConst(1, true),
    ownerId: address(Encoding.AccountAddress),
    nonce: nonce('ownerId'),
    code: encoded(Encoding.ContractBytearray),
    authFun: raw,
    ctVersion,
    fee,
    ttl,
    gasLimit,
    gasPrice,
    callData: encoded(Encoding.ContractBytearray),
  },
  {
    tag: shortUIntConst(Tag.GaMetaTx),
    version: shortUIntConst(2, true),
    gaId: address(Encoding.AccountAddress),
    authData: encoded(Encoding.ContractBytearray),
    abiVersion,
    fee,
    gasLimit,
    gasPrice,
    tx: transactionSignedTx,
  },
  {
    tag: shortUIntConst(Tag.PayingForTx),
    version: shortUIntConst(1, true),
    payerId: address(Encoding.AccountAddress),
    nonce: nonce('payerId'),
    fee,
    tx: transactionSignedTx,
  },
] as const;

type TxSchema = SchemaTypes<typeof txSchema>;
export type TxParams = TxSchema['TxParams'];
export type TxParamsAsync = TxSchema['TxParamsAsync'];
export type TxUnpacked = TxSchema['TxUnpacked'];
