/**
 * Transaction Schema for TxBuilder
 */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import BigNumber from 'bignumber.js';
import { Tag } from './constants';
import {
  Field, uInt, shortUInt, coinAmount, name, nameId, nameFee, deposit, gasLimit, gasPrice, fee,
  address, pointers, entry, enumeration, mptree, shortUIntConst, string, encoded, raw,
  array, boolean, ctVersion, abiVersion, ttl,
} from './field-types';
import { Encoding } from '../../utils/encoder';
import { UnionToIntersection } from '../../utils/other';
import { idTagToEncoding } from './field-types/address';

export enum ORACLE_TTL_TYPES {
  delta = 0,
  block = 1,
}

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
  type: Field,
];

export enum CallReturnType {
  Ok = 0,
  Error = 1,
  Revert = 2,
}

type TxElem = readonly [string, Field];

type NullablePartial<
  T,
  NK extends keyof T = { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T],
> = Partial<Pick<T, NK>> & Omit<T, NK>;

type BuildTxArgBySchema<SchemaLine> =
  UnionToIntersection<
  SchemaLine extends ReadonlyArray<infer Elem>
    ? Elem extends TxElem
      ? NullablePartial<{ [k in Elem[0]]: Parameters<Elem[1]['serialize']>[0] }>
      & (Parameters<Elem[1]['serialize']>[2] extends object ? Parameters<Elem[1]['serialize']>[2] : {})
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
      ['signatures', array(raw)],
      ['encodedTx', entry()],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
    ],
  },
  [Tag.Contract]: {
    1: [
      ['tag', shortUIntConst(Tag.Contract)],
      ['version', shortUIntConst(1)],
      ['owner', address(Encoding.AccountAddress)],
      ['ctVersion', ctVersion],
      ['code', encoded(Encoding.ContractBytearray)],
      ['log', encoded(Encoding.ContractBytearray)],
      ['active', boolean],
      ['referers', array(address(Encoding.AccountAddress))],
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
      ['ctVersion', ctVersion],
      ['fee', fee],
      ['ttl', ttl],
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
      ['abiVersion', abiVersion],
      ['fee', fee],
      ['ttl', ttl],
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
      ['abiVersion', abiVersion],
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
      ['ttl', ttl],
      ['abiVersion', abiVersion],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
      ['fee', fee],
      ['initiatorDelegateIds', array(address(...idTagToEncoding))],
      ['responderDelegateIds', array(address(...idTagToEncoding))],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['ttl', ttl],
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
      ['initiatorDelegateIds', array(address(...idTagToEncoding))],
      ['responderDelegateIds', array(address(...idTagToEncoding))],
      ['stateHash', encoded(Encoding.State)],
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
      ['ttl', ttl],
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
      ['ctVersion', ctVersion],
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
      ['abiVersion', abiVersion],
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
      ['accounts', array(mptree(Encoding.AccountAddress, Tag.Account))],
      ['calls', array(mptree(Encoding.Bytearray, Tag.ContractCall))],
      ['channels', array(mptree(Encoding.Channel, Tag.Channel))],
      ['contracts', array(mptree(Encoding.ContractAddress, Tag.Contract))],
      ['ns', array(mptree(Encoding.Name, Tag.Name))],
      ['oracles', array(mptree(Encoding.OracleAddress, Tag.Oracle))],
    ],
  },
  [Tag.StateTrees]: {
    1: [
      ['tag', shortUIntConst(Tag.StateTrees)],
      ['version', shortUIntConst(1)],
      ['contracts', entry()],
      ['calls', entry()],
      ['channels', entry()],
      ['ns', entry()],
      ['oracles', entry()],
      ['accounts', entry()],
    ],
  },
  [Tag.Mtree]: {
    1: [
      ['tag', shortUIntConst(Tag.Mtree)],
      ['version', shortUIntConst(1)],
      ['values', array(entry())],
    ],
  },
  [Tag.MtreeValue]: {
    1: [
      ['tag', shortUIntConst(Tag.MtreeValue)],
      ['version', shortUIntConst(1)],
      ['key', raw],
      ['value', raw],
    ],
  },
  [Tag.ContractsMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.ContractsMtree)],
      ['version', shortUIntConst(1)],
      ['contracts', entry()],
    ],
  },
  [Tag.CallsMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.CallsMtree)],
      ['version', shortUIntConst(1)],
      ['calls', entry()],
    ],
  },
  [Tag.ChannelsMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.ChannelsMtree)],
      ['version', shortUIntConst(1)],
      ['channels', entry()],
    ],
  },
  [Tag.NameserviceMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.NameserviceMtree)],
      ['version', shortUIntConst(1)],
      ['mtree', entry()],
    ],
  },
  [Tag.OraclesMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.OraclesMtree)],
      ['version', shortUIntConst(1)],
      ['otree', entry()],
    ],
  },
  [Tag.AccountsMtree]: {
    1: [
      ['tag', shortUIntConst(Tag.AccountsMtree)],
      ['version', shortUIntConst(1)],
      ['accounts', entry()],
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
      ['ctVersion', ctVersion],
      ['fee', fee],
      ['ttl', ttl],
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
      ['abiVersion', abiVersion],
      ['fee', fee],
      ['gasLimit', gasLimit],
      ['gasPrice', gasPrice],
      ['tx', entry()],
    ],
  },
  [Tag.PayingForTx]: {
    1: [
      ['tag', shortUIntConst(Tag.PayingForTx)],
      ['version', shortUIntConst(1)],
      ['payerId', address(Encoding.AccountAddress)],
      ['nonce', shortUInt],
      ['fee', fee],
      ['tx', entry()],
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

export type TxSchema = TxTypeSchemas[Tag];
export type TxParamsCommon = Partial<UnionToIntersection<TxSchema>>;
