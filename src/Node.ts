// eslint-disable-next-line max-classes-per-file
import BigNumber from 'bignumber.js';
import { OperationArguments, OperationSpec } from '@azure/core-client';
import {
  genRequestQueuesPolicy, genCombineGetRequestsPolicy, genErrorFormatterPolicy,
  genVersionCheckPolicy,
} from './utils/autorest';
import { Node as NodeApi, NodeOptionalParams, ErrorModel } from './apis/node';
import { mapObject } from './utils/other';
import { Encoded } from './utils/encoder';
import { MissingParamError } from './utils/errors';

/**
 * Obtain networkId from account or node
 */
export async function getNetworkId({ networkId }: { networkId?: string } = {}): Promise<string> {
  const res = networkId ?? this.networkId ?? (await this.api?.getStatus())?.networkId;
  if (res != null) return res;
  throw new MissingParamError('networkId is not provided');
}

const bigIntPropertyNames = [
  'balance', 'queryFee', 'fee', 'amount', 'nameFee', 'channelAmount',
  'initiatorAmount', 'responderAmount', 'channelReserve', 'initiatorAmountFinal',
  'responderAmountFinal', 'gasPrice', 'deposit',
] as const;

const numberPropertyNames = [
  'time', 'gas', 'gasUsed', 'nameSalt',
  'nonce', 'nextNonce', 'height', 'blockHeight', 'top', 'topBlockHeight',
  'ttl', 'nameTtl', 'clientTtl',
  'inbound', 'outbound', 'peerCount', 'pendingTransactionsCount', 'effectiveAtHeight',
  'version', 'solutions', 'round',
] as const;

class NodeTransformed extends NodeApi {
  async sendOperationRequest(
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
                    : TransformNodeType<Type[Property]>
            }
            : Type;
type NodeTransformedApi = new (...args: ConstructorParameters<typeof NodeApi>) => {
  [Name in keyof InstanceType<typeof NodeApi>]:
  Name extends 'pipeline' | 'sendRequest' | 'sendOperationRequest'
    ? NodeApi[Name] : TransformNodeType<NodeApi[Name]>
};

export interface NodeInfo {
  url: string;
  nodeNetworkId: string;
  version: string;
  consensusProtocolVersion: number;
}

export default class Node extends (NodeTransformed as unknown as NodeTransformedApi) {
  url: string;

  /**
   * @param url - Url for node API
   * @param options - Options
   * @param options.ignoreVersion - Don't check node version
   */
  constructor(
    url: string,
    { ignoreVersion = false, ...options }: NodeOptionalParams & { ignoreVersion?: boolean } = {},
  ) {
    // eslint-disable-next-line constructor-super
    super(url, {
      allowInsecureConnection: true,
      additionalPolicies: [
        genRequestQueuesPolicy(),
        genCombineGetRequestsPolicy(),
        genErrorFormatterPolicy((body: ErrorModel) => ` ${body.reason}`),
      ],
      ...options,
    });
    this.url = url;
    if (!ignoreVersion) {
      const versionPromise = this.getStatus().then(({ nodeVersion }) => nodeVersion);
      this.pipeline.addPolicy(
        genVersionCheckPolicy('node', '/v3/status', versionPromise, '6.2.0', '7.0.0'),
      );
    }
    this.intAsString = true;
  }

  async getNodeInfo(): Promise<NodeInfo> {
    const {
      nodeVersion: version,
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
    return {
      url: this.url,
      nodeNetworkId,
      version,
      consensusProtocolVersion,
    };
  }
}
