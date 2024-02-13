import {
  genRequestQueuesPolicy, genCombineGetRequestsPolicy, genErrorFormatterPolicy,
  genVersionCheckPolicy, genRetryOnFailurePolicy,
} from '../utils/autorest';
import NodeBase from './Base';
import { UnsupportedVersionError } from '../utils/errors';
import { ConsensusProtocolVersion } from '../tx/builder/constants';
import { NodeOptionalParams, ErrorModel } from '../apis/node';

interface NodeInfo {
  url: string;
  nodeNetworkId: string;
  version: string;
  consensusProtocolVersion: ConsensusProtocolVersion;
}

export default class NodeDefault extends NodeBase {
  #networkIdPromise?: Promise<string | Error>;

  /**
   * @param url - Url for node API
   * @param options - Options
   * @param options.ignoreVersion - Don't ensure that the node is supported
   * @param options.retryCount - Amount of extra requests to do in case of failure
   * @param options.retryOverallDelay - Time in ms to wait between all retries
   */
  constructor(
    url: string,
    {
      ignoreVersion = false, retryCount = 3, retryOverallDelay = 800, ...options
    }: NodeOptionalParams & {
      ignoreVersion?: boolean;
      retryCount?: number;
      retryOverallDelay?: number;
    } = {},
  ) {
    // eslint-disable-next-line constructor-super
    super(url, {
      allowInsecureConnection: true,
      additionalPolicies: [
        genRequestQueuesPolicy(),
        genCombineGetRequestsPolicy(),
        genRetryOnFailurePolicy(retryCount, retryOverallDelay),
        genErrorFormatterPolicy((body: ErrorModel) => ` ${body.reason}`),
      ],
      ...options,
    });
    if (!ignoreVersion) {
      const statusPromise = this.getStatus();
      const versionPromise = statusPromise.then(({ nodeVersion }) => nodeVersion, (error) => error);
      this.#networkIdPromise = statusPromise.then(({ networkId }) => networkId, (error) => error);
      this.pipeline.addPolicy(
        genVersionCheckPolicy('node', '/v3/status', versionPromise, '6.2.0', '7.0.0'),
      );
    }
    this.intAsString = true;
  }

  /**
   * Returns network ID provided by node.
   * This method won't do extra requests on subsequent calls.
   */
  async getNetworkId(): Promise<string> {
    this.#networkIdPromise ??= this.getStatus().then(({ networkId }) => networkId);
    const networkId = await this.#networkIdPromise;
    if (networkId instanceof Error) throw networkId;
    return networkId;
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
      .reduce(
        (acc, p) => (p.effectiveAtHeight > acc.effectiveAtHeight ? p : acc),
        { effectiveAtHeight: -1, version: 0 },
      )
      .version;
    if (ConsensusProtocolVersion[consensusProtocolVersion] == null) {
      const version = consensusProtocolVersion.toString();
      const versions = Object.values(ConsensusProtocolVersion)
        .filter((el) => typeof el === 'number').map((el) => +el);
      const geVersion = Math.min(...versions).toString();
      const ltVersion = (Math.max(...versions) + 1).toString();
      throw new UnsupportedVersionError('consensus protocol', version, geVersion, ltVersion);
    }

    return {
      url: this.$host,
      nodeNetworkId,
      version: nodeVersion,
      consensusProtocolVersion,
    };
  }
}
