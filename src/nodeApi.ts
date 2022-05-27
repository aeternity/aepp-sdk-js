import BigNumber from 'bignumber.js'
import { OperationArguments, OperationSpec } from '@azure/core-client'
import {
  genRequestQueuesPolicy, genCombineGetRequestsPolicy, genErrorFormatterPolicy
} from './utils/autorest'
import { Node, NodeOptionalParams, ErrorModel } from './apis/node/'
import { mapObject } from './utils/other'
import { EncodedData } from './utils/encoder'

const bigIntPropertyNames = [
  'balance', 'queryFee', 'fee', 'amount', 'nameFee', 'channelAmount',
  'initiatorAmount', 'responderAmount', 'channelReserve', 'initiatorAmountFinal',
  'responderAmountFinal', 'gasPrice', 'deposit'
] as const

const numberPropertyNames = [
  'time', 'gas', 'gasUsed', 'nameSalt',
  'nonce', 'nextNonce', 'height', 'blockHeight', 'top', 'topBlockHeight', 'ttl',
  'inbound', 'outbound', 'peerCount', 'pendingTransactionsCount', 'effectiveAtHeight',
  'version', 'solutions'
] as const

type BigIntPropertyNames = typeof bigIntPropertyNames[number]
type NumberPropertyNames = typeof numberPropertyNames[number]
type PreserveOptional<NewType, OrigType> =
  OrigType extends undefined ? NewType | undefined : NewType
export type TransformNodeType<Type> =
  Type extends (...args: infer Args) => infer Ret
    ? (...args: TransformNodeType<Args>) => TransformNodeType<Ret>
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
                    ? PreserveOptional<EncodedData<'th'>, Type[Property]>
                    : TransformNodeType<Type[Property]>
            }
          : Type
type TransformedNode = new (...args: ConstructorParameters<typeof Node>) => {
  [Name in keyof InstanceType<typeof Node>]: TransformNodeType<Node[Name]>
}

export default class extends (Node as unknown as TransformedNode) {
  constructor (url: string, options?: NodeOptionalParams) {
    // eslint-disable-next-line constructor-super
    super(url, {
      allowInsecureConnection: true,
      additionalPolicies: [
        genRequestQueuesPolicy(),
        genCombineGetRequestsPolicy(),
        genErrorFormatterPolicy((body: ErrorModel) => ` ${body.reason}`)
      ],
      ...options
    })
    this.intAsString = true
  }

  // @ts-expect-error https://github.com/microsoft/TypeScript/issues/27689
  async sendOperationRequest (
    operationArguments: OperationArguments, operationSpec: OperationSpec
  ): Promise<any> {
    const args = mapObject(
      operationArguments,
      ([key, value]) => [key, this.#encodeArg(value)]
    ) as OperationArguments
    return this.#decodeRes(await super.sendOperationRequest(args, operationSpec))
  }

  #mapData (
    data: unknown, transform: {
      bigInt: (v: any) => any
      number: (v: any) => any
    }
  ): unknown {
    if (Array.isArray(data)) return data.map(d => this.#mapData(d, transform))
    if (data != null && typeof data === 'object') {
      return mapObject(data, ([key, value]) => {
        if (value == null) return [key, value]
        if (bigIntPropertyNames.some(k => k === key)) return [key, transform.bigInt(value)]
        if (numberPropertyNames.some(k => k === key)) return [key, transform.number(value)]
        return [key, this.#mapData(value, transform)]
      })
    }
    return data
  }

  #encodeArg (data: any): any {
    return this.#mapData(data, {
      bigInt: value => {
        if (value instanceof BigNumber) return value.toFixed()
        return value.toString()
      },
      number: value => value.toString()
    })
  }

  #decodeRes (data: any): any {
    return this.#mapData(data, {
      bigInt: value => BigInt(value),
      number: value => +value
    })
  }
}
