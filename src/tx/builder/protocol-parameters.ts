import { AbiVersion, MAX_AUTH_FUN_GAS, MIN_GAS_PRICE, Tag } from './constants.js';
import { isKeyOfObject } from '../../utils/other.js';
import { ArgumentError, InternalError, NodeError } from '../../utils/errors.js';
import { unwrapProxy } from '../../utils/wrap-proxy.js';
import type Node from '../../Node.js';

/**
 * Consensus parameters and node policy settings the transaction builder needs to produce a
 * transaction the node would accept — see {@link getCachedProtocolParameters}.
 * @category transaction builder
 */
export interface ProtocolParameters {
  /**
   * Consensus minimum gas price in aettos, the minimum transaction fee is the transaction's fee
   * gas multiplied by this value
   */
  readonly minGasPrice: bigint;
  /**
   * Minimum gas price accepted by the miner of the node the SDK is connected to. A transaction
   * below it is still valid, but this node won't mine it.
   */
  readonly minMinerGasPrice: bigint;
  /** Gas per serialized transaction byte counted into the minimum fee */
  readonly gasPerByte: number;
  /**
   * Maximum total gas the node the SDK is connected to accepts in a single micro block. Node
   * policy rather than a consensus parameter, it may differ between nodes.
   */
  readonly blockGasLimit: number;
  /**
   * Maximum gas accepted for a generalized account authentication function by the node the SDK is
   * connected to. Node policy rather than a consensus parameter, it may differ between nodes.
   */
  readonly maxAuthFunGas: number;
  /** Base fee gas by transaction type, transactions not executing contract code */
  readonly txBaseGas: Readonly<Partial<Record<Tag, number>>>;
  /** Base fee gas of contract-executing transaction types, by ABI version */
  readonly contractTxBaseGas: Readonly<
    Partial<Record<Tag, Readonly<Partial<Record<AbiVersion, number>>>>>
  >;
  /**
   * State rent gas fraction per key block by transaction type,
   * state gas is `ceil(relativeTtl * part / whole)`
   */
  readonly stateGasPerBlock: Readonly<
    Partial<Record<Tag, Readonly<{ part: number; whole: number }>>>
  >;
}

/**
 * Transaction option to build a transaction against specific consensus parameters. `buildTxAsync`
 * sets it to the parameters it requests from node, provide it to build a transaction offline for a
 * node that doesn't run the protocol version the current SDK release was made for.
 * @category transaction builder
 */
export interface ProtocolParametersOption {
  protocolParameters?: ProtocolParameters;
}

const BASE_GAS = 15000;
const defaultStateGasPerBlock = { part: 32000, whole: Math.floor((60 * 24 * 365) / 3) };

/**
 * Protocol parameters are shared between every transaction built against them, and
 * {@link defaultProtocolParameters} is shared process-wide. `readonly` guards them at compile time
 * only, so freeze them to make sure a transaction can't be mispriced by an unrelated component
 * mutating parameters it doesn't own.
 */
function freezeParameters(parameters: ProtocolParameters): ProtocolParameters {
  Object.values(parameters.contractTxBaseGas).forEach(Object.freeze);
  Object.values(parameters.stateGasPerBlock).forEach(Object.freeze);
  Object.freeze(parameters.txBaseGas);
  Object.freeze(parameters.contractTxBaseGas);
  Object.freeze(parameters.stateGasPerBlock);
  return Object.freeze(parameters);
}

/**
 * Protocol parameters of Ceres as they were at the moment of the SDK release. Used to build
 * transactions without a node connection, and on nodes that don't provide the protocol parameters
 * endpoint yet.
 * @category transaction builder
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 */
export const defaultProtocolParameters: ProtocolParameters = freezeParameters({
  minGasPrice: BigInt(MIN_GAS_PRICE),
  minMinerGasPrice: BigInt(MIN_GAS_PRICE),
  gasPerByte: 20,
  blockGasLimit: 6e6,
  maxAuthFunGas: MAX_AUTH_FUN_GAS,
  txBaseGas: {
    ...Object.fromEntries(
      Object.values(Tag)
        .filter((tag): tag is Tag => typeof tag === 'number')
        // node reports the base gas of contract-executing types in `contract_tx_base_gas`,
        // `SignedTx` is not a chargeable transaction type
        .filter(
          (tag) =>
            ![
              Tag.SignedTx,
              Tag.ContractCreateTx,
              Tag.ContractCallTx,
              Tag.GaAttachTx,
              Tag.GaMetaTx,
            ].includes(tag),
        )
        .map((tag) => [tag, BASE_GAS]),
    ),
    [Tag.ChannelForceProgressTx]: 30 * BASE_GAS,
    [Tag.ChannelOffChainTx]: 0,
    [Tag.PayingForTx]: BASE_GAS / 5,
  },
  contractTxBaseGas: {
    [Tag.ContractCreateTx]: { [AbiVersion.Sophia]: 5 * BASE_GAS, [AbiVersion.Fate]: 5 * BASE_GAS },
    [Tag.ContractCallTx]: { [AbiVersion.Sophia]: 12 * BASE_GAS, [AbiVersion.Fate]: 12 * BASE_GAS },
    [Tag.GaAttachTx]: { [AbiVersion.Sophia]: 5 * BASE_GAS, [AbiVersion.Fate]: 5 * BASE_GAS },
    [Tag.GaMetaTx]: { [AbiVersion.Sophia]: 5 * BASE_GAS, [AbiVersion.Fate]: 5 * BASE_GAS },
  },
  stateGasPerBlock: Object.fromEntries(
    [Tag.OracleRegisterTx, Tag.OracleExtendTx, Tag.OracleQueryTx, Tag.OracleRespondTx].map(
      (tag) => [tag, { ...defaultStateGasPerBlock }],
    ),
  ),
});

// node names transaction types after `aetx:type_to_swagger_name/1`, it matches `Tag` except of these
const txTypeToTag = {
  GAAttachTx: Tag.GaAttachTx,
  GAMetaTx: Tag.GaMetaTx,
} as const;

function getTag(txType: string): Tag | undefined {
  // node controls these keys, `isKeyOfObject` also accepts anything inherited from
  // `Object.prototype` (`constructor`, `toString`) — a name of a transaction type is neither
  const isOwnKeyOf = (object: object): boolean =>
    Object.prototype.hasOwnProperty.call(object, txType);
  if (isOwnKeyOf(txTypeToTag) && isKeyOfObject(txType, txTypeToTag)) return txTypeToTag[txType];
  if (!isOwnKeyOf(Tag) || !isKeyOfObject(txType, Tag)) return undefined;
  // `Tag` is a numeric enum, so it is also indexable by a member value (`Tag['12'] === 'SpendTx'`)
  const tag = Tag[txType];
  return typeof tag === 'number' ? tag : undefined;
}

// Node decides these values and they multiply into the fee the user pays, so a node that is
// compromised, misconfigured, or impersonated could make the SDK build a transaction with an
// extreme fee. A hard fork may legitimately raise them, but not by orders of magnitude — refuse to
// build against a value far above the one the SDK was released with rather than silently overpay.
const maxRaiseFactor = 1000;

function excessiveError(name: string, value: unknown, limit: number): NodeError {
  return new NodeError(
    `Node reports ${name} as ${String(value)}, which is outside of the range the SDK considers` +
      ` plausible (0..${limit}). Provide \`protocolParameters\` in options to build a transaction` +
      ' against these parameters anyway.',
  );
}

/**
 * A value that doesn't match the schema node declares for it — the api client passes `null`,
 * booleans, strings, and fractions through unchanged. Not a {@link NodeError}: the parameters are
 * unreadable rather than implausible, so {@link getCachedProtocolParameters} falls back to
 * {@link defaultProtocolParameters}, as for a node without the endpoint (which a node can force
 * with a 404 anyway).
 */
function malformedError(name: string, value: unknown): InternalError {
  return new InternalError(
    `Node reports ${name} as ${String(value)}, which doesn't match the schema it declares for it`,
  );
}

/**
 * Checks a value node reports against the one the SDK was released with, returns the factor it is
 * raised by.
 */
function checkNotExcessive(name: string, value: number | bigint, sdkValue: number): number {
  // a parameter the SDK release has at 0 can only stay at 0, it raises the fee by nothing
  const raise = (number: number): number => (sdkValue === 0 ? 1 : number / sdkValue);
  const limit = sdkValue * maxRaiseFactor;
  // a bigint matches the schema whatever its magnitude, so one out of range is an implausible
  // value rather than an unreadable one. Compared as a bigint: a value far enough above the limit
  // can't be counted in a number, and that is what makes it implausible in the first place
  if (typeof value === 'bigint') {
    if (value < 0n || value > BigInt(limit)) throw excessiveError(name, value, limit);
    return raise(Number(value));
  }
  if (!Number.isSafeInteger(value)) throw malformedError(name, value);
  if (value < 0 || value > limit) throw excessiveError(name, value, limit);
  return raise(value);
}

/**
 * `Math.max(...array)` passes every element as an argument and overflows the stack on an array
 * node can make arbitrarily long — it reports one entry per transaction type and abi version.
 */
export function maxOf(numbers: number[]): number {
  return numbers.reduce((max, number) => (number > max ? number : max), -Infinity);
}

// TODO: express the bound in aettos instead — a defaulted value may not commit the user to more
//  than a fixed coin amount — rather than as a ratio against the parameters of the SDK release.
//  That states the actual requirement directly and holds on any network, but it defaults a higher
//  gas limit on a network that raised the block gas limit, so it is a behavior change, not a
//  refactor [behavior change on networks running other parameters]
/**
 * How much node's parameters raise each product a transaction costs, against the SDK release.
 * Kept out of {@link ProtocolParameters} because they are not consensus parameters but a property
 * of where the parameters came from — the ones a caller provides in options don't go through here.
 *
 * One per gas amount the SDK picks itself, and not one per parameter: each is charged to the value
 * it bounds, so that a raise of one doesn't shrink a value it has nothing to do with.
 */
interface ParameterRaises {
  /** Of the gas the minimum fee is counted from: `gasPerByte`, the base gas, the state gas */
  readonly fee: number;
  /** Of the gas limit a contract transaction defaults to */
  readonly blockGasLimit: number;
  /** Of the gas limit a `GaMetaTx` defaults to */
  readonly maxAuthFunGas: number;
}
const parameterRaises: WeakMap<ProtocolParameters, ParameterRaises> = new WeakMap();

// parameters this process built itself are checked where they are built — the ones of the SDK
// release by construction, the ones node reports by `checkParametersNotExcessive`. This remembers
// the caller-provided ones already walked, a build reads them once per field and per rebuild pass
const usableParameters: WeakSet<ProtocolParameters> = new WeakSet();

function checkUsableGas(name: string, value: unknown): void {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new ArgumentError(`protocolParameters.${name}`, 'a non-negative safe integer', value);
  }
}

/**
 * Checks that parameters a caller provided in options can price a transaction at all — only values
 * that would produce `NaN`, `Infinity`, or a division by zero, not their magnitude: options are the
 * way out of the bounds {@link convertProtocolParameters} applies, bounding them here would leave
 * no way to build against a network the SDK release doesn't know. They are as trusted as `fee` and
 * `gasLimit`: must not come from untrusted input, this only turns an unusable value into an error
 * naming the field. See `serializeAsIsParam`.
 * @param parameters - Parameters provided in options
 */
export function checkParametersUsable(parameters: ProtocolParameters): void {
  // built by this process, or already walked
  if (parameterRaises.has(parameters) || usableParameters.has(parameters)) return;

  if (typeof parameters.minGasPrice !== 'bigint' || parameters.minGasPrice < 1n) {
    throw new ArgumentError(
      'protocolParameters.minGasPrice',
      'a positive bigint (a transaction can’t be priced against 0)',
      parameters.minGasPrice,
    );
  }
  if (typeof parameters.minMinerGasPrice !== 'bigint' || parameters.minMinerGasPrice < 0n) {
    throw new ArgumentError(
      'protocolParameters.minMinerGasPrice',
      'a non-negative bigint',
      parameters.minMinerGasPrice,
    );
  }
  checkUsableGas('gasPerByte', parameters.gasPerByte);
  checkUsableGas('blockGasLimit', parameters.blockGasLimit);
  checkUsableGas('maxAuthFunGas', parameters.maxAuthFunGas);
  Object.entries(parameters.txBaseGas).forEach(([tag, gas]) =>
    checkUsableGas(`txBaseGas.${Tag[+tag] ?? tag}`, gas),
  );
  Object.entries(parameters.contractTxBaseGas).forEach(([tag, byAbiVersion]) =>
    Object.entries(byAbiVersion ?? {}).forEach(([abiVersion, gas]) =>
      checkUsableGas(`contractTxBaseGas.${Tag[+tag] ?? tag}.${abiVersion}`, gas),
    ),
  );
  Object.entries(parameters.stateGasPerBlock).forEach(([tag, fraction]) => {
    const name = `stateGasPerBlock.${Tag[+tag] ?? tag}`;
    checkUsableGas(`${name}.part`, fraction?.part);
    // a `whole` of 0 makes the state gas — and so the fee — infinite
    if (!Number.isSafeInteger(fraction?.whole) || (fraction?.whole ?? 0) < 1) {
      throw new ArgumentError(`${name}.whole`, 'a positive safe integer', fraction?.whole);
    }
  });

  usableParameters.add(parameters);
}

function checkRatioNotExcessive(
  name: string,
  { part, whole }: { part: number; whole: number },
  sdkRatio: number,
): number {
  if (!Number.isSafeInteger(part) || !Number.isSafeInteger(whole)) {
    throw malformedError(name, `${String(part)}/${String(whole)}`);
  }
  const limit = sdkRatio * maxRaiseFactor;
  // a `whole` of 0 would make the fee infinite, `0 / 0` is NaN — both fail the check below
  const ratio = part >= 0 && whole > 0 ? part / whole : NaN;
  if (!(ratio >= 0) || ratio > limit) throw excessiveError(name, `${part}/${whole}`, limit);
  return ratio / sdkRatio;
}

/**
 * The base gas the SDK release charges for a transaction type, whichever of the two tables it is
 * in. `getTxBaseGas` reads `contractTxBaseGas` before `txBaseGas`, so an entry node adds to
 * `contractTxBaseGas` overrides the `txBaseGas` of that very type — checking it against a
 * type-independent constant would let node raise, say, a `PayingForTx` (3000) to 15000000 and
 * still be counted as a raise of 1000.
 */
function defaultBaseGasOf(tag: Tag): number {
  const d = defaultProtocolParameters;
  const values = [d.txBaseGas[tag], ...Object.values(d.contractTxBaseGas[tag] ?? {})].filter(
    (value): value is number => value != null,
  );
  const max = values.length !== 0 ? maxOf(values) : BASE_GAS;
  // a type charged 0 (`ChannelOffChainTx`) would get a budget of 0, and node reporting any gas for
  // it would refuse the whole response. Give it an ordinary type's budget instead — a node charging
  // more than `maxRaiseFactor` base gas units for it is still refused
  return max !== 0 ? max : BASE_GAS;
}

function checkRaiseNotExcessive(what: string, raise: number): void {
  if (raise <= maxRaiseFactor) return;
  throw new NodeError(
    `Node reports parameters raising ${what} ${Math.round(raise)} times above the one of the SDK` +
      ` release, more than the ${maxRaiseFactor} times the SDK considers plausible. Provide` +
      ' `protocolParameters` in options to build a transaction against these parameters anyway.',
  );
}

/**
 * Refuses the parameters if node reports values far above the ones of the SDK release, and returns
 * the factors the two products a transaction costs may be raised by — see {@link ParameterRaises}.
 */
function checkParametersNotExcessive(parameters: ProtocolParameters): ParameterRaises {
  const d = defaultProtocolParameters;
  const defaultMinGasPrice = Number(d.minGasPrice);
  // a gas price of 0 makes every fee 0 — the network would reject the transaction, and the
  // `minFee / minGasPrice` of the demand-based fee is a division by zero
  if (parameters.minGasPrice < 1n) {
    throw new NodeError(
      `Node reports the minimum gas price as ${parameters.minGasPrice}, a transaction can't be` +
        ' priced against it. Provide `protocolParameters` in options to build a transaction' +
        ' against these parameters anyway.',
    );
  }
  // both raise the gas price the fee is counted from: the consensus minimum directly, the miner
  // minimum as the floor `getCachedIncreasedGasPrice` lifts the gas price to. Bounding the miner
  // minimum on its own — as this used to — leaves node the product of the two to raise the fee by.
  const gasPriceRaise = maxOf([
    checkNotExcessive('the minimum gas price', parameters.minGasPrice, defaultMinGasPrice),
    checkNotExcessive(
      'the miner minimum gas price',
      parameters.minMinerGasPrice,
      defaultMinGasPrice,
    ),
  ]);

  // every one of these is a gas amount the fee is counted from, the biggest raise among them is
  // the most a transaction's gas can grow by
  const gasRaises = [checkNotExcessive('the gas per byte', parameters.gasPerByte, d.gasPerByte)];
  Object.entries(parameters.txBaseGas).forEach(([tag, gas]) => {
    // against the default of this very type and not against the biggest default of all types: a
    // `ChannelForceProgressTx` costs 30 times a `SpendTx`, that is not a budget for a `SpendTx`
    gasRaises.push(checkNotExcessive(`the base gas of ${Tag[+tag]}`, gas, defaultBaseGasOf(+tag)));
  });
  Object.entries(parameters.contractTxBaseGas).forEach(([tag, byAbiVersion]) => {
    const sdkValue = defaultBaseGasOf(+tag);
    Object.entries(byAbiVersion).forEach(([abiVersion, gas]) => {
      const name = `the base gas of ${Tag[+tag]} at abi version ${abiVersion}`;
      gasRaises.push(checkNotExcessive(name, gas, sdkValue));
    });
  });
  const defaultStateGasRatio = defaultStateGasPerBlock.part / defaultStateGasPerBlock.whole;
  Object.entries(parameters.stateGasPerBlock).forEach(([tag, fraction]) => {
    const name = `the state gas per block of ${Tag[+tag]}`;
    gasRaises.push(checkRatioNotExcessive(name, fraction, defaultStateGasRatio));
  });

  // the minimum fee is `gasPrice * (baseGas + size * gasPerByte + stateGas)`, so each product is
  // bounded rather than each parameter — otherwise node could combine them into a fee
  // `maxRaiseFactor` squared above the one of the SDK release
  const feeGasRaise = maxOf(gasRaises);
  checkRaiseNotExcessive('the minimum transaction fee', gasPriceRaise * feeGasRaise);

  // the two bound different transaction types, but both are a gas limit multiplied by the same
  // gas price — the bigger of them is what the worst case costs
  const blockGasLimitRaise = checkNotExcessive(
    'the block gas limit',
    parameters.blockGasLimit,
    d.blockGasLimit,
  );
  const maxAuthFunGasRaise = checkNotExcessive(
    'the max auth fun gas',
    parameters.maxAuthFunGas,
    d.maxAuthFunGas,
  );
  const gasLimitRaise = maxOf([blockGasLimitRaise, maxAuthFunGasRaise]);
  checkRaiseNotExcessive('the cost of a contract transaction', gasPriceRaise * gasLimitRaise);

  // the gas above is multiplied by a gas price that doesn't come from these parameters, and that
  // is bounded on its own — so the raises are reported to lower those bounds by the same factors,
  // see `getGasPriceDivisor` and `getGasLimitDivisor`
  return {
    fee: maxOf([1, feeGasRaise]),
    blockGasLimit: maxOf([1, blockGasLimitRaise]),
    maxAuthFunGas: maxOf([1, maxAuthFunGasRaise]),
  };
}

/**
 * Factor the gas price ceiling of `gas-price.ts` is lowered by, so that the worst case fee doesn't
 * become the product of that ceiling and the fee gas bound of {@link convertProtocolParameters}.
 * The gas limit raise is charged to the gas limit default instead ({@link getGasLimitDivisor}).
 * It is 1 unless the parameters came from node.
 *
 * The biggest raise among all transaction types, not the one of the type being built — so a node
 * repricing one type lowers the ceiling for every type. The ceiling is 100000 times the minimum
 * gas price, far above the demand-based price this bounds in practice.
 * @param parameters - Parameters a transaction is built against
 */
export function getGasPriceDivisor(parameters: ProtocolParameters): number {
  return parameterRaises.get(parameters)?.fee ?? 1;
}

/**
 * The cost of a contract transaction is `gasPrice * gasLimit`, and the gas limit the SDK defaults
 * to comes from `blockGasLimit` — from `maxAuthFunGas` on a `GaMetaTx`. This is the factor node
 * raises the one `tag` reads by, so that lowering the default by it keeps the product within the
 * one of the SDK release. It is 1 unless the parameters came from node.
 *
 * Only the limit `tag` reads: charging the other one would shrink a gas limit because node raised
 * something that transaction never reads. The fee gas raise is charged to the gas price ceiling
 * ({@link getGasPriceDivisor}) instead.
 * @param parameters - Parameters a transaction is built against
 * @param tag - Type of the transaction the gas limit is defaulted for
 */
export function getGasLimitDivisor(parameters: ProtocolParameters, tag: Tag): number {
  const raises = parameterRaises.get(parameters);
  if (raises == null) return 1;
  return tag === Tag.GaMetaTx ? raises.maxAuthFunGas : raises.blockGasLimit;
}

function mapByTxType<Value, Result>(
  entries: Array<[string, Value]>,
  map: (value: Value) => Result,
): Partial<Record<Tag, Result>> {
  return Object.fromEntries(
    entries
      .map(([txType, value]): [Tag | undefined, Result] => [getTag(txType), map(value)])
      // a transaction type the SDK doesn't implement, or won't ever build (`ChannelClientReconnectTx`)
      .filter((entry): entry is [Tag, Result] => entry[0] != null),
  );
}

/**
 * Converts the node responses to the shape the transaction builder uses, rejecting values far
 * above the ones the SDK was released with. Not a part of the public api, it is exported for
 * tests — use {@link getCachedProtocolParameters}.
 * @param response - Response of the `/v3/protocol-parameters` endpoint
 * @param nodeSettings - Response of the `/v3/node-settings` endpoint
 */
export function convertProtocolParameters(
  response: Awaited<ReturnType<Node['getProtocolParameters']>>,
  nodeSettings: Awaited<ReturnType<Node['getNodeSettings']>>,
): ProtocolParameters {
  const { currentProtocolVersion, protocols } = response;
  const protocol = protocols.find(({ version }) => version === currentProtocolVersion);
  if (protocol == null) {
    throw new InternalError(
      `Node doesn't provide parameters of the current protocol ${currentProtocolVersion}`,
    );
  }

  // starts from the values of the SDK release so that a type or an abi version node doesn't report
  // keeps building against them, as the SDK did before this endpoint existed, instead of failing
  const contractTxBaseGas: Partial<Record<Tag, Partial<Record<AbiVersion, number>>>> =
    Object.fromEntries(
      Object.entries(defaultProtocolParameters.contractTxBaseGas).map(([tag, byAbiVersion]) => [
        tag,
        { ...byAbiVersion },
      ]),
    );
  protocol.contractTxBaseGas.forEach(({ txType, abiVersion, txBaseGas }) => {
    const tag = getTag(txType);
    // node controls `abiVersion` and the api client passes a value that doesn't match the schema
    // node declares for it through unchanged. A `__proto__` key would be written into the
    // prototype: invisible to the `Object.values` of the check below, and still returned by the
    // `byAbiVersion[abiVersion]` lookup the fee is calculated from
    if (tag == null || !Number.isInteger(abiVersion)) return;
    const byAbiVersion = (contractTxBaseGas[tag] ??= {});
    byAbiVersion[abiVersion as AbiVersion] = txBaseGas;
  });

  const reportedTxBaseGas = mapByTxType(Object.entries(protocol.txBaseGas), (gas) => gas);
  const parameters = freezeParameters({
    minGasPrice: protocol.minimumGasPrice,
    minMinerGasPrice: nodeSettings.minMinerGasPrice,
    gasPerByte: protocol.gasPerByte,
    blockGasLimit: nodeSettings.blockGasLimit,
    maxAuthFunGas: nodeSettings.maxAuthFunGas,
    txBaseGas: {
      // see the note on `contractTxBaseGas` above
      ...defaultProtocolParameters.txBaseGas,
      ...reportedTxBaseGas,
    },
    contractTxBaseGas,
    stateGasPerBlock: {
      // see the note on `contractTxBaseGas` above
      ...defaultProtocolParameters.stateGasPerBlock,
      ...mapByTxType(Object.entries(protocol.stateGasPerBlock), (fraction) => ({
        part: fraction.part,
        whole: fraction.whole,
      })),
    },
  });
  parameterRaises.set(parameters, checkParametersNotExcessive(parameters));
  return parameters;
}

interface CacheEntry {
  expiresAt: number;
  parameters: Promise<ProtocolParameters>;
}
const cache: WeakMap<Node, CacheEntry> = new WeakMap();
// protocol parameters change on a hard fork, or when the node operator edits the node config,
// neither happens often enough to justify a request per transaction built
const cacheTtl = 10 * 60 * 1000;
// a node that can't be reached, or that reports parameters the SDK refuses to build against, may
// be reachable or reconfigured in a moment — don't keep the whole `cacheTtl` worth of transactions
// building against the parameters of the SDK release, or failing, because of one bad response.
// Still cached rather than retried per transaction: both outcomes cost a round trip to reproduce.
const transientCacheTtl = 30 * 1000;

/**
 * Requests protocol parameters from node, the result is cached per node instance.
 *
 * Falls back to {@link defaultProtocolParameters} for a node that doesn't provide the endpoints,
 * can't be reached, or answers something this SDK release can't read. Rejects only when node
 * reports parameters that would price a transaction far above the SDK release — see
 * {@link ProtocolParametersOption} for the way out of that.
 *
 * The cache is keyed by the `Node` object, so code that constructs a `Node` per request (a
 * serverless handler, an edge worker) requests the parameters again for each one. Keep one `Node`
 * instance per endpoint to get the benefit of the cache.
 * @category transaction builder
 * @param nodeOrProxy - Node to request the parameters from
 */
export async function getCachedProtocolParameters(nodeOrProxy: Node): Promise<ProtocolParameters> {
  const node = unwrapProxy(nodeOrProxy);
  const entry = cache.get(node);
  if (entry != null && entry.expiresAt > Date.now()) return entry.parameters;

  // node is expected to respond with 404 until it gets the endpoints, and a node whose operator
  // disabled the `node_info`/`node_settings` endpoint groups with 403 — neither changes within
  // `cacheTtl`, while anything else is worth asking again about sooner
  let ttl = cacheTtl;
  // the request and the conversion both run in here so that only a deliberate refusal — a
  // `NodeError` on implausible parameters — comes out as a rejection; anything unreadable falls
  // back to the parameters of the SDK release instead of making every transaction unbuildable
  const parameters = (async (): Promise<ProtocolParameters> => {
    const fallBack = (reason: unknown): ProtocolParameters => {
      ttl = transientCacheTtl;
      console.warn(
        "Can't get protocol parameters from node, using the ones of the SDK release instead." +
          ' A transaction may be rejected if this node runs other parameters.' +
          ` Reason: ${reason instanceof Error ? reason.message : String(reason)}`,
      );
      return defaultProtocolParameters;
    };

    // a node object without the methods (a test double, another SDK copy's `Node`) won't grow
    // them within `transientCacheTtl` — treat like the 404 of an old node: full-interval cache,
    // and no warning per 30 seconds for the life of the process
    if (
      typeof node.getProtocolParameters !== 'function' ||
      typeof node.getNodeSettings !== 'function'
    ) {
      return defaultProtocolParameters;
    }

    // retrying the 404 on every transaction built would only add latency
    const noRetry = { requestOptions: { customHeaders: { '__no-retry': 'true' } } };
    let response;
    let nodeSettings;
    try {
      // consensus parameters and this node's own policy are two endpoints, and a transaction is
      // priced by both — requested together so that a build waits for one round trip and not two,
      // and taken as a set: parameters half from node and half from the SDK release would be
      // neither ones node accepts nor ones the SDK was tested against
      [response, nodeSettings] = await Promise.all([
        node.getProtocolParameters(noRetry),
        node.getNodeSettings(noRetry),
      ]);
    } catch (error) {
      // the 404/403 of the note above — neither is worth a warning, or an earlier retry.
      // Read off the error rather than through `instanceof RestError`: that would import
      // `@azure/core-rest-pipeline` as a value into the transaction builder, which is otherwise
      // free of it, and pull the http stack into the bundle of an application that only packs
      // transactions. The api client is the only thing that rejects here, and it sets this
      const { statusCode } = error as { statusCode?: number };
      if (statusCode === 404 || statusCode === 403) return defaultProtocolParameters;
      // node is syncing (503), a proxy in between is down, the request timed out
      return fallBack(error);
    }

    try {
      return convertProtocolParameters(response, nodeSettings);
    } catch (error) {
      // node reports parameters that would price a transaction far above the SDK release — falling
      // back would build a transaction this node rejects, so the caller is told to decide instead
      if (error instanceof NodeError) throw error;
      return fallBack(error);
    }
  })();

  // until it settles the entry keeps concurrent builds on this one request
  const cacheEntry: CacheEntry = { expiresAt: Date.now() + cacheTtl, parameters };
  parameters.then(
    () => {
      cacheEntry.expiresAt = Date.now() + ttl;
    },
    // see `transientCacheTtl`
    () => {
      cacheEntry.expiresAt = Date.now() + transientCacheTtl;
    },
  );
  cache.set(node, cacheEntry);
  return parameters;
}
