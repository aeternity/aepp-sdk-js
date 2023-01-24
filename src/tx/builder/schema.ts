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
  array, boolean, ctVersion, abiVersion, ttl, nonce,
} from './field-types';
import { Encoding } from '../../utils/encoder';
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

export enum CallReturnType {
  Ok = 0,
  Error = 1,
  Revert = 2,
}

/**
 * @see {@link https://github.com/aeternity/protocol/blob/c007deeac4a01e401238412801ac7084ac72d60e/serializations.md#accounts-version-1-basic-accounts}
 */
export const txSchema = {
  [Tag.Account]: {
    1: {
      tag: shortUIntConst(Tag.Account),
      version: shortUIntConst(1),
      nonce: shortUInt,
      balance: uInt,
    },
    2: {
      tag: shortUIntConst(Tag.Account),
      version: shortUIntConst(2, true),
      flags: uInt,
      nonce: shortUInt,
      balance: uInt,
      gaContract: address(Encoding.ContractAddress, Encoding.Name),
      gaAuthFun: encoded(Encoding.ContractBytearray),
    },
  },
  [Tag.SignedTx]: {
    1: {
      tag: shortUIntConst(Tag.SignedTx),
      version: shortUIntConst(1, true),
      signatures: array(raw),
      encodedTx: entry(),
    },
  },
  [Tag.SpendTx]: {
    1: {
      tag: shortUIntConst(Tag.SpendTx),
      version: shortUIntConst(1, true),
      senderId: address(Encoding.AccountAddress),
      recipientId: address(Encoding.AccountAddress, Encoding.Name),
      amount: coinAmount,
      fee,
      ttl,
      nonce: nonce('senderId'),
      payload: encoded(Encoding.Bytearray, true),
    },
  },
  [Tag.Name]: {
    1: {
      tag: shortUIntConst(Tag.Name),
      version: shortUIntConst(1, true),
      accountId: address(Encoding.AccountAddress),
      nameTtl: shortUInt,
      status: raw,
      clientTtl: shortUInt,
      pointers,
    },
  },
  [Tag.NamePreclaimTx]: {
    1: {
      tag: shortUIntConst(Tag.NamePreclaimTx),
      version: shortUIntConst(1, true),
      accountId: address(Encoding.AccountAddress),
      nonce: nonce('accountId'),
      commitmentId: address(Encoding.Commitment),
      fee,
      ttl,
    },
  },
  [Tag.NameClaimTx]: {
    2: {
      tag: shortUIntConst(Tag.NameClaimTx),
      version: shortUIntConst(2, true),
      accountId: address(Encoding.AccountAddress),
      nonce: nonce('accountId'),
      name,
      nameSalt: uInt,
      nameFee,
      fee,
      ttl,
    },
  },
  [Tag.NameUpdateTx]: {
    1: {
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
    },
  },
  [Tag.NameTransferTx]: {
    1: {
      tag: shortUIntConst(Tag.NameTransferTx),
      version: shortUIntConst(1, true),
      accountId: address(Encoding.AccountAddress),
      nonce: nonce('accountId'),
      nameId,
      recipientId: address(Encoding.AccountAddress, Encoding.Name),
      fee,
      ttl,
    },
  },
  [Tag.NameRevokeTx]: {
    1: {
      tag: shortUIntConst(Tag.NameRevokeTx),
      version: shortUIntConst(1, true),
      accountId: address(Encoding.AccountAddress),
      nonce: nonce('accountId'),
      nameId,
      fee,
      ttl,
    },
  },
  [Tag.Contract]: {
    1: {
      tag: shortUIntConst(Tag.Contract),
      version: shortUIntConst(1, true),
      owner: address(Encoding.AccountAddress),
      ctVersion,
      code: encoded(Encoding.ContractBytearray),
      log: encoded(Encoding.ContractBytearray),
      active: boolean,
      referers: array(address(Encoding.AccountAddress)),
      deposit,
    },
  },
  [Tag.ContractCreateTx]: {
    1: {
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
    },
  },
  [Tag.ContractCallTx]: {
    1: {
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
    },
  },
  [Tag.ContractCall]: {
    1: {
      tag: shortUIntConst(Tag.ContractCall),
      version: shortUIntConst(1, true),
      callerId: address(Encoding.AccountAddress),
      callerNonce: shortUInt,
      height: shortUInt,
      contractId: address(Encoding.ContractAddress),
      gasPrice,
      gasUsed: shortUInt,
      returnValue: encoded(Encoding.ContractBytearray),
      returnType: enumeration(CallReturnType),
      // TODO: add serialization for
      //  <log> :: [ { <address> :: id, [ <topics> :: binary() }, <data> :: binary() } ]
      log: raw,
    },
  },
  [Tag.Oracle]: {
    1: {
      tag: shortUIntConst(Tag.Oracle),
      version: shortUIntConst(1, true),
      accountId: address(Encoding.AccountAddress),
      queryFormat: string,
      responseFormat: string,
      queryFee: coinAmount,
      oracleTtlValue: shortUInt,
      abiVersion,
    },
  },
  [Tag.OracleRegisterTx]: {
    1: {
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
    },
  },
  [Tag.OracleExtendTx]: {
    1: {
      tag: shortUIntConst(Tag.OracleExtendTx),
      version: shortUIntConst(1, true),
      oracleId: address(Encoding.OracleAddress, Encoding.Name),
      nonce: nonce('callerId'),
      oracleTtlType: enumeration(ORACLE_TTL_TYPES),
      oracleTtlValue: shortUInt,
      fee,
      ttl,
    },
  },
  [Tag.OracleQueryTx]: {
    1: {
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
    },
  },
  [Tag.OracleResponseTx]: {
    1: {
      tag: shortUIntConst(Tag.OracleResponseTx),
      version: shortUIntConst(1, true),
      oracleId: address(Encoding.OracleAddress),
      nonce: nonce('callerId'),
      queryId: encoded(Encoding.OracleQueryId),
      response: string,
      responseTtlType: enumeration(ORACLE_TTL_TYPES),
      responseTtlValue: shortUInt,
      fee,
      ttl,
    },
  },
  [Tag.ChannelCreateTx]: {
    2: {
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
  },
  [Tag.ChannelCloseMutualTx]: {
    1: {
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
  },
  [Tag.ChannelCloseSoloTx]: {
    1: {
      tag: shortUIntConst(Tag.ChannelCloseSoloTx),
      version: shortUIntConst(1, true),
      channelId: address(Encoding.Channel),
      fromId: address(Encoding.AccountAddress),
      payload: encoded(Encoding.Transaction),
      poi: entry(Tag.TreesPoi),
      ttl,
      fee,
      nonce: nonce('fromId'),
    },
  },
  [Tag.ChannelSlashTx]: {
    1: {
      tag: shortUIntConst(Tag.ChannelSlashTx),
      version: shortUIntConst(1, true),
      channelId: address(Encoding.Channel),
      fromId: address(Encoding.AccountAddress),
      payload: encoded(Encoding.Transaction),
      poi: entry(Tag.TreesPoi),
      ttl,
      fee,
      nonce: nonce('fromId'),
    },
  },
  [Tag.ChannelDepositTx]: {
    1: {
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
  },
  [Tag.ChannelWithdrawTx]: {
    1: {
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
  },
  [Tag.ChannelSettleTx]: {
    1: {
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
  },
  [Tag.ChannelForceProgressTx]: {
    1: {
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
  },
  [Tag.ChannelOffChainTx]: {
    2: {
      tag: shortUIntConst(Tag.ChannelOffChainTx),
      version: shortUIntConst(2, true),
      channelId: address(Encoding.Channel),
      round: shortUInt,
      stateHash: encoded(Encoding.State),
    },
  },
  [Tag.Channel]: {
    3: {
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
    },
  },
  [Tag.ChannelSnapshotSoloTx]: {
    1: {
      tag: shortUIntConst(Tag.ChannelSnapshotSoloTx),
      version: shortUIntConst(1, true),
      channelId: address(Encoding.Channel),
      fromId: address(Encoding.AccountAddress),
      payload: encoded(Encoding.Transaction),
      ttl,
      fee,
      nonce: nonce('fromId'),
    },
  },
  [Tag.ChannelOffChainUpdateTransfer]: {
    1: {
      tag: shortUIntConst(Tag.ChannelOffChainUpdateTransfer),
      version: shortUIntConst(1, true),
      from: address(Encoding.AccountAddress),
      to: address(Encoding.AccountAddress),
      amount: uInt,
    },
  },
  [Tag.ChannelOffChainUpdateDeposit]: {
    1: {
      tag: shortUIntConst(Tag.ChannelOffChainUpdateDeposit),
      version: shortUIntConst(1, true),
      from: address(Encoding.AccountAddress),
      amount: uInt,
    },
  },
  [Tag.ChannelOffChainUpdateWithdraw]: {
    1: {
      tag: shortUIntConst(Tag.ChannelOffChainUpdateWithdraw),
      version: shortUIntConst(1, true),
      from: address(Encoding.AccountAddress),
      amount: uInt,
    },
  },
  [Tag.ChannelOffChainUpdateCreateContract]: {
    1: {
      tag: shortUIntConst(Tag.ChannelOffChainUpdateCreateContract),
      version: shortUIntConst(1, true),
      owner: address(Encoding.AccountAddress),
      ctVersion,
      code: encoded(Encoding.ContractBytearray),
      deposit: uInt,
      callData: encoded(Encoding.ContractBytearray),
    },
  },
  [Tag.ChannelOffChainUpdateCallContract]: {
    1: {
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
    },
  },
  [Tag.ChannelClientReconnectTx]: {
    1: {
      tag: shortUIntConst(Tag.ChannelClientReconnectTx),
      version: shortUIntConst(1, true),
      channelId: address(Encoding.Channel),
      round: shortUInt,
      role: string,
      pubkey: address(Encoding.AccountAddress),
    },
  },
  [Tag.TreesPoi]: {
    1: {
      tag: shortUIntConst(Tag.TreesPoi),
      version: shortUIntConst(1, true),
      accounts: array(mptree(Encoding.AccountAddress, Tag.Account)),
      calls: array(mptree(Encoding.Bytearray, Tag.ContractCall)),
      channels: array(mptree(Encoding.Channel, Tag.Channel)),
      contracts: array(mptree(Encoding.ContractAddress, Tag.Contract)),
      ns: array(mptree(Encoding.Name, Tag.Name)),
      oracles: array(mptree(Encoding.OracleAddress, Tag.Oracle)),
    },
  },
  [Tag.StateTrees]: {
    1: {
      tag: shortUIntConst(Tag.StateTrees),
      version: shortUIntConst(1, true),
      contracts: entry(),
      calls: entry(),
      channels: entry(),
      ns: entry(),
      oracles: entry(),
      accounts: entry(),
    },
  },
  [Tag.Mtree]: {
    1: {
      tag: shortUIntConst(Tag.Mtree),
      version: shortUIntConst(1, true),
      values: array(entry()),
    },
  },
  [Tag.MtreeValue]: {
    1: {
      tag: shortUIntConst(Tag.MtreeValue),
      version: shortUIntConst(1, true),
      key: raw,
      value: raw,
    },
  },
  [Tag.ContractsMtree]: {
    1: {
      tag: shortUIntConst(Tag.ContractsMtree),
      version: shortUIntConst(1, true),
      contracts: entry(),
    },
  },
  [Tag.CallsMtree]: {
    1: {
      tag: shortUIntConst(Tag.CallsMtree),
      version: shortUIntConst(1, true),
      calls: entry(),
    },
  },
  [Tag.ChannelsMtree]: {
    1: {
      tag: shortUIntConst(Tag.ChannelsMtree),
      version: shortUIntConst(1, true),
      channels: entry(),
    },
  },
  [Tag.NameserviceMtree]: {
    1: {
      tag: shortUIntConst(Tag.NameserviceMtree),
      version: shortUIntConst(1, true),
      mtree: entry(),
    },
  },
  [Tag.OraclesMtree]: {
    1: {
      tag: shortUIntConst(Tag.OraclesMtree),
      version: shortUIntConst(1, true),
      otree: entry(),
    },
  },
  [Tag.AccountsMtree]: {
    1: {
      tag: shortUIntConst(Tag.AccountsMtree),
      version: shortUIntConst(1, true),
      accounts: entry(),
    },
  },
  [Tag.GaAttachTx]: {
    1: {
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
  },
  [Tag.GaMetaTx]: {
    2: {
      tag: shortUIntConst(Tag.GaMetaTx),
      version: shortUIntConst(2, true),
      gaId: address(Encoding.AccountAddress),
      authData: encoded(Encoding.ContractBytearray),
      abiVersion,
      fee,
      gasLimit,
      gasPrice,
      tx: entry(),
    },
  },
  [Tag.PayingForTx]: {
    1: {
      tag: shortUIntConst(Tag.PayingForTx),
      version: shortUIntConst(1, true),
      payerId: address(Encoding.AccountAddress),
      nonce: nonce('payerId'),
      fee,
      tx: entry(),
    },
  },
} as const;

type TxSchema = SchemaTypes<typeof txSchema>;
export type TxParams = TxSchema['TxParams'];
export type TxParamsAsync = TxSchema['TxParamsAsync'];
export type TxUnpacked = TxSchema['TxUnpacked'];
