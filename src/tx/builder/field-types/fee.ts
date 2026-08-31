import BigNumber from 'bignumber.js';
import { ArgumentError, IllegalArgumentError, InternalError } from '../../../utils/errors.js';
import { Int, Tag } from '../constants.js';
import {
  defaultProtocolParameters,
  maxOf,
  ProtocolParameters,
  ProtocolParametersOption,
} from '../protocol-parameters.js';
import uInt from './u-int.js';
import coinAmount from './coin-amount.js';
import { getCachedIncreasedGasPrice } from './gas-price.js';
import { isKeyOfObject } from '../../../utils/other.js';
import { serializeAsIsParam, SerializeAsIsParams } from './interface.js';
import { decode, Encoded } from '../../../utils/encoder.js';
import type { unpackTx as unpackTxType, buildTx as buildTxType } from '../index.js';
import Node from '../../../Node.js';

/**
 * Get the base gas
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param txObject - The unpacked transaction
 * @param protocolParameters - The protocol parameters
 * @returns The base gas
 */
function getTxBaseGas(txObject: any, protocolParameters: ProtocolParameters): number {
  const { tag }: { tag: Tag } = txObject;
  const byAbiVersion = protocolParameters.contractTxBaseGas[tag];
  if (byAbiVersion != null) {
    const abiVersion = txObject.ctVersion?.abiVersion ?? txObject.abiVersion;
    // read only what the checks in `protocol-parameters.ts` iterate, so that the two can't
    // disagree about what the parameters hold — anything inherited is not a base gas
    const gas = Object.prototype.hasOwnProperty.call(byAbiVersion, abiVersion)
      ? byAbiVersion[abiVersion as keyof typeof byAbiVersion]
      : undefined;
    if (gas != null) return gas;
    // node charges the maximum base gas for an abi version it doesn't know
    const knownAbiVersions = Object.values(byAbiVersion);
    // the maximum of nothing is `-Infinity`, fall through to `txBaseGas` instead
    if (knownAbiVersions.length !== 0) return maxOf(knownAbiVersions);
  }
  const gas = protocolParameters.txBaseGas[tag];
  if (gas == null) throw new InternalError(`Base gas of ${Tag[tag]} is not known`);
  return gas;
}

/**
 * Calculate gas for other types of transactions
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param txType - The transaction type
 * @param txSize - The transaction size
 * @param parameters - The transaction parameters
 * @param parameters.relativeTtl - The relative ttl
 * @param parameters.innerTxSize - The size of the inner transaction
 * @param protocolParameters - The protocol parameters
 * @returns The other gas
 */
function getTxOtherGas(
  txType: Tag,
  txSize: number,
  { relativeTtl, innerTxSize }: { relativeTtl: number; innerTxSize: number },
  protocolParameters: ProtocolParameters,
): number {
  const { gasPerByte } = protocolParameters;
  // the inner transaction of a meta transaction pays for its own bytes in its own fee. The
  // deduction is separate from the state gas below: node reporting a state gas fraction for
  // `GaMetaTx`/`PayingForTx` must not cancel it — that would charge the inner transaction twice
  const isMeta = txType === Tag.GaMetaTx || txType === Tag.PayingForTx;
  const sizeGas = (isMeta ? txSize - innerTxSize : txSize) * gasPerByte;
  // oracle transactions pay a state rent for the time their entry occupies the state tree
  const stateGas = protocolParameters.stateGasPerBlock[txType];
  if (stateGas == null) return sizeGas;
  return sizeGas + Math.ceil((stateGas.part * relativeTtl) / stateGas.whole);
}

function getOracleRelativeTtl(params: any): number {
  const ttlKeys = {
    [Tag.OracleRegisterTx]: 'oracleTtlValue',
    [Tag.OracleExtendTx]: 'oracleTtlValue',
    [Tag.OracleQueryTx]: 'queryTtlValue',
    [Tag.OracleRespondTx]: 'responseTtlValue',
  } as const;

  const { tag } = params;
  if (!isKeyOfObject(tag, ttlKeys)) return 1;
  return params[ttlKeys[tag]];
}

/**
 * Calculate gas based on tx type and params
 */
export function buildGas(
  builtTx: Encoded.Transaction,
  unpackTx: typeof unpackTxType,
  buildTx: typeof buildTxType,
  protocolParameters: ProtocolParameters,
): number {
  const { length } = decode(builtTx);
  const txObject = unpackTx(builtTx);

  let innerTxSize = 0;
  if (txObject.tag === Tag.GaMetaTx || txObject.tag === Tag.PayingForTx) {
    // this rebuild only measures the size of an already signed inner transaction, its values are
    // serialized as they are — see `serializeAsIsParam`
    const innerTx = { ...txObject.tx.encodedTx, [serializeAsIsParam]: true };
    innerTxSize = decode(buildTx(innerTx as Parameters<typeof buildTx>[0])).length;
  }

  return (
    getTxBaseGas(txObject, protocolParameters) +
    getTxOtherGas(
      txObject.tag,
      length,
      { relativeTtl: getOracleRelativeTtl(txObject), innerTxSize },
      protocolParameters,
    )
  );
}

/**
 * Calculate min fee
 * @category transaction builder
 * @param rebuildTx - Callback to get built transaction with specific fee
 */
function calculateMinFee(
  rebuildTx: (value: BigNumber) => Encoded.Transaction,
  unpackTx: typeof unpackTxType,
  buildTx: typeof buildTxType,
  protocolParameters: ProtocolParameters,
): BigNumber {
  const minGasPrice = new BigNumber(protocolParameters.minGasPrice.toString());
  let fee = new BigNumber(0);
  let previousFee;
  do {
    previousFee = fee;
    fee = minGasPrice.times(buildGas(rebuildTx(fee), unpackTx, buildTx, protocolParameters));
  } while (!fee.eq(previousFee));
  return fee;
}

// TODO: Get rid of this workaround. Transaction builder can't accept/return gas price instead of
// fee because it may get a decimal gas price. So, it should accept the optional `gasPrice` even
// if it is not a contract-related transaction. And use this `gasPrice` to calculate `fee`.
const gasPricePrefix = '_gas-price:';

export interface SerializeAettosParams extends SerializeAsIsParams {
  rebuildTx: (params: any) => Encoded.Transaction;
  unpackTx: typeof unpackTxType;
  buildTx: typeof buildTxType;
  _computingMinFee?: BigNumber;
}

export default {
  ...coinAmount,

  async prepare(
    value: Int | undefined,
    params: {},
    { onNode, protocolParameters }: { onNode?: Node } & ProtocolParametersOption,
  ): Promise<Int | undefined> {
    if (value != null) return value;
    if (onNode == null) {
      throw new ArgumentError('onNode', 'provided (or provide `fee` instead)', onNode);
    }
    const gasPrice = await getCachedIncreasedGasPrice(onNode, protocolParameters);
    if (gasPrice === 0n) return undefined;
    return gasPricePrefix + gasPrice;
  },

  serializeAettos(
    _value: string | undefined,
    params: SerializeAettosParams,
    {
      _canIncreaseFee,
      protocolParameters = defaultProtocolParameters,
    }: { _canIncreaseFee?: boolean } & ProtocolParametersOption,
  ): string {
    const { rebuildTx, unpackTx, buildTx, _computingMinFee } = params;
    if (_computingMinFee != null) return _computingMinFee.toFixed();
    if (params[serializeAsIsParam] === true && _value != null)
      return new BigNumber(_value).toFixed();
    const minFee = calculateMinFee(
      (fee) => rebuildTx({ _computingMinFee: fee }),
      unpackTx,
      buildTx,
      protocolParameters,
    );
    const value =
      _value?.startsWith(gasPricePrefix) === true
        ? minFee
            .dividedBy(protocolParameters.minGasPrice.toString())
            .times(_value.replace(gasPricePrefix, ''))
        : new BigNumber(_value ?? minFee);
    if (minFee.gt(value)) {
      if (_canIncreaseFee === true) return minFee.toFixed();
      throw new IllegalArgumentError(`Fee ${value.toString()} must be bigger than ${minFee}`);
    }
    return value.toFixed();
  },

  serialize(
    value: Parameters<typeof coinAmount.serialize>[0],
    params: Parameters<typeof coinAmount.serialize>[1] & SerializeAettosParams,
    options: { _canIncreaseFee?: boolean } & ProtocolParametersOption &
      Parameters<typeof coinAmount.serialize>[2],
  ): Buffer {
    if (typeof value === 'string' && value.startsWith(gasPricePrefix)) {
      return uInt.serialize(this.serializeAettos(value, params, options));
    }
    return coinAmount.serialize.call(this, value, params, options);
  },
};
