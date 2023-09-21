// eslint-disable-next-line max-classes-per-file
import BigNumber from 'bignumber.js';
import { OperationArguments, OperationSpec } from '@azure/core-client';
import {
  genRequestQueuesPolicy, genCombineGetRequestsPolicy, genErrorFormatterPolicy,
  genVersionCheckPolicy, genRetryOnFailurePolicy,
} from './utils/autorest';
import { Middleware as MiddlewareApi, MiddlewareOptionalParams, ErrorResponse } from './apis/middleware';
import { mapObject } from './utils/other';
import { Encoded } from './utils/encoder';
import { ConsensusProtocolVersion } from './tx/builder/constants';

const bigIntPropertyNames = [] as const;

const numberPropertyNames = [] as const;

class MiddlewareTransformed extends MiddlewareApi {
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
export type TransformMiddlewareType<Type> =
  Type extends (...args: infer Args) => infer Ret
    ? (...args: TransformMiddlewareType<Args>) => TransformMiddlewareType<Ret>
    : Type extends [infer Item, ...infer Rest]
      ? [TransformMiddlewareType<Item>, ...TransformMiddlewareType<Rest>]
      : Type extends Array<infer Item>
        ? Array<TransformMiddlewareType<Item>>
        : Type extends Promise<infer T>
          ? Promise<TransformMiddlewareType<T>>
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
                      : TransformMiddlewareType<Type[Property]>
            }
            : Type;
type MiddlewareTransformedApi = new (...args: ConstructorParameters<typeof MiddlewareApi>) => {
  [Name in keyof InstanceType<typeof MiddlewareApi>]:
  Name extends 'pipeline' | 'sendRequest' | 'sendOperationRequest'
    ? MiddlewareApi[Name] : TransformMiddlewareType<MiddlewareApi[Name]>
};

export interface MiddlewareInfo {
  url: string;
  nodeNetworkId: string;
  version: string;
  consensusProtocolVersion: ConsensusProtocolVersion;
}

export default class Middleware
  extends (MiddlewareTransformed as unknown as MiddlewareTransformedApi) {
  /**
   * @param url - Url for middleware API
   * @param options - Options
   * @param options.ignoreVersion - Don't ensure that the middleware is supported
   * @param options.retryCount - Amount of extra requests to do in case of failure
   * @param options.retryOverallDelay - Time in ms to wait between all retries
   */
  constructor(
    url: string,
    {
      ignoreVersion = false, retryCount = 3, retryOverallDelay = 800, ...options
    }: MiddlewareOptionalParams & {
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
        genErrorFormatterPolicy((body: ErrorResponse) => ` ${body.error}`),
      ],
      ...options,
    });
    if (!ignoreVersion) {
      const statusPromise = this.getStatus();
      const versionPromise = statusPromise.then(({ mdwVersion }) => mdwVersion, (error) => error);
      this.pipeline.addPolicy(
        genVersionCheckPolicy('middleware', '/v2/status', versionPromise, '1.47.0', '2.0.0'),
      );
    }
  }
}
