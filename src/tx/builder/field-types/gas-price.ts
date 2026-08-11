import BigNumber from 'bignumber.js';
import coinAmount from './coin-amount.js';
import { ArgumentError, IllegalArgumentError } from '../../../utils/errors.js';
import { Int, MIN_GAS_PRICE } from '../constants.js';
import Node from '../../../Node.js';
import { bigIntPrefix } from '../../../utils/autorest.js';
import { AE_AMOUNT_FORMATS, formatAmount } from '../../../utils/amount-formatter.js';

const gasPriceCache: WeakMap<Node, { time: number; gasPrice: bigint }> = new WeakMap();

/**
 * Fields of `GET /v3/status` that the generated client doesn't know about. Named as they arrive
 * on the wire: a key no mapper covers is copied to the result verbatim, so it stays snake_case.
 */
interface StatusUndeclaredFields {
  min_miner_gas_price?: number | string;
}

/**
 * Reads the gas price floor the node enforces when admitting a transaction to its mempool,
 * as advertised on `GET /v3/status`, in aettos. Returns `undefined` if the node advertises none.
 *
 * A node rejects a transaction priced below its own `mining.min_miner_gas_price` before gossiping
 * it, whether or not that node mines, so an operator raising the floor on a public API node
 * changes what its clients have to pay. `/v3/recent-gas-prices` can't report that number — it
 * reflects gas prices in blocks that were already mined, and a floor no miner enforces never
 * appears there.
 *
 * The field is read untyped rather than through the generated client: `src/apis/node` is
 * generated from the node spec pinned in `tooling/autorest/node.yaml`, and no released node tag
 * carries the field yet. This becomes a typed read for free once that pin advances.
 */
async function getAdvertisedGasPriceFloor(node: Node): Promise<bigint | undefined> {
  const status = (await node.getStatus()) as unknown as StatusUndeclaredFields;
  if (status.min_miner_gas_price == null) return undefined;
  // No mapper is applied to an undeclared field, so a value above Number.MAX_SAFE_INTEGER is
  // still carrying the marker parseBigIntPolicy put on it while the body was text.
  const digits = status.min_miner_gas_price.toString().replace(bigIntPrefix, '');
  if (!/^\d+$/.test(digits)) {
    console.warn(`Node returned an unexpected min_miner_gas_price ${digits}, ignoring it.`);
    return undefined;
  }
  return BigInt(digits);
}

export async function getCachedIncreasedGasPrice(node: Node): Promise<bigint> {
  const cache = gasPriceCache.get(node);
  if (cache != null && cache.time > Date.now() - 20 * 1000) {
    return cache.gasPrice;
  }

  const [{ minGasPrice, utilization }, floor] = await Promise.all([
    node.getRecentGasPrices().then((prices) => prices[0]),
    getAdvertisedGasPriceFloor(node),
  ]);
  let gasPrice =
    utilization < 70
      ? 0n
      : BigInt(new BigNumber(minGasPrice.toString()).times(1.01).integerValue().toFixed());

  const maxSafeGasPrice = BigInt(MIN_GAS_PRICE) * 100000n; // max microblock fee is 600ae or 35usd

  if (floor != null && floor > maxSafeGasPrice) {
    // The floor is a number an arbitrary node names, and it is applied to transactions this SDK
    // then signs. Above the safe ceiling it is dropped rather than clamped: clamping would sign
    // a huge fee for a transaction that node rejects anyway, since the clamped value is still
    // below the floor it asked for.
    console.warn(
      `Node requires gas price ${floor} that exceeds the maximum safe value ${maxSafeGasPrice}.` +
        ' It will be ignored, so the transaction is likely to be rejected.' +
        ' To overcome this restriction provide `gasPrice`/`fee` in options.',
    );
  } else if (floor != null && floor > (gasPrice === 0n ? BigInt(MIN_GAS_PRICE) : gasPrice)) {
    // `0n` means "no opinion", and the caller falls back to MIN_GAS_PRICE — so that, not `0n`, is
    // the price the floor has to beat. The floor only ever raises: the node enforces it as a
    // minimum, so a floor below what is already being paid says nothing about what to pay.
    gasPrice = floor;
  }

  if (gasPrice > maxSafeGasPrice) {
    console.warn(
      `Estimated gas price ${gasPrice} exceeds the maximum safe value for unknown reason.` +
        ` It will be limited to ${maxSafeGasPrice}.` +
        ' To overcome this restriction provide `gasPrice`/`fee` in options.',
    );
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
    {
      onNode,
      denomination,
    }: {
      onNode?: Node;
      /**
       * @deprecated no replacement implemented yet
       */
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
      throw new IllegalArgumentError(
        `Gas price ${value.toString()} must be bigger than ${MIN_GAS_PRICE}`,
      );
    }
    return value;
  },
};
