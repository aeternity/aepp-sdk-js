/**
 * Transaction Schema for TxBuilder
 */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import BigNumber from 'bignumber.js';
import { Tag } from './constants';
import {
  Field, uInt, shortUInt, coinAmount, name, nameId, nameFee, deposit, gasLimit, gasPrice, fee,
  address, addresses, pointers, entry, enumeration, mptrees, shortUIntConst, string, encoded, raw,
} from './field-types';
import { Encoding } from '../../utils/encoder';
import { KeysOfUnion, UnionToIntersection } from '../../utils/other';
import { idTagToEncoding } from './field-types/address';

export enum ORACLE_TTL_TYPES {
  delta = 0,
  block = 1,
}

// # TRANSACTION DEFAULT TTL
export const TX_TTL = 0;
// # ORACLE
export const QUERY_FEE = 30000;
export const ORACLE_TTL = { type: ORACLE_TTL_TYPES.delta, value: 500 };
export const QUERY_TTL = { type: ORACLE_TTL_TYPES.delta, value: 10 };
export const RESPONSE_TTL = { type: ORACLE_TTL_TYPES.delta, value: 10 };
// # CONTRACT
export const DRY_RUN_ACCOUNT = {
  pub: 'ak_11111111111111111111111111111111273Yts',
  amount: 100000000000000000000000000000000000n,
} as const;

export type TxField = [
  name: string,
  type: FIELD_TYPES | Field,
];

/**
 * @category transaction builder
 * @see {@link https://github.com/aeternity/protocol/blob/0f6dee3d9d1e8e2469816798f5c7587a6c918f94/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain}
 */
export enum VM_VERSIONS {
  NO_VM = 0,
  SOPHIA = 1,
  SOPHIA_IMPROVEMENTS_MINERVA = 3,
  SOPHIA_IMPROVEMENTS_FORTUNA = 4,
  FATE = 5,
  SOPHIA_IMPROVEMENTS_LIMA = 6,
  FATE_2 = 7,
}

/**
 * @category transaction builder
 * @see {@link https://github.com/aeternity/protocol/blob/0f6dee3d9d1e8e2469816798f5c7587a6c918f94/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain}
 */
export enum ABI_VERSIONS {
  NO_ABI = 0,
  SOPHIA = 1,
  FATE = 3,
}

export enum CallReturnType {
  Ok = 0,
  Error = 1,
  Revert = 2,
}

/**
 * @category transaction builder
 */
export enum PROTOCOL_VERSIONS {
  IRIS = 5,
}

// First abi/vm by default
export const PROTOCOL_VM_ABI = {
  [PROTOCOL_VERSIONS.IRIS]: {
    [Tag.ContractCreateTx]: {
      vmVersion: [VM_VERSIONS.FATE_2], abiVersion: [ABI_VERSIONS.FATE],
    },
    // TODO: Ensure that AEVM (SOPHIA?) is still available here
    [Tag.ContractCallTx]: {
      vmVersion: [], abiVersion: [ABI_VERSIONS.FATE, ABI_VERSIONS.SOPHIA],
    },
    [Tag.OracleRegisterTx]: {
      vmVersion: [], abiVersion: [ABI_VERSIONS.NO_ABI, ABI_VERSIONS.SOPHIA],
    },
  },
} as const;

/**
 * @category transaction builder
 */
export interface CtVersion {
  vmVersion: VM_VERSIONS;
  abiVersion: ABI_VERSIONS;
}

/**
 * @category transaction builder
 */
export enum FIELD_TYPES {
  bool,
  hex,
  rlpBinary,
  rlpBinaries,
  signatures,
  ctVersion,
  sophiaCodeTypeInfo,
}

interface BuildFieldTypes {
  [FIELD_TYPES.bool]: Boolean;
  [FIELD_TYPES.hex]: string;
  [FIELD_TYPES.rlpBinary]: any;
  [FIELD_TYPES.rlpBinaries]: any[];
  [FIELD_TYPES.signatures]: Uint8Array[];
  [FIELD_TYPES.ctVersion]: CtVersion;
  [FIELD_TYPES.sophiaCodeTypeInfo]: any;
}

type TxElem = readonly [string, FIELD_TYPES | Field];

type BuildTxArgBySchemaType<Type extends FIELD_TYPES | Field> =
  Type extends Field
    ? Parameters<Type['serialize']>[0]
    : Type extends FIELD_TYPES
      ? BuildFieldTypes[Type]
      : never;

type NullablePartial<
  T,
  NK extends keyof T = { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T],
> = Partial<Pick<T, NK>> & Omit<T, NK>;

type BuildTxArgBySchema<SchemaLine> =
  UnionToIntersection<
  SchemaLine extends ReadonlyArray<infer Elem>
    ? Elem extends TxElem
      ? NullablePartial<{ [k in Elem[0]]: BuildTxArgBySchemaType<Elem[1]> }>
      : never
    : never
  >;

export type RawTxObject<Tx extends TxSchema> = {
  [k in keyof Tx]-?: Tx[k] extends BigNumber ? string : Tx[k]
};

/**
 * @see {@link https://github.com/aeternity/protocol/blob/c007deeac4a01e401238412801ac7084ac72d60e/serializations.md#accounts-version-1-basic-accounts}
 */
export const TX_SCHEMA = {
  [Tag.Account]: {
    1: [
      ['tag', shortUIntConst(Tag.Account)],
      ['version', shortUIntConst(1)],
      ['nonce', shortUInt],
      ['balance', uInt],
    ],
    2: [
      ['tag', shortUIntConst(Tag.Account)],
      ['version', shortUIntConst(2)],
      ['flags', uInt],
      ['nonce', shortUInt],
      ['balance', uInt],
      ['gaContract', address(Encoding.ContractAddress, Encoding.Name)],
      ['gaAuthFun', encoded(Encoding.ContractBytearray)],
    ],
  },
  [Tag.SignedTx]: {
    1: [
      ['tag', shortUIntConst(Tag.SignedTx)],
      ['version', shortUIntConst(1)],
      ['signatures', FIELD_TYPES.signatures],
      ['encodedTx', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.SpendTx]: {
    1: [
      ['tag', shortUIntConst(Tag.SpendTx)],
      ['version', shortUIntConst(1)],
      ['senderId', address(Encoding.AccountAddress)],
      ['recipientId', address(Encoding.AccountAddress, Encoding.Name)],
      ['amount', coinAmount],
      ['fee', fee],
      ['ttl', shortUInt],
      ['nonce', shortUInt],
      ['payload', encoded(Encoding.Bytearray, true)],
    ],
  },
  [Tag.Name]: {
    1: [
      ['tag', shortUIntConst(Tag.Name)],
      ['version', shortUIntConst(1)],
      ['accountId', address(Encoding.AccountAddress)],
      ['nameTtl', shortUInt],
      ['status', raw],
      ['clientTtl', shortUInt],
      ['pointers', pointers],
    ],
  },
  [Tag.NamePreclaimTx]: {
    1: [
      ['tag', shortUIntConst(Tag.NamePreclaimTx)],
      ['version', shortUIntConst(1)],
      ['accountId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['commitmentId', address(Encoding.Commitment)],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameClaimTx]: {
    2: [
      ['tag', shortUIntConst(Tag.NameClaimTx)],
      ['version', shortUIntConst(2)],
      ['accountId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['name', name],
      ['nameSalt', uInt],
      ['nameFee', nameFee],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameUpdateTx]: {
    1: [
      ['tag', shortUIntConst(Tag.NameUpdateTx)],
      ['version', shortUIntConst(1)],
      ['accountId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['nameId', nameId],
      ['nameTtl', shortUInt],
      ['pointers', pointers],
      ['clientTtl', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameTransferTx]: {
    1: [
      ['tag', shortUIntConst(Tag.NameTransferTx)],
      ['version', shortUIntConst(1)],
      ['accountId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['nameId', nameId],
      ['recipientId', address(Encoding.AccountAddress, Encoding.Name)],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameRevokeTx]: {
    1: [
      ['tag', shortUIntConst(Tag.NameRevokeTx)],
      ['version', shortUIntConst(1)],
      ['accountId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['nameId', nameId],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.Contract]: {
    1: [
      ['tag', shortUIntConst(Tag.Contract)],
      ['version', shortUIntConst(1)],
      ['owner', address(Encoding.AccountAddress)],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['code', encoded(Encoding.ContractBytearray)],
      ['log', encoded(Encoding.ContractBytearray)],
      ['active', FIELD_TYPES.bool],
      ['referers', addresses(Encoding.AccountAddress)],
      ['deposit', deposit],
    ],
  },
  [Tag.ContractCreateTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ContractCreateTx)],
      ['version', shortUIntConst(1)],
      ['ownerId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['code', encoded(Encoding.ContractBytearray)],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['fee', fee],
      ['ttl', shortUInt],
      ['deposit', deposit],
      ['amount', coinAmount],
      ['gasLimit', gasLimit],
      ['gasPrice', gasPrice],
      ['callData', encoded(Encoding.ContractBytearray)],
    ],
  },
  [Tag.ContractCallTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ContractCallTx)],
      ['version', shortUIntConst(1)],
      ['callerId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['contractId', address(Encoding.ContractAddress, Encoding.Name)],
      ['abiVersion', enumeration(ABI_VERSIONS)],
      ['fee', fee],
      ['ttl', shortUInt],
      ['amount', coinAmount],
      ['gasLimit', gasLimit],
      ['gasPrice', gasPrice],
      ['callData', encoded(Encoding.ContractBytearray)],
    ],
  },
  [Tag.ContractCall]: {
    1: [
      ['tag', shortUIntConst(Tag.ContractCall)],
      ['version', shortUIntConst(1)],
      ['callerId', address(Encoding.AccountAddress)],
      ['callerNonce', shortUInt],
      ['height', shortUInt],
      ['contractId', address(Encoding.ContractAddress)],
      ['gasPrice', gasPrice],
      ['gasUsed', shortUInt],
      ['returnValue', encoded(Encoding.ContractBytearray)],
      ['returnType', enumeration(CallReturnType)],
      // TODO: add serialization for
      //  <log> :: [ { <address> :: id, [ <topics> :: binary() ], <data> :: binary() } ]
      ['log', raw],
    ],
  },
  [Tag.Oracle]: {
    1: [
      ['tag', shortUIntConst(Tag.Oracle)],
      ['version', shortUIntConst(1)],
      ['accountId', address(Encoding.AccountAddress)],
      ['queryFormat', string],
      ['responseFormat', string],
      ['queryFee', coinAmount],
      ['oracleTtlValue', shortUInt],
      ['abiVersion', enumeration(ABI_VERSIONS)],
    ],
  },
  [Tag.OracleRegisterTx]: {
    1: [
      ['tag', shortUIntConst(Tag.OracleRegisterTx)],
      ['version', shortUIntConst(1)],
      ['accountId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['queryFormat', string],
      ['responseFormat', string],
      ['queryFee', coinAmount],
      ['oracleTtlType', enumeration(ORACLE_TTL_TYPES)],
      ['oracleTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
      ['abiVersion', enumeration(ABI_VERSIONS)],
    ],
  },
  [Tag.OracleExtendTx]: {
    1: [
      ['tag', shortUIntConst(Tag.OracleExtendTx)],
      ['version', shortUIntConst(1)],
      ['oracleId', address(Encoding.OracleAddress, Encoding.Name)],
      ['nonce', shortUInt],
      ['oracleTtlType', enumeration(ORACLE_TTL_TYPES)],
      ['oracleTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.OracleQueryTx]: {
    1: [
      ['tag', shortUIntConst(Tag.OracleQueryTx)],
      ['version', shortUIntConst(1)],
      ['senderId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['oracleId', address(Encoding.OracleAddress, Encoding.Name)],
      ['query', string],
      ['queryFee', coinAmount],
      ['queryTtlType', enumeration(ORACLE_TTL_TYPES)],
      ['queryTtlValue', shortUInt],
      ['responseTtlType', enumeration(ORACLE_TTL_TYPES)],
      ['responseTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.OracleResponseTx]: {
    1: [
      ['tag', shortUIntConst(Tag.OracleResponseTx)],
      ['version', shortUIntConst(1)],
      ['oracleId', address(Encoding.OracleAddress)],
      ['nonce', shortUInt],
      ['queryId', encoded(Encoding.OracleQueryId)],
      ['response', string],
      ['responseTtlType', enumeration(ORACLE_TTL_TYPES)],
      ['responseTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.ChannelCreateTx]: {
    2: [
      ['tag', shortUIntConst(Tag.ChannelCreateTx)],
      ['version', shortUIntConst(2)],
      ['initiator', address(Encoding.AccountAddress)],
      ['initiatorAmount', uInt],
      ['responder', address(Encoding.AccountAddress)],
      ['responderAmount', uInt],
      ['channelReserve', uInt],
      ['lockPeriod', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['initiatorDelegateIds', addresses(...idTagToEncoding)],
      ['responderDelegateIds', addresses(...idTagToEncoding)],
      ['stateHash', encoded(Encoding.State)],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelCloseMutualTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelCloseMutualTx)],
      ['version', shortUIntConst(1)],
      ['channelId', address(Encoding.Channel)],
      ['fromId', address(Encoding.AccountAddress)],
      ['initiatorAmountFinal', uInt],
      ['responderAmountFinal', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelCloseSoloTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelCloseSoloTx)],
      ['version', shortUIntConst(1)],
      ['channelId', address(Encoding.Channel)],
      ['fromId', address(Encoding.AccountAddress)],
      ['payload', encoded(Encoding.Transaction)],
      ['poi', entry(Tag.TreesPoi)],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelSlashTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelSlashTx)],
      ['version', shortUIntConst(1)],
      ['channelId', address(Encoding.Channel)],
      ['fromId', address(Encoding.AccountAddress)],
      ['payload', encoded(Encoding.Transaction)],
      ['poi', entry(Tag.TreesPoi)],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelDepositTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelDepositTx)],
      ['version', shortUIntConst(1)],
      ['channelId', address(Encoding.Channel)],
      ['fromId', address(Encoding.AccountAddress)],
      ['amount', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['stateHash', encoded(Encoding.State)],
      ['round', shortUInt],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelWithdrawTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelWithdrawTx)],
      ['version', shortUIntConst(1)],
      ['channelId', address(Encoding.Channel)],
      ['toId', address(Encoding.AccountAddress)],
      ['amount', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['stateHash', encoded(Encoding.State)],
      ['round', shortUInt],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelSettleTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelSettleTx)],
      ['version', shortUIntConst(1)],
      ['channelId', address(Encoding.Channel)],
      ['fromId', address(Encoding.AccountAddress)],
      ['initiatorAmountFinal', uInt],
      ['responderAmountFinal', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelForceProgressTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelForceProgressTx)],
      ['version', shortUIntConst(1)],
      ['channelId', address(Encoding.Channel)],
      ['fromId', address(Encoding.AccountAddress)],
      ['payload', encoded(Encoding.Transaction)],
      ['round', shortUInt],
      ['update', encoded(Encoding.ContractBytearray)],
      ['stateHash', encoded(Encoding.State)],
      ['offChainTrees', encoded(Encoding.StateTrees)],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelOffChainTx]: {
    2: [
      ['tag', shortUIntConst(Tag.ChannelOffChainTx)],
      ['version', shortUIntConst(2)],
      ['channelId', address(Encoding.Channel)],
      ['round', shortUInt],
      ['stateHash', encoded(Encoding.State)],
    ],
  },
  [Tag.Channel]: {
    3: [
      ['tag', shortUIntConst(Tag.Channel)],
      ['version', shortUIntConst(3)],
      ['initiator', address(Encoding.AccountAddress)],
      ['responder', address(Encoding.AccountAddress)],
      ['channelAmount', uInt],
      ['initiatorAmount', uInt],
      ['responderAmount', uInt],
      ['channelReserve', uInt],
      ['initiatorDelegateIds', addresses(...idTagToEncoding)],
      ['responderDelegateIds', addresses(...idTagToEncoding)],
      ['stateHash', FIELD_TYPES.hex],
      ['round', shortUInt],
      ['soloRound', uInt],
      ['lockPeriod', uInt],
      ['lockedUntil', uInt],
      ['initiatorAuth', encoded(Encoding.ContractBytearray)],
      ['responderAuth', encoded(Encoding.ContractBytearray)],
    ],
  },
  [Tag.ChannelSnapshotSoloTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelSnapshotSoloTx)],
      ['version', shortUIntConst(1)],
      ['channelId', address(Encoding.Channel)],
      ['fromId', address(Encoding.AccountAddress)],
      ['payload', encoded(Encoding.Transaction)],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelOffChainUpdateTransfer]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelOffChainUpdateTransfer)],
      ['version', shortUIntConst(1)],
      ['from', address(Encoding.AccountAddress)],
      ['to', address(Encoding.AccountAddress)],
      ['amount', uInt],
    ],
  },
  [Tag.ChannelOffChainUpdateDeposit]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelOffChainUpdateDeposit)],
      ['version', shortUIntConst(1)],
      ['from', address(Encoding.AccountAddress)],
      ['amount', uInt],
    ],
  },
  [Tag.ChannelOffChainUpdateWithdraw]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelOffChainUpdateWithdraw)],
      ['version', shortUIntConst(1)],
      ['from', address(Encoding.AccountAddress)],
      ['amount', uInt],
    ],
  },
  [Tag.ChannelOffChainUpdateCreateContract]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelOffChainUpdateCreateContract)],
      ['version', shortUIntConst(1)],
      ['owner', address(Encoding.AccountAddress)],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['code', encoded(Encoding.ContractBytearray)],
      ['deposit', uInt],
      ['callData', encoded(Encoding.ContractBytearray)],
    ],
  },
  [Tag.ChannelOffChainUpdateCallContract]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelOffChainUpdateCallContract)],
      ['version', shortUIntConst(1)],
      ['caller', address(Encoding.AccountAddress)],
      ['contract', address(Encoding.ContractAddress)],
      ['abiVersion', enumeration(ABI_VERSIONS)],
      ['amount', uInt],
      ['callData', encoded(Encoding.ContractBytearray)],
      ['callStack', raw],
      ['gasPrice', gasPrice],
      ['gasLimit', gasLimit],
    ],
  },
  [Tag.ChannelClientReconnectTx]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelClientReconnectTx)],
      ['version', shortUIntConst(1)],
      ['channelId', address(Encoding.Channel)],
      ['round', shortUInt],
      ['role', string],
      ['pubkey', address(Encoding.AccountAddress)],
    ],
  },
  [Tag.TreesPoi]: {
    1: [
      ['tag', shortUIntConst(Tag.TreesPoi)],
      ['version', shortUIntConst(1)],
      ['accounts', mptrees(Encoding.AccountAddress, Tag.Account)],
      ['calls', mptrees(Encoding.Bytearray, Tag.ContractCall)],
      ['channels', mptrees(Encoding.Channel, Tag.Channel)],
      ['contracts', mptrees(Encoding.ContractAddress, Tag.Contract)],
      ['ns', mptrees(Encoding.Name, Tag.Name)],
      ['oracles', mptrees(Encoding.OracleAddress, Tag.Oracle)],
    ],
  },
  [Tag.StateTrees]: {
    1: [
      ['tag', shortUIntConst(Tag.StateTrees)],
      ['version', shortUIntConst(1)],
      ['contracts', FIELD_TYPES.rlpBinary],
      ['calls', FIELD_TYPES.rlpBinary],
      ['channels', FIELD_TYPES.rlpBinary],
      ['ns', FIELD_TYPES.rlpBinary],
      ['oracles', FIELD_TYPES.rlpBinary],
      ['accounts', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.Mtree]: {
    1: [
      ['tag', shortUIntConst(Tag.Mtree)],
      ['version', shortUIntConst(1)],
      ['values', FIELD_TYPES.rlpBinaries],
    ],
  },
  [Tag.MtreeValue]: {
    1: [
      ['tag', shortUIntConst(Tag.MtreeValue)],
      ['version', shortUIntConst(1)],
      ['key', FIELD_TYPES.hex],
      ['value', raw],
    ],
  },
  [Tag.ContractsMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.ContractsMtree)],
      ['version', shortUIntConst(1)],
      ['contracts', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.CallsMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.CallsMtree)],
      ['version', shortUIntConst(1)],
      ['calls', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.ChannelsMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelsMtree)],
      ['version', shortUIntConst(1)],
      ['channels', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.NameserviceMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.NameserviceMtree)],
      ['version', shortUIntConst(1)],
      ['mtree', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.OraclesMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.OraclesMtree)],
      ['version', shortUIntConst(1)],
      ['otree', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.AccountsMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.AccountsMtree)],
      ['version', shortUIntConst(1)],
      ['accounts', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.GaAttachTx]: {
    1: [
      ['tag', shortUIntConst(Tag.GaAttachTx)],
      ['version', shortUIntConst(1)],
      ['ownerId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['code', encoded(Encoding.ContractBytearray)],
      ['authFun', raw],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['fee', fee],
      ['ttl', shortUInt],
      ['gasLimit', gasLimit],
      ['gasPrice', gasPrice],
      ['callData', encoded(Encoding.ContractBytearray)],
    ],
  },
  [Tag.GaMetaTx]: {
    2: [
      ['tag', shortUIntConst(Tag.GaMetaTx)],
      ['version', shortUIntConst(2)],
      ['gaId', address(Encoding.AccountAddress)],
      ['authData', encoded(Encoding.ContractBytearray)],
      ['abiVersion', enumeration(ABI_VERSIONS)],
      ['fee', fee],
      ['gasLimit', gasLimit],
      ['gasPrice', gasPrice],
      ['tx', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.PayingForTx]: {
    1: [
      ['tag', shortUIntConst(Tag.PayingForTx)],
      ['version', shortUIntConst(1)],
      ['payerId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['fee', fee],
      ['tx', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.CompilerSophia]: {
    3: [
      ['tag', shortUIntConst(Tag.CompilerSophia)],
      ['version', shortUIntConst(3)],
      ['sourceCodeHash', raw],
      ['typeInfo', FIELD_TYPES.sophiaCodeTypeInfo],
      ['byteCode', raw],
      ['compilerVersion', string],
      ['payable', FIELD_TYPES.bool],
    ],
  },
} as const;

type TxTypeSchemasNotCombined = {
  [tag in Tag]: {
    [ver in keyof typeof TX_SCHEMA[tag]]: BuildTxArgBySchema<typeof TX_SCHEMA[tag][ver]>
  }
};

export type TxTypeSchemas = {
  [key in Tag]: TxTypeSchemasNotCombined[key][keyof TxTypeSchemasNotCombined[key]]
};

export type TxVersionsBy<T extends Tag> = Extract<KeysOfUnion<typeof TX_SCHEMA[T]>, number>;

export type TxTypeSchemaBy<T extends Tag, V extends TxVersionsBy<T>> =
  TxTypeSchemasNotCombined[T][V];

export type TxSchema = TxTypeSchemas[Tag];
export type TxParamsCommon = Partial<UnionToIntersection<TxSchema>>;
