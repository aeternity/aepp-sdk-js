import SchemaTypes from '../SchemaTypes';
import abiVersion from '../field-types/abi-version';
import address, { idTagToEncoding } from '../field-types/address';
import array from '../field-types/array';
import boolean from '../field-types/boolean';
import coinAmount from '../field-types/coin-amount';
import ctVersion from '../field-types/ct-version';
import encoded from '../field-types/encoded';
import entry from '../field-types/entry';
import enumeration from '../field-types/enumeration';
import gasLimit from '../field-types/gas-limit';
import gasPrice from '../field-types/gas-price';
import map from '../field-types/map';
import mptree from '../field-types/mptree';
import pointers from '../field-types/pointers';
import raw from '../field-types/raw';
import shortUInt from '../field-types/short-u-int';
import shortUIntConst from '../field-types/short-u-int-const';
import string from '../field-types/string';
import uInt from '../field-types/u-int';
import wrapped from '../field-types/wrapped';
import {
  Encoded, Encoding,
} from '../../../utils/encoder';
import { EntryTag, CallReturnType } from './constants';

interface EntryMtreeValueArray {
  serialize: (
    value: Array<EntParams & { tag: EntryTag.MtreeValue } | Uint8Array | Encoded.Transaction>,
  ) => Buffer[];
  deserialize: (value: Buffer[]) => Array<EntUnpacked & { tag: EntryTag.MtreeValue }>;
  recursiveType: true;
}

const entryMtreeValueArray = array(entry(EntryTag.MtreeValue)) as unknown as EntryMtreeValueArray;

interface MapContracts {
  serialize: (
    value: Record<Encoded.ContractAddress, EntParams & { tag: EntryTag.Contract }>,
  ) => Buffer;
  deserialize: (
    value: Buffer,
  ) => Record<Encoded.ContractAddress, EntUnpacked & { tag: EntryTag.Contract }>;
  recursiveType: true;
}

const mapContracts = map(Encoding.ContractAddress, EntryTag.Contract) as unknown as MapContracts;

interface MapAccounts {
  serialize: (
    value: Record<Encoded.AccountAddress, EntParams & { tag: EntryTag.Account }>,
  ) => Buffer;
  deserialize: (value: Buffer) => Record<
  Encoded.AccountAddress,
  EntUnpacked & { tag: EntryTag.Account }
  >;
  recursiveType: true;
}

const mapAccounts = map(Encoding.AccountAddress, EntryTag.Account) as unknown as MapAccounts;

interface MapCalls {
  serialize: (
    value: Record<Encoded.Bytearray, EntParams & { tag: EntryTag.ContractCall }>,
  ) => Buffer;
  deserialize: (value: Buffer) => Record<
  Encoded.Bytearray,
  EntUnpacked & { tag: EntryTag.ContractCall }
  >;
  recursiveType: true;
}

const mapCalls = map(Encoding.Bytearray, EntryTag.ContractCall) as unknown as MapCalls;

interface MapChannels {
  serialize: (
    value: Record<Encoded.Channel, EntParams & { tag: EntryTag.Channel }>,
  ) => Buffer;
  deserialize: (value: Buffer) => Record<Encoded.Channel, EntUnpacked & { tag: EntryTag.Channel }>;
  recursiveType: true;
}

const mapChannels = map(Encoding.Channel, EntryTag.Channel) as unknown as MapChannels;

interface MapNames {
  serialize: (
    value: Record<Encoded.Name, EntParams & { tag: EntryTag.Name }>,
  ) => Buffer;
  deserialize: (value: Buffer) => Record<Encoded.Name, EntUnpacked & { tag: EntryTag.Name }>;
  recursiveType: true;
}

const mapNames = map(Encoding.Name, EntryTag.Name) as unknown as MapNames;

interface MapOracles {
  serialize: (
    value: Record<Encoded.OracleAddress, EntParams & { tag: EntryTag.Oracle }>,
  ) => Buffer;
  deserialize: (value: Buffer) => Record<
  Encoded.OracleAddress,
  EntUnpacked & { tag: EntryTag.Oracle }
  >;
  recursiveType: true;
}

const mapOracles = map(Encoding.OracleAddress, EntryTag.Oracle) as unknown as MapOracles;

/**
 * @see {@link https://github.com/aeternity/protocol/blob/8a9d1d1206174627f6aaef86159dc9c643080653/contracts/fate.md#from-ceres-serialized-signature-data}
 */
export const schemas = [{
  tag: shortUIntConst(EntryTag.Account),
  version: shortUIntConst(1),
  nonce: shortUInt,
  balance: uInt,
}, {
  tag: shortUIntConst(EntryTag.Account),
  version: shortUIntConst(2, true),
  flags: uInt,
  nonce: shortUInt,
  balance: uInt,
  gaContract: address(Encoding.ContractAddress, Encoding.Name),
  gaAuthFun: encoded(Encoding.ContractBytearray),
}, {
  tag: shortUIntConst(EntryTag.Name),
  version: shortUIntConst(1, true),
  accountId: address(Encoding.AccountAddress),
  nameTtl: shortUInt,
  status: raw,
  clientTtl: shortUInt,
  pointers,
}, {
  tag: shortUIntConst(EntryTag.Contract),
  version: shortUIntConst(1, true),
  owner: address(Encoding.AccountAddress),
  ctVersion,
  code: encoded(Encoding.ContractBytearray),
  log: encoded(Encoding.ContractBytearray),
  active: boolean,
  referers: array(address(Encoding.AccountAddress)),
  deposit: coinAmount,
}, {
  tag: shortUIntConst(EntryTag.ContractCall),
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
  tag: shortUIntConst(EntryTag.Oracle),
  version: shortUIntConst(1, true),
  accountId: address(Encoding.AccountAddress),
  queryFormat: string,
  responseFormat: string,
  queryFee: coinAmount,
  oracleTtlValue: shortUInt,
  abiVersion,
}, {
  tag: shortUIntConst(EntryTag.Channel),
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
  tag: shortUIntConst(EntryTag.ChannelOffChainUpdateTransfer),
  version: shortUIntConst(1, true),
  from: address(Encoding.AccountAddress),
  to: address(Encoding.AccountAddress),
  amount: uInt,
}, {
  tag: shortUIntConst(EntryTag.ChannelOffChainUpdateDeposit),
  version: shortUIntConst(1, true),
  from: address(Encoding.AccountAddress),
  amount: uInt,
}, {
  tag: shortUIntConst(EntryTag.ChannelOffChainUpdateWithdraw),
  version: shortUIntConst(1, true),
  from: address(Encoding.AccountAddress),
  amount: uInt,
}, {
  tag: shortUIntConst(EntryTag.ChannelOffChainUpdateCreateContract),
  version: shortUIntConst(1, true),
  owner: address(Encoding.AccountAddress),
  ctVersion,
  code: encoded(Encoding.ContractBytearray),
  deposit: uInt,
  callData: encoded(Encoding.ContractBytearray),
}, {
  tag: shortUIntConst(EntryTag.ChannelOffChainUpdateCallContract),
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
  tag: shortUIntConst(EntryTag.TreesPoi),
  version: shortUIntConst(1, true),
  // TODO: inline an extra wrapping array after resolving https://github.com/aeternity/protocol/issues/505
  accounts: array(mptree(Encoding.AccountAddress, EntryTag.Account)),
  calls: array(mptree(Encoding.Bytearray, EntryTag.ContractCall)),
  channels: array(mptree(Encoding.Channel, EntryTag.Channel)),
  contracts: array(mptree(Encoding.ContractAddress, EntryTag.Contract)),
  ns: array(mptree(Encoding.Name, EntryTag.Name)),
  oracles: array(mptree(Encoding.OracleAddress, EntryTag.Oracle)),
}, {
  tag: shortUIntConst(EntryTag.StateTrees),
  version: shortUIntConst(0, true),
  contracts: wrapped(EntryTag.ContractsMtree) as unknown as MapContracts,
  calls: wrapped(EntryTag.CallsMtree) as unknown as MapCalls,
  channels: wrapped(EntryTag.ChannelsMtree) as unknown as MapChannels,
  ns: wrapped(EntryTag.NameserviceMtree) as unknown as MapNames,
  oracles: wrapped(EntryTag.OraclesMtree) as unknown as MapOracles,
  accounts: wrapped(EntryTag.AccountsMtree) as unknown as MapAccounts,
}, {
  tag: shortUIntConst(EntryTag.Mtree),
  version: shortUIntConst(1, true),
  values: entryMtreeValueArray,
}, {
  tag: shortUIntConst(EntryTag.MtreeValue),
  version: shortUIntConst(1, true),
  key: raw,
  value: raw,
}, {
  tag: shortUIntConst(EntryTag.ContractsMtree),
  version: shortUIntConst(1, true),
  payload: mapContracts,
}, {
  tag: shortUIntConst(EntryTag.CallsMtree),
  version: shortUIntConst(1, true),
  payload: mapCalls,
}, {
  tag: shortUIntConst(EntryTag.ChannelsMtree),
  version: shortUIntConst(1, true),
  payload: mapChannels,
}, {
  tag: shortUIntConst(EntryTag.NameserviceMtree),
  version: shortUIntConst(1, true),
  payload: mapNames,
}, {
  tag: shortUIntConst(EntryTag.OraclesMtree),
  version: shortUIntConst(1, true),
  payload: mapOracles,
}, {
  tag: shortUIntConst(EntryTag.AccountsMtree),
  version: shortUIntConst(1, true),
  payload: mapAccounts,
}, {
  tag: shortUIntConst(EntryTag.GaMetaTxAuthData),
  version: shortUIntConst(1, true),
  fee: coinAmount,
  gasPrice,
  txHash: encoded(Encoding.TxHash),
}] as const;

type Schemas = SchemaTypes<typeof schemas>;
export type EntParams = Schemas['TxParams'];
export type EntUnpacked = Schemas['TxUnpacked'];
