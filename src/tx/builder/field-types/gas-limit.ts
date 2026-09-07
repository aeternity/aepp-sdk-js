import { IllegalArgumentError } from '../../../utils/errors.js';
import { Tag } from '../constants.js';
import {
  defaultProtocolParameters,
  getGasLimitDivisor,
  ProtocolParameters,
  ProtocolParametersOption,
} from '../protocol-parameters.js';
import shortUInt from './short-u-int.js';
import { buildGas } from './fee.js';
import { serializeAsIsParam, SerializeAsIsParams } from './interface.js';
import type { unpackTx as unpackTxType, buildTx as buildTxType } from '../index.js';

function calculateGasLimitMax(
  gasMax: number,
  rebuildTx: (value: number) => any,
  unpackTx: typeof unpackTxType,
  buildTx: typeof buildTxType,
  protocolParameters: ProtocolParameters,
): number {
  return gasMax - +buildGas(rebuildTx(gasMax), unpackTx, buildTx, protocolParameters);
}

export default {
  ...shortUInt,

  serialize(
    _value: number | undefined,
    params: {
      tag: Tag;
      rebuildTx: (params: any) => any;
      unpackTx: typeof unpackTxType;
      buildTx: typeof buildTxType;
      _computingGasLimit?: number;
    } & SerializeAsIsParams,
    {
      gasMax,
      protocolParameters = defaultProtocolParameters,
    }: { gasMax?: number } & ProtocolParametersOption,
  ): Buffer {
    const { tag, rebuildTx, unpackTx, buildTx, _computingGasLimit } = params;
    if (_computingGasLimit != null) return shortUInt.serialize(_computingGasLimit);
    if (params[serializeAsIsParam] === true && _value != null) return shortUInt.serialize(_value);

    const gasLimitMax =
      tag === Tag.GaMetaTx
        ? protocolParameters.maxAuthFunGas
        : calculateGasLimitMax(
            gasMax ?? protocolParameters.blockGasLimit,
            (gasLimit) => rebuildTx({ _computingGasLimit: gasLimit, _canIncreaseFee: true }),
            unpackTx,
            buildTx,
            protocolParameters,
          );
    // node raises the ceiling above through the parameter this tag reads, so the value defaulted
    // here is lowered by that raise — see `getGasLimitDivisor`. Only the default: a caller passing
    // `gasLimit`, or capping it with `gasMax`, chose it itself — except on `GaMetaTx`, whose
    // ceiling is `maxAuthFunGas` and never reads `gasMax`
    const capped = gasMax != null && tag !== Tag.GaMetaTx;
    const raise = capped ? 1 : getGasLimitDivisor(protocolParameters, tag);
    const value = _value ?? (raise > 1 ? Math.floor(gasLimitMax / raise) : gasLimitMax);
    if (value > gasLimitMax) {
      throw new IllegalArgumentError(`Gas limit ${value} must be less or equal to ${gasLimitMax}`);
    }
    return shortUInt.serialize(value);
  },
};
