import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  createHttpHeaders,
  HttpClient,
  PipelineRequest,
  PipelineResponse,
} from '@azure/core-rest-pipeline';
import { Node } from '../../src';
import { getCachedIncreasedGasPrice } from '../../src/tx/builder/field-types/gas-price';
import { MIN_GAS_PRICE } from '../../src/tx/builder/constants';

/**
 * Answers requests without touching the network. Bodies are raw JSON so that a gas price floor
 * above Number.MAX_SAFE_INTEGER reaches the client with all its digits, the way a node sends it.
 */
function stubHttpClient(routes: Record<string, string>): HttpClient {
  return {
    async sendRequest(request: PipelineRequest): Promise<PipelineResponse> {
      const { pathname } = new URL(request.url);
      const body = routes[pathname];
      if (body == null) throw new Error(`Unexpected request to ${pathname}`);
      return {
        request,
        status: 200,
        headers: createHttpHeaders({ 'content-type': 'application/json' }),
        bodyAsText: body,
      };
    },
  };
}

async function collectWarnings<Result>(
  handler: () => Promise<Result>,
): Promise<[Result, string[]]> {
  const warnings: string[] = [];
  const consoleWarn = console.warn;
  console.warn = (...args: unknown[]): void => {
    warnings.push(args.join(' '));
  };
  try {
    return [await handler(), warnings];
  } finally {
    console.warn = consoleWarn;
  }
}

/**
 * @param advertisedFloor - the `min_miner_gas_price` the node puts on `GET /v3/status`, as raw
 * JSON, or `undefined` for a node that doesn't advertise one at all
 */
function nodeAdvertising(
  advertisedFloor: string | undefined,
  { minGasPrice = 1000000023, utilization = 0 } = {},
): Node {
  const floorField = advertisedFloor == null ? '' : `"min_miner_gas_price": ${advertisedFloor},`;
  return new Node('http://node.test', {
    httpClient: stubHttpClient({
      '/v3/status': `{${floorField} "node_version": "7.3.0-rc5"}`,
      '/v3/recent-gas-prices': `[{
        "min_gas_price": ${minGasPrice},
        "utilization": ${utilization},
        "minutes": 1
      }]`,
    }),
  });
}

describe('node-advertised gas price floor', () => {
  it('stays inert against a node that advertises no floor', async () => {
    const [gasPrice, warnings] = await collectWarnings(async () =>
      getCachedIncreasedGasPrice(nodeAdvertising(undefined)),
    );

    // `0n` is what makes `prepare` return undefined and the caller fall back to MIN_GAS_PRICE.
    // Every node released so far is this case, so it has to be bit-identical to the old code.
    expect(gasPrice).to.be.equal(0n);
    expect(warnings).to.be.eql([]);
  });

  it('stays inert against a node advertising the default floor', async () => {
    const [gasPrice, warnings] = await collectWarnings(async () =>
      getCachedIncreasedGasPrice(nodeAdvertising(MIN_GAS_PRICE.toString())),
    );

    expect(gasPrice).to.be.equal(0n);
    expect(warnings).to.be.eql([]);
  });

  it('raises the low-utilization fallback to a floor above MIN_GAS_PRICE', async () => {
    const [gasPrice, warnings] = await collectWarnings(async () =>
      getCachedIncreasedGasPrice(nodeAdvertising('2000000000')),
    );

    expect(gasPrice).to.be.equal(2000000000n);
    expect(warnings).to.be.eql([]);
  });

  it('keeps the estimated gas price when it already clears the floor', async () => {
    const [gasPrice] = await collectWarnings(async () =>
      getCachedIncreasedGasPrice(
        nodeAdvertising('2000000000', { minGasPrice: 3000000000, utilization: 80 }),
      ),
    );

    // 3000000000 * 1.01, not lowered to the floor: the node enforces it as a minimum.
    expect(gasPrice).to.be.equal(3030000000n);
  });

  it('ignores a floor below what is already being paid', async () => {
    const [gasPrice, warnings] = await collectWarnings(async () =>
      getCachedIncreasedGasPrice(nodeAdvertising('1')),
    );

    // Not `1n`: that would be below MIN_GAS_PRICE, which serializeAettos rejects outright.
    expect(gasPrice).to.be.equal(0n);
    expect(warnings).to.be.eql([]);
  });

  it("doesn't lose precision on a floor above Number.MAX_SAFE_INTEGER", async () => {
    const floor = 10000000000000000n;
    expect(floor > BigInt(Number.MAX_SAFE_INTEGER)).to.be.equal(true);

    const [gasPrice, warnings] = await collectWarnings(async () =>
      getCachedIncreasedGasPrice(nodeAdvertising(floor.toString())),
    );

    // Above the maximum safe gas price, so it isn't applied — but it is read exactly, and the
    // warning proves the value survived parseBigIntPolicy instead of being rounded to a float.
    expect(gasPrice).to.be.equal(0n);
    expect(warnings).to.be.eql([
      `Node requires gas price ${floor} that exceeds the maximum safe value ` +
        `${BigInt(MIN_GAS_PRICE) * 100000n}. It will be ignored, so the transaction is likely ` +
        'to be rejected. To overcome this restriction provide `gasPrice`/`fee` in options.',
    ]);
  });

  it('ignores a floor that is not a number', async () => {
    const [gasPrice, warnings] = await collectWarnings(async () =>
      getCachedIncreasedGasPrice(nodeAdvertising('"not-a-number"')),
    );

    expect(gasPrice).to.be.equal(0n);
    expect(warnings).to.be.eql([
      'Node returned an unexpected min_miner_gas_price not-a-number, ignoring it.',
    ]);
  });
});
