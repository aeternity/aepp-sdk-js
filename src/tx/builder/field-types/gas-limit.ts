import { IllegalArgumentError } from '../../../utils/errors';
import { MIN_GAS_PRICE, Tag } from '../constants';
import shortUInt from './short-u-int';
import { buildFee } from './fee';

function calculateGasLimitMax(
  txType: Tag,
  gasMax: number,
  rebuildTx: (value: number) => any,
): number {
  return gasMax - +buildFee(txType, rebuildTx(gasMax)).dividedBy(MIN_GAS_PRICE);
}

export default {
  ...shortUInt,

  serialize(
    _value: number | undefined,
    {
      txType, rebuildTx, gasMax = 6e6, _computingGasLimit,
    }: {
      txType: Tag;
      rebuildTx: (params: any) => any;
      gasMax: number;
      _computingGasLimit?: number;
    },
  ): Buffer {
    if (_computingGasLimit != null) return shortUInt.serialize(_computingGasLimit);

    const gasLimitMax = calculateGasLimitMax(
      txType,
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
