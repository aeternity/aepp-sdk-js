import { IllegalArgumentError } from '../../../utils/errors';
import { MIN_GAS_PRICE, Tag, MAX_AUTH_FUN_GAS } from '../constants';
import shortUInt from './short-u-int';
import { buildFee } from './fee';

function calculateGasLimitMax(
  gasMax: number,
  rebuildTx: (value: number) => any,
): number {
  return gasMax - +buildFee(rebuildTx(gasMax)).dividedBy(MIN_GAS_PRICE);
}

export default {
  ...shortUInt,

  serialize(
    _value: number | undefined,
    {
      tag, rebuildTx, gasMax = 6e6, _computingGasLimit,
    }: {
      tag: Tag;
      rebuildTx: (params: any) => any;
      gasMax: number;
      _computingGasLimit?: number;
    },
  ): Buffer {
    if (_computingGasLimit != null) return shortUInt.serialize(_computingGasLimit);

    const gasLimitMax = tag === Tag.GaMetaTx ? MAX_AUTH_FUN_GAS : calculateGasLimitMax(
      gasMax,
      (gasLimit) => rebuildTx({ _computingGasLimit: gasLimit }),
    );
    const value = _value ?? gasLimitMax;
    if (value > gasLimitMax) {
      throw new IllegalArgumentError(`Gas limit ${value} must be less or equal to ${gasLimitMax}`);
    }
    return shortUInt.serialize(value);
  },
};
