import { IllegalArgumentError } from '../../../utils/errors';
import { MIN_GAS_PRICE, Tag, MAX_AUTH_FUN_GAS } from '../constants';
import shortUInt from './short-u-int';
import { buildFee } from './fee';
import type { unpackTx as unpackTxType, buildTx as buildTxType } from '../index';

function calculateGasLimitMax(
  gasMax: number,
  rebuildTx: (value: number) => any,
  unpackTx: typeof unpackTxType,
  buildTx: typeof buildTxType,
): number {
  return gasMax - +buildFee(rebuildTx(gasMax), unpackTx, buildTx).dividedBy(MIN_GAS_PRICE);
}

export default {
  ...shortUInt,

  serialize(
    _value: number | undefined,
    {
      tag, rebuildTx, unpackTx, buildTx, _computingGasLimit,
    }: {
      tag: Tag;
      rebuildTx: (params: any) => any;
      unpackTx: typeof unpackTxType;
      buildTx: typeof buildTxType;
      _computingGasLimit?: number;
    },
    { gasMax = 6e6 }: { gasMax?: number },
  ): Buffer {
    if (_computingGasLimit != null) return shortUInt.serialize(_computingGasLimit);

    const gasLimitMax = tag === Tag.GaMetaTx ? MAX_AUTH_FUN_GAS : calculateGasLimitMax(
      gasMax,
      (gasLimit) => rebuildTx({ _computingGasLimit: gasLimit, _pickBiggerFee: true }),
      unpackTx,
      buildTx,
    );
    const value = _value ?? gasLimitMax;
    if (value > gasLimitMax) {
      throw new IllegalArgumentError(`Gas limit ${value} must be less or equal to ${gasLimitMax}`);
    }
    return shortUInt.serialize(value);
  },
};
