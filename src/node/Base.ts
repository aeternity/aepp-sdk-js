// eslint-disable-next-line max-classes-per-file
import BigNumber from 'bignumber.js';
import { OperationArguments, OperationSpec } from '@azure/core-client';
import { Node as NodeApi } from '../apis/node';
import { mapObject } from '../utils/other';
import { Encoded } from '../utils/encoder';

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

export default class NodeBase extends (NodeTransformed as unknown as NodeTransformedApi) {
}
