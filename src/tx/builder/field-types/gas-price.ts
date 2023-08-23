import BigNumber from 'bignumber.js';
import coinAmount from './coin-amount';
import { ArgumentError, IllegalArgumentError } from '../../../utils/errors';
import { Int, MIN_GAS_PRICE } from '../constants';
import Node from '../../../Node';
import { AE_AMOUNT_FORMATS, formatAmount } from '../../../utils/amount-formatter';
import semverSatisfies from '../../../utils/semver-satisfies';

const gasPriceCache: WeakMap<Node, { time: number; gasPrice: bigint }> = new WeakMap();

export async function getCachedIncreasedGasPrice(node: Node): Promise<bigint> {
  const cache = gasPriceCache.get(node);
  if (cache != null && cache.time > Date.now() - 20 * 1000) {
    return cache.gasPrice;
  }

  // TODO: remove after requiring node@6.13.0
  const { nodeVersion } = await node._getCachedStatus();
  // TODO: remove remove '6.12.0+' check after releasing 6.13.0
  if (!nodeVersion.startsWith('6.12.0+') && !semverSatisfies(nodeVersion, '6.13.0', '7.0.0')) {
    return 0n;
  }

  const { minGasPrice, utilization } = (await node.getRecentGasPrices())[0];
  let gasPrice = utilization < 70 ? 0n : BigInt(
    new BigNumber(minGasPrice.toString()).times(1.01).integerValue().toFixed(),
  );

  const maxSafeGasPrice = BigInt(MIN_GAS_PRICE) * 100000n; // max microblock fee is 600ae or 35usd
  if (gasPrice > maxSafeGasPrice) {
    console.warn([
      `Estimated gas price ${gasPrice} exceeds the maximum safe value for unknown reason.`,
      `It will be limited to ${maxSafeGasPrice}.`,
      'To overcome this restriction provide `gasPrice`/`fee` in options.',
    ].join(' '));
    gasPrice = maxSafeGasPrice;
  }

  gasPriceCache.set(node, { gasPrice, time: Date.now() });
  return gasPrice;
}

// TODO: use withFormatting after using a single type for coins representation
export default {
  ...coinAmount,

  async prepare(
    value: Int | undefined,
    params: {},
    { onNode, denomination }: {
      onNode?: Node;
      denomination?: AE_AMOUNT_FORMATS;
    },
  ): Promise<Int | undefined> {
    if (value != null) return value;
    if (onNode == null) {
      throw new ArgumentError('onNode', 'provided (or provide `gasPrice` instead)', onNode);
    }
    const gasPrice = await getCachedIncreasedGasPrice(onNode);
    if (gasPrice === 0n) return undefined;
    return formatAmount(gasPrice, { targetDenomination: denomination });
  },

  serializeAettos(value: string | undefined = MIN_GAS_PRICE.toString()): string {
    if (+value < MIN_GAS_PRICE) {
      throw new IllegalArgumentError(`Gas price ${value.toString()} must be bigger than ${MIN_GAS_PRICE}`);
    }
    return value;
  },
};
