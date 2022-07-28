import BigNumber from 'bignumber.js';
import { buildTx } from '../tx/builder';
import { Tag } from '../tx/builder/constants';
import { calculateMinFee as calculateMinFeeInternal } from '../tx/builder/field-types/fee';
import { TxParamsCommon } from '../tx/builder/schema';
import { AE_AMOUNT_FORMATS } from '../utils/amount-formatter';
import { mapObject } from '../utils/other';
import { Encoding } from '../utils/encoder';

export * from './methods';

/**
 * @deprecated use NamePointer from apis/node instead
 * @hidden
 */
export interface Pointer {
  key: string;
  id: string;
}

/**
 * @deprecated use genSalt instead
 * @hidden
 */
export function salt(): number {
  return Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER));
}

/**
 * @deprecated use genSalt instead
 * @hidden
 */
export const createSalt = salt;

/**
 * Calculate min fee
 * @category transaction builder
 * @param txType - Transaction type
 * @param options - Options object
 * @param options.params - Tx params
 * @deprecated use buildTx to generate transaction, unpack it and refer to `fee` field
 * @hidden
 * @example
 * ```js
 * calculateMinFee('spendTx', { gasLimit, params })
 * ```
 */
export function calculateMinFee(
  txType: Tag,
  { params, vsn, denomination }: CalculateMinFeeOptions,
): BigNumber {
  return calculateMinFeeInternal(
    txType,
    (fee: BigNumber) => (
      // @ts-expect-error anyway this planned to be removed
      buildTx({ ...params, _computingMinFee: fee }, txType, { vsn, denomination })
    ),
  );
}

interface CalculateMinFeeOptions {
  params: TxParamsCommon;
  vsn?: number;
  denomination?: AE_AMOUNT_FORMATS;
}

/**
 * @deprecated Maximum gas limit depends on transaction size, this value is outdated,
 * sdk check/provides gasLimit by itself while building a transaction
 * @hidden
 */
export const GAS_MAX = 1600000 - 21000;

/**
 * @deprecated use `Tag`
 * @hidden
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

/**
 * @deprecated use `readId`, `writeId`
 * @hidden
 */
export const ID_TAG = {
  account: 1,
  name: 2,
  commitment: 3,
  oracle: 4,
  contract: 5,
  channel: 6,
} as const;

/**
 * @deprecated use `readId`, `writeId`
 * @hidden
 */
export const PREFIX_ID_TAG = {
  ak: ID_TAG.account,
  nm: ID_TAG.name,
  cm: ID_TAG.commitment,
  ok: ID_TAG.oracle,
  ct: ID_TAG.contract,
  ch: ID_TAG.channel,
} as const;

/**
 * @deprecated use `readId`, `writeId`
 * @hidden
 */
export const ID_TAG_PREFIX = mapObject(
  PREFIX_ID_TAG,
  ([key, value]: [Encoding, number]) => [value, key],
);

/**
 * @deprecated use `getDefaultPointerKey`
 * @hidden
 */
export enum POINTER_KEY_BY_PREFIX {
  ak = 'account_pubkey',
  ok = 'oracle_pubkey',
  ct = 'contract_pubkey',
  ch = 'channel',
}
