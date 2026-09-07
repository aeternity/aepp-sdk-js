import BigNumber from 'bignumber.js';
import coinAmount from './coin-amount.js';
import { ArgumentError, IllegalArgumentError } from '../../../utils/errors.js';
import { Int } from '../constants.js';
import {
  defaultProtocolParameters,
  getCachedProtocolParameters,
  getGasPriceDivisor,
  ProtocolParameters,
  ProtocolParametersOption,
} from '../protocol-parameters.js';
import { serializeAsIsParam, SerializeAsIsParams } from './interface.js';
import { unwrapProxy } from '../../../utils/wrap-proxy.js';
import Node from '../../../Node.js';
import { AE_AMOUNT_FORMATS, formatAmount } from '../../../utils/amount-formatter.js';

interface GasPriceCacheEntry {
  time: number;
  gasPrice: Promise<bigint>;
  /**
   * `getCachedIncreasedGasPrice` runs once per field that asks for a gas price — twice per contract
   * transaction, since `fee.prepare` asks as well — while the ceiling it may warn about is a
   * property of the network and of the parameters, not of the field. Warn once per refresh.
   */
  ceilingWarned?: boolean;
}
const gasPriceCache: WeakMap<Node, GasPriceCacheEntry> = new WeakMap();

// the ceiling is based on the gas price of the SDK release and not on the one node reports, so
// that node can't raise its own limit — a node asking for more than the ceiling gets an
// underpriced transaction rather than the user an unbounded fee. Max microblock fee is 600ae or
// 35usd, counted with the gas of the SDK release — see `getGasPriceDivisor`
const maxSafeGasPrice = defaultProtocolParameters.minGasPrice * 100000n;

/**
 * Gas price the recent demand of the network suggests, cached per node. Depends on the network
 * only — the miner floor is applied by the caller, so that a caller providing its own
 * {@link ProtocolParameters} doesn't put a gas price based on them into a cache others share.
 *
 * The request is cached rather than its result, and this body has no `await` before registering
 * it: `buildTxAsync` prepares fields concurrently, so `fee.prepare` and `gasPrice.prepare` both
 * ask before either could write a result, and sharing the promise keeps that one round trip.
 */
function getCachedDemandGasPrice(node: Node): GasPriceCacheEntry {
  const cached = gasPriceCache.get(node);
  if (cached != null && cached.time > Date.now() - 20 * 1000) {
    return cached;
  }
  const gasPrice = (async () => {
    const { minGasPrice, utilization } = (await node.getRecentGasPrices())[0];
    const price =
      utilization < 70
        ? 0n
        : BigInt(new BigNumber(minGasPrice.toString()).times(1.01).integerValue().toFixed());
    if (price <= maxSafeGasPrice) return price;
    console.warn(
      `Estimated gas price ${price} exceeds the maximum safe value for unknown reason.` +
        ` It will be limited to ${maxSafeGasPrice}.` +
        ' To overcome this restriction provide `gasPrice`/`fee` in options.',
    );
    return maxSafeGasPrice;
  })();
  const entry: GasPriceCacheEntry = { gasPrice, time: Date.now() };
  gasPriceCache.set(node, entry);
  gasPrice.then(
    () => {
      // the interval is about how long the value stays representative, and it starts when the
      // value is known — stamping the request instead would shorten it by the round trip, and on
      // a link slower than the interval every build would open a request of its own
      entry.time = Date.now();
    },
    // a request that failed may succeed on the next transaction built, and a gas price that can't
    // be requested fails the build — unlike `getCachedProtocolParameters`, which caches its
    // failures because it falls back to the parameters of the SDK release and the build goes on
    () => {
      if (gasPriceCache.get(node) === entry) gasPriceCache.delete(node);
    },
  );
  return entry;
}

export async function getCachedIncreasedGasPrice(
  nodeOrProxy: Node,
  parameters?: ProtocolParameters,
): Promise<bigint> {
  const node = unwrapProxy(nodeOrProxy);
  const demandEntry = getCachedDemandGasPrice(node);
  // the caller may have been given the parameters to build against, requesting them from node
  // would both waste a request and ignore the `minMinerGasPrice` it was asked to use
  const [protocolParameters, demandGasPrice] = await Promise.all([
    parameters ?? getCachedProtocolParameters(node),
    demandEntry.gasPrice,
  ]);
  let gasPrice = demandGasPrice;

  // 0n means "the consensus minimum", it is below what the miner of this node accepts
  const minerFloor =
    protocolParameters.minMinerGasPrice > protocolParameters.minGasPrice
      ? protocolParameters.minMinerGasPrice
      : 0n;
  if (gasPrice < minerFloor) gasPrice = minerFloor;

  // the ceiling goes down by the factor the parameters raise the fee gas by — see
  // `getGasPriceDivisor`. Counted in thousandths so that a hard fork raising the gas a few percent
  // lowers the ceiling a few percent, rather than halving it by rounding the factor up
  const gasRaise = BigInt(Math.ceil(getGasPriceDivisor(protocolParameters) * 1000));
  // this can't cut the miner floor applied above: `checkParametersNotExcessive` bounds the miner
  // minimum times the fee gas raise by `maxRaiseFactor`, and the ceiling is 100 times
  // `maxRaiseFactor` above the minimum gas price, so it stays 100 times above the floor
  const ceiling = (maxSafeGasPrice * 1000n) / gasRaise;
  if (gasPrice > ceiling) {
    if (gasRaise > 1000n && demandEntry.ceilingWarned !== true) {
      demandEntry.ceilingWarned = true;
      console.warn(
        `Estimated gas price ${gasPrice} exceeds the maximum safe value ${ceiling} for the` +
          ' protocol parameters node reports. It will be limited to it, so the transaction may be' +
          ' not mined while the demand stays above it. To overcome this restriction provide' +
          ' `gasPrice`/`fee`, or `protocolParameters` in options.',
      );
    }
    gasPrice = ceiling;
  }

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
      protocolParameters,
    }: {
      onNode?: Node;
      /**
       * @deprecated no replacement implemented yet
       */
      denomination?: AE_AMOUNT_FORMATS;
    } & ProtocolParametersOption,
  ): Promise<Int | undefined> {
    if (value != null) return value;
    if (onNode == null) {
      throw new ArgumentError('onNode', 'provided (or provide `gasPrice` instead)', onNode);
    }
    const gasPrice = await getCachedIncreasedGasPrice(onNode, protocolParameters);
    if (gasPrice === 0n) return undefined;
    return formatAmount(gasPrice, { targetDenomination: denomination });
  },

  serializeAettos(
    value: string | undefined,
    params: SerializeAsIsParams,
    { protocolParameters = defaultProtocolParameters }: ProtocolParametersOption,
  ): string {
    const minGasPrice = protocolParameters.minGasPrice.toString();
    if (value == null) return minGasPrice;
    if (params[serializeAsIsParam] === true) return value;
    if (new BigNumber(value).lt(minGasPrice)) {
      throw new IllegalArgumentError(`Gas price ${value} must be bigger than ${minGasPrice}`);
    }
    return value;
  },
};
