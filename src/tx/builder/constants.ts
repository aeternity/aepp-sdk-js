import BigNumber from 'bignumber.js';
import { EncodingType } from '../../utils/encoder';
import { mapObject } from '../../utils/other';

// # AENS
export type AensName = `${string}.chain`;
export const NAME_TTL = 180000;
// # max number of block into the future that the name is going to be available
// # https://github.com/aeternity/protocol/blob/epoch-v0.22.0/AENS.md#update
// # https://github.com/aeternity/protocol/blob/44a93d3aab957ca820183c3520b9daf6b0fedff4/AENS.md#aens-entry
export const NAME_MAX_TTL = 36000;
export const NAME_MAX_CLIENT_TTL = 84600;
export const CLIENT_TTL = NAME_MAX_CLIENT_TTL;
export const MIN_GAS_PRICE = 1e9;
// # see https://github.com/aeternity/aeternity/blob/72e440b8731422e335f879a31ecbbee7ac23a1cf/apps/aecore/src/aec_governance.erl#L67
export const NAME_FEE_MULTIPLIER = 1e14; // 100000000000000
export const NAME_FEE_BID_INCREMENT = 0.05; // # the increment is in percentage
// # see https://github.com/aeternity/aeternity/blob/72e440b8731422e335f879a31ecbbee7ac23a1cf/apps/aecore/src/aec_governance.erl#L272
export const NAME_BID_TIMEOUT_BLOCKS = 480; // # ~1 day
// # this is the max length for a domain that requires a base fee to be paid
export const NAME_MAX_LENGTH_FEE = 31;
export const NAME_BID_MAX_LENGTH = 12; // # this is the max length for a domain to be part of a bid
export enum POINTER_KEY_BY_PREFIX {
  ak = 'account_pubkey',
  ok = 'oracle_pubkey',
  ct = 'contract_pubkey',
  ch = 'channel',
}
// # https://github.com/aeternity/aeternity/blob/72e440b8731422e335f879a31ecbbee7ac23a1cf/apps/aecore/src/aec_governance.erl#L290
// # https://github.com/aeternity/protocol/blob/master/AENS.md#protocol-fees-and-protection-times
// # bid ranges:
export const NAME_BID_RANGES = mapObject({
  31: 3,
  30: 5,
  29: 8,
  28: 13,
  27: 21,
  26: 34,
  25: 55,
  24: 89,
  23: 144,
  22: 233,
  21: 377,
  20: 610,
  19: 987,
  18: 1597,
  17: 2584,
  16: 4181,
  15: 6765,
  14: 10946,
  13: 17711,
  12: 28657,
  11: 46368,
  10: 75025,
  9: 121393,
  8: 196418,
  7: 317811,
  6: 514229,
  5: 832040,
  4: 1346269,
  3: 2178309,
  2: 3524578,
  1: 5702887,
}, ([key, value]) => [key, new BigNumber(value).times(NAME_FEE_MULTIPLIER)]);

// # Tag constant for ids (type uint8)
// # see https://github.com/aeternity/protocol/blob/master/serializations.md#the-id-type
// # <<Tag:1/unsigned-integer-unit:8, Hash:32/binary-unit:8>>
const ID_TAG_ACCOUNT = 1;
const ID_TAG_NAME = 2;
const ID_TAG_COMMITMENT = 3;
const ID_TAG_ORACLE = 4;
const ID_TAG_CONTRACT = 5;
const ID_TAG_CHANNEL = 6;

export const ID_TAG = {
  account: ID_TAG_ACCOUNT,
  name: ID_TAG_NAME,
  commitment: ID_TAG_COMMITMENT,
  oracle: ID_TAG_ORACLE,
  contract: ID_TAG_CONTRACT,
  channel: ID_TAG_CHANNEL,
};

export const PREFIX_ID_TAG = {
  ak: ID_TAG.account,
  nm: ID_TAG.name,
  cm: ID_TAG.commitment,
  ok: ID_TAG.oracle,
  ct: ID_TAG.contract,
  ch: ID_TAG.channel,
} as const;

export const ID_TAG_PREFIX = mapObject(
  PREFIX_ID_TAG,
  ([key, value]: [EncodingType, number]) => [value, key],
);

/**
 * Enum with transaction types
 * @category transaction builder
 * @see {@link https://github.com/aeternity/protocol/blob/0f6dee3d9d1e8e2469816798f5c7587a6c918f94/serializations.md#binary-serialization}
 */
export enum TX_TYPE {
  account = 10,
  signed = 11,
  spend = 12,
  oracleRegister = 22,
  oracleQuery = 23,
  oracleResponse = 24,
  oracleExtend = 25,
  nameClaim = 32,
  namePreClaim = 33,
  nameUpdate = 34,
  nameRevoke = 35,
  nameTransfer = 36,
  contract = 40,
  contractCallResult = 41,
  contractCreate = 42,
  contractCall = 43,
  channelCreate = 50,
  channelDeposit = 51,
  channelWithdraw = 52,
  channelCloseMutual = 53,
  channelCloseSolo = 54,
  channelSlash = 55,
  channelSettle = 56,
  channelOffChain = 57,
  channel = 58,
  channelSnapshotSolo = 59,
  proofOfInclusion = 60,
  stateTrees = 62,
  merklePatriciaTree = 63,
  merklePatriciaTreeValue = 64,
  sophiaByteCode = 70,
  gaAttach = 80,
  gaMeta = 81,
  payingFor = 82,
  channelForceProgress = 521,
  channelOffChainUpdateTransfer = 570,
  channelOffChainUpdateDeposit = 571,
  channelOffChainUpdateWithdrawal = 572,
  channelOffChainCreateContract = 573,
  channelOffChainCallContract = 574,
  channelReconnect = 575,
  contractsTree = 621,
  contractCallsTree = 622,
  channelsTree = 623,
  nameserviceTree = 624,
  oraclesTree = 625,
  accountsTree = 626,
}
