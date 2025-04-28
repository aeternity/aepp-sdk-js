// eslint-disable-next-line max-classes-per-file
import { OperationOptions } from '@azure/core-client';
import { userAgentPolicyName, setClientRequestIdPolicyName } from '@azure/core-rest-pipeline';
import {
  genRequestQueuesPolicy,
  genCombineGetRequestsPolicy,
  genErrorFormatterPolicy,
  parseBigIntPolicy,
  genVersionCheckPolicy,
  genRetryOnFailurePolicy,
} from './utils/autorest.js';
import { Node as NodeApi, NodeOptionalParams, ErrorModel } from './apis/node/index.js';
import { UnsupportedVersionError } from './utils/errors.js';
import { ConsensusProtocolVersion } from './tx/builder/constants.js';

interface NodeInfo {
  url: string;
  nodeNetworkId: string;
  version: string;
  consensusProtocolVersion: ConsensusProtocolVersion;
}

/**
 * @category chain
 */
export default class Node extends NodeApi {
  readonly #ignoreVersion: boolean;

  /**
   * @param url - Url for node API
   * @param options - Options
   * @param options.ignoreVersion - Print warning instead of throwing exception if node
   * or consensus protocol version is not supported, use with caution
   * @param options.retryCount - Amount of extra requests to do in case of failure
   * @param options.retryOverallDelay - Time in ms to wait between all retries
   */
  constructor(
    url: string,
    {
      ignoreVersion = false,
      retryCount = 3,
      retryOverallDelay = 800,
      ...options
    }: NodeOptionalParams & {
      ignoreVersion?: boolean;
      retryCount?: number;
      retryOverallDelay?: number;
    } = {},
  ) {
    const getVersion = async (opts: OperationOptions): Promise<string> =>
      (await this._getCachedStatus(opts)).nodeVersion;
    // eslint-disable-next-line constructor-super
    super(url, {
      allowInsecureConnection: true,
      additionalPolicies: [
        genVersionCheckPolicy('node', getVersion, '7.1.0', '8.0.0', ignoreVersion),
        genRequestQueuesPolicy(),
        genCombineGetRequestsPolicy(),
        genRetryOnFailurePolicy(retryCount, retryOverallDelay),
        genErrorFormatterPolicy((body: ErrorModel) =>
          [' ', body.reason, body.errorCode == null ? '' : ` (${body.errorCode})`].join(''),
        ),
      ],
      ...options,
    });
    this.#ignoreVersion = ignoreVersion;
    this.pipeline.addPolicy(parseBigIntPolicy, { phase: 'Deserialize' });
    this.pipeline.removePolicy({ name: userAgentPolicyName });
    this.pipeline.removePolicy({ name: setClientRequestIdPolicyName });
    // TODO: use instead our retry policy
    this.pipeline.removePolicy({ name: 'defaultRetryPolicy' });
  }

  #cachedStatusPromise?: ReturnType<NodeApi['getStatus']>;

  async _getCachedStatus(options?: OperationOptions): ReturnType<NodeApi['getStatus']> {
    if (this.#cachedStatusPromise != null) return this.#cachedStatusPromise;
    return this.getStatus(options);
  }

  override async getStatus(
    ...args: Parameters<NodeApi['getStatus']>
  ): ReturnType<NodeApi['getStatus']> {
    const promise = super.getStatus(...args);
    promise.then(
      () => {
        this.#cachedStatusPromise = promise;
      },
      () => {},
    );
    return promise;
  }

  /**
   * Returns network ID provided by node.
   * This method won't do extra requests on subsequent calls.
   */
  async getNetworkId(): Promise<string> {
    return (await this._getCachedStatus()).networkId;
  }

  async getNodeInfo(): Promise<NodeInfo> {
    const {
      nodeVersion,
      networkId: nodeNetworkId,
      protocols,
      topBlockHeight,
    } = await this.getStatus();

    const consensusProtocolVersion = protocols
      .filter(({ effectiveAtHeight }) => topBlockHeight >= effectiveAtHeight)
      .reduce((acc, p) => (p.effectiveAtHeight > acc.effectiveAtHeight ? p : acc), {
        effectiveAtHeight: -1,
        version: 0,
      }).version;
    if (ConsensusProtocolVersion[consensusProtocolVersion] == null) {
      const version = consensusProtocolVersion.toString();
      const versions = Object.values(ConsensusProtocolVersion)
        .filter((el) => typeof el === 'number')
        .map((el) => +el);
      const geVersion = Math.min(...versions).toString();
      const ltVersion = (Math.max(...versions) + 1).toString();
      const error = new UnsupportedVersionError(
        'consensus protocol',
        version,
        geVersion,
        ltVersion,
      );
      if (this.#ignoreVersion) console.warn(error.message);
      else throw error;
    }

    return {
      url: this.$host,
      nodeNetworkId,
      version: nodeVersion,
      consensusProtocolVersion,
    };
  }
}
