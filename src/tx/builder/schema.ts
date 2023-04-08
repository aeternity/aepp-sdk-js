/**
 * Transaction Schema for TxBuilder
 */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import { Tag } from './constants';
import SchemaTypes from './SchemaTypes';
import {
  uInt, shortUInt, coinAmount, name, nameId, nameFee, deposit, gasLimit, gasPrice, fee,
  address, pointers, entry, enumeration, mptree, shortUIntConst, string, encoded, raw,
  array, boolean, ctVersion, abiVersion, ttl, nonce, map, wrapped,
} from './field-types';
import { Encoded, Encoding } from '../../utils/encoder';
import { idTagToEncoding } from './field-types/address';

export enum ORACLE_TTL_TYPES {
  delta = 0,
  block = 1,
}

// # ORACLE
export const ORACLE_TTL = { type: ORACLE_TTL_TYPES.delta, value: 500 };
export const QUERY_TTL = { type: ORACLE_TTL_TYPES.delta, value: 10 };
export const RESPONSE_TTL = { type: ORACLE_TTL_TYPES.delta, value: 10 };
// # CONTRACT
export const DRY_RUN_ACCOUNT = {
  pub: 'ak_11111111111111111111111111111111273Yts',
  amount: 100000000000000000000000000000000000n,
} as const;

export enum CallReturnType {
  Ok = 0,
  Error = 1,
  Revert = 2,
}

// TODO: figure out how to omit overriding types of recursive fields
interface EntryAny {
  serialize: (value: TxParams | Uint8Array | Encoded.Transaction) => Buffer;
  deserialize: (value: Buffer) => TxUnpacked;
  recursiveType: true;
}

const entryAny = entry() as unknown as EntryAny;

interface EntrySignedTx {
  serialize: (value: TxParams & { tag: Tag.SignedTx } | Uint8Array | Encoded.Transaction) => Buffer;
  deserialize: (value: Buffer) => TxUnpacked & { tag: Tag.SignedTx };
  recursiveType: true;
}

const entrySignedTx = entry(Tag.SignedTx) as unknown as EntrySignedTx;

interface EntryMtreeValueArray {
  serialize: (
    value: Array<TxParams & { tag: Tag.MtreeValue } | Uint8Array | Encoded.Transaction>,
  ) => Buffer[];
  deserialize: (value: Buffer[]) => Array<TxUnpacked & { tag: Tag.MtreeValue }>;
  recursiveType: true;
}

const entryMtreeValueArray = array(entry(Tag.MtreeValue)) as unknown as EntryMtreeValueArray;

interface EntryTreesPoi {
  serialize: (value: TxParams & { tag: Tag.TreesPoi } | Uint8Array | Encoded.Transaction) => Buffer;
  deserialize: (value: Buffer) => TxUnpacked & { tag: Tag.TreesPoi };
  recursiveType: true;
}

const entryTreesPoi = entry(Tag.TreesPoi) as unknown as EntryTreesPoi;

interface MapContracts {
  serialize: (
    value: Record<Encoded.ContractAddress, TxParams & { tag: Tag.Contract }>,
  ) => Buffer;
  deserialize: (
    value: Buffer,
  ) => Record<Encoded.ContractAddress, TxUnpacked & { tag: Tag.Contract }>;
  recursiveType: true;
}

const mapContracts = map(Encoding.ContractAddress, Tag.Contract) as unknown as MapContracts;

interface MapAccounts {
  serialize: (
    value: Record<Encoded.AccountAddress, TxParams & { tag: Tag.Account }>,
  ) => Buffer;
  deserialize: (value: Buffer) => Record<Encoded.AccountAddress, TxUnpacked & { tag: Tag.Account }>;
  recursiveType: true;
}

const mapAccounts = map(Encoding.AccountAddress, Tag.Account) as unknown as MapAccounts;

interface MapCalls {
  serialize: (
    value: Record<Encoded.Bytearray, TxParams & { tag: Tag.ContractCall }>,
  ) => Buffer;
  deserialize: (value: Buffer) => Record<Encoded.Bytearray, TxUnpacked & { tag: Tag.ContractCall }>;
  recursiveType: true;
}

const mapCalls = map(Encoding.Bytearray, Tag.ContractCall) as unknown as MapCalls;

interface MapChannels {
  serialize: (
    value: Record<Encoded.Channel, TxParams & { tag: Tag.Channel }>,
  ) => Buffer;
  deserialize: (value: Buffer) => Record<Encoded.Channel, TxUnpacked & { tag: Tag.Channel }>;
  recursiveType: true;
}

const mapChannels = map(Encoding.Channel, Tag.Channel) as unknown as MapChannels;

interface MapNames {
  serialize: (
    value: Record<Encoded.Name, TxParams & { tag: Tag.Name }>,
  ) => Buffer;
  deserialize: (value: Buffer) => Record<Encoded.Name, TxUnpacked & { tag: Tag.Name }>;
  recursiveType: true;
}

const mapNames = map(Encoding.Name, Tag.Name) as unknown as MapNames;

interface MapOracles {
  serialize: (
    value: Record<Encoded.OracleAddress, TxParams & { tag: Tag.Oracle }>,
  ) => Buffer;
  deserialize: (value: Buffer) => Record<Encoded.OracleAddress, TxUnpacked & { tag: Tag.Oracle }>;
  recursiveType: true;
}

const mapOracles = map(Encoding.OracleAddress, Tag.Oracle) as unknown as MapOracles;

/**
 * @see {@link https://github.com/aeternity/protocol/blob/c007deeac4a01e401238412801ac7084ac72d60e/serializations.md#accounts-version-1-basic-accounts}
 */
export const txSchema = [{
  tag: shortUIntConst(Tag.Account),
  version: shortUIntConst(1),
  nonce: shortUInt,
  balance: uInt,
}, {
  tag: shortUIntConst(Tag.Account),
  version: shortUIntConst(2, true),
  flags: uInt,
  nonce: shortUInt,
  balance: uInt,
  gaContract: address(Encoding.ContractAddress, Encoding.Name),
  gaAuthFun: encoded(Encoding.ContractBytearray),
}, {
  tag: shortUIntConst(Tag.SignedTx),
  version: shortUIntConst(1, true),
  signatures: array(raw),
  encodedTx: entryAny,
}, {
  tag: shortUIntConst(Tag.SpendTx),
  version: shortUIntConst(1, true),
  senderId: address(Encoding.AccountAddress),
  recipientId: address(Encoding.AccountAddress, Encoding.Name),
  amount: coinAmount,
  fee,
  ttl,
  nonce: nonce('senderId'),
  payload: encoded(Encoding.Bytearray, true),
}, {
  tag: shortUIntConst(Tag.Name),
  version: shortUIntConst(1, true),
  accountId: address(Encoding.AccountAddress),
  nameTtl: shortUInt,
  status: raw,
  clientTtl: shortUInt,
  pointers,
}, {
  tag: shortUIntConst(Tag.NamePreclaimTx),
  version: shortUIntConst(1, true),
  accountId: address(Encoding.AccountAddress),
  nonce: nonce('accountId'),
  commitmentId: address(Encoding.Commitment),
  fee,
  ttl,
}, {
  tag: shortUIntConst(Tag.NameClaimTx),
  version: shortUIntConst(2, true),
  accountId: address(Encoding.AccountAddress),
  nonce: nonce('accountId'),
  name,
  nameSalt: uInt,
  nameFee,
  fee,
  ttl,
}, {
  tag: shortUIntConst(Tag.NameUpdateTx),
  version: shortUIntConst(1, true),
  accountId: address(Encoding.AccountAddress),
  nonce: nonce('accountId'),
  nameId,
  nameTtl: shortUInt,
  pointers,
  clientTtl: shortUInt,
  fee,
  ttl,
}, {
  tag: shortUIntConst(Tag.NameTransferTx),
  version: shortUIntConst(1, true),
  accountId: address(Encoding.AccountAddress),
  nonce: nonce('accountId'),
  nameId,
  recipientId: address(Encoding.AccountAddress, Encoding.Name),
  fee,
  ttl,
}, {
  tag: shortUIntConst(Tag.NameRevokeTx),
  version: shortUIntConst(1, true),
  accountId: address(Encoding.AccountAddress),
  nonce: nonce('accountId'),
  nameId,
  fee,
  ttl,
}, {
  tag: shortUIntConst(Tag.Contract),
  version: shortUIntConst(1, true),
  owner: address(Encoding.AccountAddress),
  ctVersion,
  code: encoded(Encoding.ContractBytearray),
  log: encoded(Encoding.ContractBytearray),
  active: boolean,
  referers: array(address(Encoding.AccountAddress)),
  deposit,
}, {
  tag: shortUIntConst(Tag.ContractCreateTx),
  version: shortUIntConst(1, true),
  ownerId: address(Encoding.AccountAddress),
  nonce: nonce('ownerId'),
  code: encoded(Encoding.ContractBytearray),
  ctVersion,
  fee,
  ttl,
  deposit,
  amount: coinAmount,
  gasLimit,
  gasPrice,
  callData: encoded(Encoding.ContractBytearray),
}, {
  tag: shortUIntConst(Tag.ContractCallTx),
  version: shortUIntConst(1, true),
  callerId: address(Encoding.AccountAddress),
  nonce: nonce('callerId'),
  contractId: address(Encoding.ContractAddress, Encoding.Name),
  abiVersion,
  fee,
  ttl,
  amount: coinAmount,
  gasLimit,
  gasPrice,
  callData: encoded(Encoding.ContractBytearray),
}, {
  tag: shortUIntConst(Tag.ContractCall),
  version: shortUIntConst(2, true),
  callerId: address(Encoding.AccountAddress),
  callerNonce: shortUInt,
  height: shortUInt,
  contractId: address(Encoding.ContractAddress),
  // TODO: rename after resolving https://github.com/aeternity/protocol/issues/506
  gasPrice: uInt,
  gasUsed: shortUInt,
  returnValue: encoded(Encoding.ContractBytearray),
  returnType: enumeration(CallReturnType),
  // TODO: add serialization for
  //  <log> :: [ { <address> :: id, [ <topics> :: binary() }, <data> :: binary() } ]
  log: array(raw),
}, {
  tag: shortUIntConst(Tag.Oracle),
  version: shortUIntConst(1, true),
  accountId: address(Encoding.AccountAddress),
  queryFormat: string,
  responseFormat: string,
  queryFee: coinAmount,
  oracleTtlValue: shortUInt,
  abiVersion,
}, {
  tag: shortUIntConst(Tag.OracleRegisterTx),
  version: shortUIntConst(1, true),
  accountId: address(Encoding.AccountAddress),
  nonce: nonce('accountId'),
  queryFormat: string,
  responseFormat: string,
  queryFee: coinAmount,
  oracleTtlType: enumeration(ORACLE_TTL_TYPES),
  oracleTtlValue: shortUInt,
  fee,
  ttl,
  abiVersion,
}, {
  tag: shortUIntConst(Tag.OracleExtendTx),
  version: shortUIntConst(1, true),
  oracleId: address(Encoding.OracleAddress, Encoding.Name),
  nonce: nonce('oracleId'),
  oracleTtlType: enumeration(ORACLE_TTL_TYPES),
  oracleTtlValue: shortUInt,
  fee,
  ttl,
}, {
  tag: shortUIntConst(Tag.OracleQueryTx),
  version: shortUIntConst(1, true),
  senderId: address(Encoding.AccountAddress),
  nonce: nonce('senderId'),
  oracleId: address(Encoding.OracleAddress, Encoding.Name),
  query: string,
  queryFee: coinAmount,
  queryTtlType: enumeration(ORACLE_TTL_TYPES),
  queryTtlValue: shortUInt,
  responseTtlType: enumeration(ORACLE_TTL_TYPES),
  responseTtlValue: shortUInt,
  fee,
  ttl,
}, {
  tag: shortUIntConst(Tag.OracleResponseTx),
  version: shortUIntConst(1, true),
  oracleId: address(Encoding.OracleAddress),
  nonce: nonce('oracleId'),
  queryId: encoded(Encoding.OracleQueryId),
  response: string,
  responseTtlType: enumeration(ORACLE_TTL_TYPES),
  responseTtlValue: shortUInt,
  fee,
  ttl,
}, {
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
}, {
  tag: shortUIntConst(Tag.ChannelCloseMutualTx),
  version: shortUIntConst(1, true),
  channelId: address(Encoding.Channel),
  fromId: address(Encoding.AccountAddress),
  initiatorAmountFinal: uInt,
  responderAmountFinal: uInt,
  ttl,
  fee,
  nonce: nonce('fromId'),
}, {
  tag: shortUIntConst(Tag.ChannelCloseSoloTx),
  version: shortUIntConst(1, true),
  channelId: address(Encoding.Channel),
  fromId: address(Encoding.AccountAddress),
  payload: encoded(Encoding.Transaction),
  poi: entryTreesPoi,
  ttl,
  fee,
  nonce: nonce('fromId'),
}, {
  tag: shortUIntConst(Tag.ChannelSlashTx),
  version: shortUIntConst(1, true),
  channelId: address(Encoding.Channel),
  fromId: address(Encoding.AccountAddress),
  payload: encoded(Encoding.Transaction),
  poi: entryTreesPoi,
  ttl,
  fee,
  nonce: nonce('fromId'),
}, {
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
}, {
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
}, {
  tag: shortUIntConst(Tag.ChannelSettleTx),
  version: shortUIntConst(1, true),
  channelId: address(Encoding.Channel),
  fromId: address(Encoding.AccountAddress),
  initiatorAmountFinal: uInt,
  responderAmountFinal: uInt,
  ttl,
  fee,
  nonce: nonce('fromId'),
}, {
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
}, {
  tag: shortUIntConst(Tag.ChannelOffChainTx),
  version: shortUIntConst(2, true),
  channelId: address(Encoding.Channel),
  round: shortUInt,
  stateHash: encoded(Encoding.State),
}, {
  tag: shortUIntConst(Tag.Channel),
  version: shortUIntConst(3, true),
  initiator: address(Encoding.AccountAddress),
  responder: address(Encoding.AccountAddress),
  channelAmount: uInt,
  initiatorAmount: uInt,
  responderAmount: uInt,
  channelReserve: uInt,
  initiatorDelegateIds: array(address(...idTagToEncoding)),
  responderDelegateIds: array(address(...idTagToEncoding)),
  stateHash: encoded(Encoding.State),
  round: shortUInt,
  soloRound: uInt,
  lockPeriod: uInt,
  lockedUntil: uInt,
  initiatorAuth: encoded(Encoding.ContractBytearray),
  responderAuth: encoded(Encoding.ContractBytearray),
}, {
  tag: shortUIntConst(Tag.ChannelSnapshotSoloTx),
  version: shortUIntConst(1, true),
  channelId: address(Encoding.Channel),
  fromId: address(Encoding.AccountAddress),
  payload: encoded(Encoding.Transaction),
  ttl,
  fee,
  nonce: nonce('fromId'),
}, {
  tag: shortUIntConst(Tag.ChannelOffChainUpdateTransfer),
  version: shortUIntConst(1, true),
  from: address(Encoding.AccountAddress),
  to: address(Encoding.AccountAddress),
  amount: uInt,
}, {
  tag: shortUIntConst(Tag.ChannelOffChainUpdateDeposit),
  version: shortUIntConst(1, true),
  from: address(Encoding.AccountAddress),
  amount: uInt,
}, {
  tag: shortUIntConst(Tag.ChannelOffChainUpdateWithdraw),
  version: shortUIntConst(1, true),
  from: address(Encoding.AccountAddress),
  amount: uInt,
}, {
  tag: shortUIntConst(Tag.ChannelOffChainUpdateCreateContract),
  version: shortUIntConst(1, true),
  owner: address(Encoding.AccountAddress),
  ctVersion,
  code: encoded(Encoding.ContractBytearray),
  deposit: uInt,
  callData: encoded(Encoding.ContractBytearray),
}, {
  tag: shortUIntConst(Tag.ChannelOffChainUpdateCallContract),
  version: shortUIntConst(1, true),
  caller: address(Encoding.AccountAddress),
  contract: address(Encoding.ContractAddress),
  abiVersion,
  amount: uInt,
  callData: encoded(Encoding.ContractBytearray),
  callStack: raw,
  gasPrice,
  gasLimit,
}, {
  tag: shortUIntConst(Tag.ChannelClientReconnectTx),
  version: shortUIntConst(1, true),
  channelId: address(Encoding.Channel),
  round: shortUInt,
  role: string,
  pubkey: address(Encoding.AccountAddress),
}, {
  tag: shortUIntConst(Tag.TreesPoi),
  version: shortUIntConst(1, true),
  // TODO: inline an extra wrapping array after resolving https://github.com/aeternity/protocol/issues/505
  accounts: array(mptree(Encoding.AccountAddress, Tag.Account)),
  calls: array(mptree(Encoding.Bytearray, Tag.ContractCall)),
  channels: array(mptree(Encoding.Channel, Tag.Channel)),
  contracts: array(mptree(Encoding.ContractAddress, Tag.Contract)),
  ns: array(mptree(Encoding.Name, Tag.Name)),
  oracles: array(mptree(Encoding.OracleAddress, Tag.Oracle)),
}, {
  tag: shortUIntConst(Tag.StateTrees),
  version: shortUIntConst(0, true),
  contracts: wrapped(Tag.ContractsMtree) as unknown as MapContracts,
  calls: wrapped(Tag.CallsMtree) as unknown as MapCalls,
  channels: wrapped(Tag.ChannelsMtree) as unknown as MapChannels,
  ns: wrapped(Tag.NameserviceMtree) as unknown as MapNames,
  oracles: wrapped(Tag.OraclesMtree) as unknown as MapOracles,
  accounts: wrapped(Tag.AccountsMtree) as unknown as MapAccounts,
}, {
  tag: shortUIntConst(Tag.Mtree),
  version: shortUIntConst(1, true),
  values: entryMtreeValueArray,
}, {
  tag: shortUIntConst(Tag.MtreeValue),
  version: shortUIntConst(1, true),
  key: raw,
  value: raw,
}, {
  tag: shortUIntConst(Tag.ContractsMtree),
  version: shortUIntConst(1, true),
  payload: mapContracts,
}, {
  tag: shortUIntConst(Tag.CallsMtree),
  version: shortUIntConst(1, true),
  payload: mapCalls,
}, {
  tag: shortUIntConst(Tag.ChannelsMtree),
  version: shortUIntConst(1, true),
  payload: mapChannels,
}, {
  tag: shortUIntConst(Tag.NameserviceMtree),
  version: shortUIntConst(1, true),
  payload: mapNames,
}, {
  tag: shortUIntConst(Tag.OraclesMtree),
  version: shortUIntConst(1, true),
  payload: mapOracles,
}, {
  tag: shortUIntConst(Tag.AccountsMtree),
  version: shortUIntConst(1, true),
  payload: mapAccounts,
}, {
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
}, {
  tag: shortUIntConst(Tag.GaMetaTx),
  version: shortUIntConst(2, true),
  gaId: address(Encoding.AccountAddress),
  authData: encoded(Encoding.ContractBytearray),
  abiVersion,
  fee,
  gasLimit,
  gasPrice,
  tx: entrySignedTx,
}, {
  tag: shortUIntConst(Tag.PayingForTx),
  version: shortUIntConst(1, true),
  payerId: address(Encoding.AccountAddress),
  nonce: nonce('payerId'),
  fee,
  tx: entrySignedTx,
}, {
  tag: shortUIntConst(Tag.GaMetaTxAuthData),
  version: shortUIntConst(1, true),
  fee: coinAmount,
  gasPrice,
  txHash: encoded(Encoding.TxHash),
}] as const;

type TxSchema = SchemaTypes<typeof txSchema>;
export type TxParams = TxSchema['TxParams'];
export type TxParamsAsync = TxSchema['TxParamsAsync'];
export type TxUnpacked = TxSchema['TxUnpacked'];
