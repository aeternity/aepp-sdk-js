// eslint-disable-next-line max-classes-per-file
import BigNumber from 'bignumber.js';
import { OperationArguments, OperationSpec } from '@azure/core-client';
import {
  genRequestQueuesPolicy, genCombineGetRequestsPolicy, genErrorFormatterPolicy,
  genVersionCheckPolicy, genRetryOnFailurePolicy,
} from './utils/autorest';
import { Node as NodeApi, NodeOptionalParams, ErrorModel } from './apis/node';
import { mapObject } from './utils/other';
import { UnsupportedVersionError } from './utils/errors';
import { Encoded } from './utils/encoder';
import { ConsensusProtocolVersion } from './tx/builder/constants';

const bigIntPropertyNames = [
  'balance', 'queryFee', 'fee', 'amount', 'nameFee', 'channelAmount',
  'initiatorAmount', 'responderAmount', 'channelReserve', 'initiatorAmountFinal',
  'responderAmountFinal', 'gasPrice', 'deposit',
] as const;

const numberPropertyNames = [
  'time', 'gas', 'gasUsed', 'nameSalt',
  'nonce', 'nextNonce', 'height', 'blockHeight', 'topBlockHeight',
  'ttl', 'nameTtl', 'clientTtl',
  'inbound', 'outbound', 'peerCount', 'pendingTransactionsCount', 'effectiveAtHeight',
  'version', 'solutions', 'round',
] as const;

class NodeTransformed extends NodeApi {
  override async sendOperationRequest(
    operationArguments: OperationArguments,
    operationSpec: OperationSpec,
  ): Promise<any> {
    const args = mapObject(
      operationArguments,
      ([key, value]) => [key, this.#encodeArg(value)],
    ) as OperationArguments;
    return this.#decodeRes(await super.sendOperationRequest(args, operationSpec));
  }

  #mapData(data: any, transform: {
    bigInt: (v: any) => any;
    number: (v: any) => any;
  }): unknown {
    if (Array.isArray(data)) return data.map((d) => this.#mapData(d, transform));
    if (data != null && typeof data === 'object') {
      return mapObject(data, ([key, value]) => {
        if (value == null) return [key, value];
        if (bigIntPropertyNames.some((k) => k === key)) return [key, transform.bigInt(value)];
        if (numberPropertyNames.some((k) => k === key)) return [key, transform.number(value)];
        return [key, this.#mapData(value, transform)];
      });
    }
    return data;
  }

  #encodeArg(data: any): any {
    return this.#mapData(data, {
      bigInt: (value) => {
        if (value instanceof BigNumber) return value.toFixed();
        return value.toString();
      },
      number: (value) => value.toString(),
    });
  }

  #decodeRes(data: any): any {
    return this.#mapData(data, {
      bigInt: (value) => BigInt(value),
      number: (value) => +value,
    });
  }
}

type BigIntPropertyNames = typeof bigIntPropertyNames[number];
type NumberPropertyNames = typeof numberPropertyNames[number];
type PreserveOptional<NewType, OrigType> =
  OrigType extends undefined ? NewType | undefined : NewType;
export type TransformNodeType<Type> =
  Type extends (...args: infer Args) => infer Ret
    ? (...args: TransformNodeType<Args>) => TransformNodeType<Ret>
    : Type extends [infer Item, ...infer Rest]
      ? [TransformNodeType<Item>, ...TransformNodeType<Rest>]
      : Type extends Array<infer Item>
        ? Array<TransformNodeType<Item>>
        : Type extends Promise<infer T>
          ? Promise<TransformNodeType<T>>
          : Type extends { [P in any]: any }
            ? {
              [Property in keyof Type]:
              Property extends BigIntPropertyNames
                ? PreserveOptional<bigint, Type[Property]>
                : Property extends NumberPropertyNames
                  ? PreserveOptional<number, Type[Property]>
                  : Property extends 'txHash'
                    ? PreserveOptional<Encoded.TxHash, Type[Property]>
                    : Property extends 'bytecode'
                      ? PreserveOptional<Encoded.ContractBytearray, Type[Property]>
                      : TransformNodeType<Type[Property]>
            }
            : Type;
type NodeTransformedApi = new (...args: ConstructorParameters<typeof NodeApi>) => {
  [Name in keyof InstanceType<typeof NodeApi>]:
  Name extends 'pipeline' | 'sendRequest' | 'sendOperationRequest'
    ? NodeApi[Name] : TransformNodeType<NodeApi[Name]>
};

interface NodeInfo {
  url: string;
  nodeNetworkId: string;
  version: string;
  consensusProtocolVersion: ConsensusProtocolVersion;
}

export default class Node extends (NodeTransformed as unknown as NodeTransformedApi) {
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
