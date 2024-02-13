import NodeDirect from './Direct';
import { getIntervals } from '../utils/autorest';
import { pause } from '../utils/other';
import { buildTx, unpackTx } from '../tx/builder';
import { Tag } from '../tx/builder/constants';
import getTransactionSignerAddress from '../tx/transaction-signer';
import { Encoded } from '../utils/encoder';
import { IllegalArgumentError } from '../utils/errors';

/**
 * Implements request retry strategies to improve reliability of connection to multiple nodes behind
 * load balancer.
 */
export default class NodeGateway extends NodeDirect {
  #nonces: Record<string, number> = {};

  readonly #retryIntervals: number[];

  /**
   * @param url - Url for node API
   * @param options - Options
   */
  constructor(
    url: string,
    {
      retryCount = 8, retryOverallDelay = 3000, ...options
    }: ConstructorParameters<typeof NodeDirect>[1] = {},
  ) {
    super(url, {
      ...options, retryCount, retryOverallDelay, _disableGatewayWarning: true,
    });
    this.#retryIntervals = getIntervals(retryCount, retryOverallDelay);
  }

  #saveNonce(tx: Encoded.Transaction): void {
    const { encodedTx } = unpackTx(tx, Tag.SignedTx);
    if (encodedTx.tag === Tag.GaMetaTx) return;
    if (!('nonce' in encodedTx)) {
      throw new IllegalArgumentError('Transaction doesn\'t have nonce field');
    }
    const address = getTransactionSignerAddress(tx);
    this.#nonces[address] = encodedTx.nonce;
    if (encodedTx.tag === Tag.PayingForTx) {
      this.#saveNonce(buildTx(encodedTx.tx));
    }
  }

  // @ts-expect-error use code generation to create node class or integrate bigint to autorest
  override async postTransaction(
    ...args: Parameters<NodeDirect['postTransaction']>
  ): ReturnType<NodeDirect['postTransaction']> {
    const res = super.postTransaction(...args);
    try {
      this.#saveNonce(args[0].tx as Encoded.Transaction);
    } catch (error) {
      console.warn('NodeGateway: failed to save nonce,', error);
    }
    return res;
  }

  async #retryNonceRequest<T>(
    address: string,
    doRequest: () => Promise<T>,
    getNonce: (t: T) => number,
  ): Promise<T> {
    for (let attempt = 0; attempt < this.#retryIntervals.length; attempt += 1) {
      const result = await doRequest();
      const nonce = getNonce(result);
      if (nonce >= (this.#nonces[address] ?? -1)) {
        return result;
      }
      await pause(this.#retryIntervals[attempt]);
    }
    return doRequest();
  }

  // @ts-expect-error use code generation to create node class or integrate bigint to autorest
  override async getAccountByPubkey(
    ...args: Parameters<NodeDirect['getAccountByPubkey']>
  ): ReturnType<NodeDirect['getAccountByPubkey']> {
    return this.#retryNonceRequest(
      args[0],
      async () => super.getAccountByPubkey(...args),
      ({ nonce, kind }) => (kind === 'generalized' ? Number.MAX_SAFE_INTEGER : nonce),
    );
  }

  // @ts-expect-error use code generation to create node class or integrate bigint to autorest
  override async getAccountNextNonce(
    ...args: Parameters<NodeDirect['getAccountNextNonce']>
  ): ReturnType<NodeDirect['getAccountNextNonce']> {
    return this.#retryNonceRequest(
      args[0],
      async () => super.getAccountNextNonce(...args),
      ({ nextNonce }) => (nextNonce === 0 ? Number.MAX_SAFE_INTEGER : nextNonce - 1),
    );
  }
}
