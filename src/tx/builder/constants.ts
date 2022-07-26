import BigNumber from 'bignumber.js';
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

/**
 * Enum with tag types
 * @category transaction builder
 * @see {@link https://github.com/aeternity/protocol/blob/0f6dee3d9d1e8e2469816798f5c7587a6c918f94/serializations.md#binary-serialization}
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_chain_objects.erl#L39-L97}
 */
// TODO: implement serialisation for commented-out tags
export enum Tag {
  Account = 10,
  SignedTx = 11,
  SpendTx = 12,
  // Oracle = 20,
  // OracleQuery = 21,
  OracleRegisterTx = 22,
  OracleQueryTx = 23,
  OracleResponseTx = 24,
  OracleExtendTx = 25,
  // Name = 30,
  // NameCommitment = 31,
  NameClaimTx = 32,
  NamePreclaimTx = 33,
  NameUpdateTx = 34,
  NameRevokeTx = 35,
  NameTransferTx = 36,
  // NameAuction = 37,
  Contract = 40,
  ContractCall = 41,
  ContractCreateTx = 42,
  ContractCallTx = 43,
  ChannelCreateTx = 50,
  // ChannelSetDelegatesTx = 501,
  ChannelDepositTx = 51,
  ChannelWithdrawTx = 52,
  ChannelForceProgressTx = 521,
  ChannelCloseMutualTx = 53,
  ChannelCloseSoloTx = 54,
  ChannelSlashTx = 55,
  ChannelSettleTx = 56,
  ChannelOffChainTx = 57,
  ChannelOffChainUpdateTransfer = 570,
  ChannelOffChainUpdateDeposit = 571,
  ChannelOffChainUpdateWithdraw = 572,
  ChannelOffChainUpdateCreateContract = 573,
  ChannelOffChainUpdateCallContract = 574,
  // ChannelOffChainUpdateMeta = 576,
  ChannelClientReconnectTx = 575,
  Channel = 58,
  ChannelSnapshotSoloTx = 59,
  TreesPoi = 60,
  // TreesDb = 61,
  StateTrees = 62,
  Mtree = 63,
  MtreeValue = 64,
  ContractsMtree = 621,
  CallsMtree = 622,
  ChannelsMtree = 623,
  NameserviceMtree = 624,
  OraclesMtree = 625,
  AccountsMtree = 626,
  CompilerSophia = 70,
  GaAttachTx = 80,
  GaMetaTx = 81,
  PayingForTx = 82,
  // KeyBlock = 100,
  // MicroBlock = 101,
  // LightMicroBlock = 102,
  // Pof = 200,
}
