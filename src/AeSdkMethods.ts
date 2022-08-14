import * as chainMethods from './chain';
import * as aensMethods from './aens';
import * as spendMethods from './spend';
import * as oracleMethods from './oracle';
import getContractInstance from './contract/Contract';
import * as contractGaMethods from './contract/ga';
import { _buildTx } from './tx';
import { mapObject, UnionToIntersection } from './utils/other';
import Node from './Node';
import { AE_AMOUNT_FORMATS } from './utils/amount-formatter';
import { Tag } from './tx/builder/constants';
import AccountBase from './account/Base';
import { Encoded } from './utils/encoder';
import Compiler from './contract/Compiler';
import { NotImplementedError, TypeError } from './utils/errors';

export type OnAccount = Encoded.AccountAddress | AccountBase | undefined;

export function getValueOrErrorProxy<Value extends object>(valueCb: () => Value): Value {
  return new Proxy({}, {
    ...Object.fromEntries([
      'apply', 'construct', 'defineProperty', 'deleteProperty', 'getOwnPropertyDescriptor',
      'getPrototypeOf', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
    ].map((name) => [name, () => { throw new NotImplementedError(`${name} proxy request`); }])),
    get(t: {}, property: string | symbol, receiver: any) {
      const target = valueCb();
      const value = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
    has(t: {}, property: string | symbol) {
      return Reflect.has(valueCb(), property);
    },
  }) as Value;
}

const { InvalidTxError: _2, ...chainMethodsOther } = chainMethods;

const methods = {
  ...chainMethodsOther,
  ...aensMethods,
  ...spendMethods,
  ...oracleMethods,
  getContractInstance,
  ...contractGaMethods,
} as const;

type Decrement<Number extends number> = [-1, 0, 1, 2, 3, 4, 5][Number];
type GetMethodsOptions <Methods extends { [key: string]: Function }> =
  {
    [Name in keyof Methods]:
    Methods[Name] extends (...args: infer Args) => any
      ? Args[Decrement<Args['length']>] : never
  };
type MethodsOptions = GetMethodsOptions<typeof methods>;
interface AeSdkMethodsOptions
  extends Partial<UnionToIntersection<MethodsOptions[keyof MethodsOptions]>> {
  nodes?: Array<{ name: string; instance: Node }>;
  compilerUrl?: string;
  ignoreVersion?: boolean;
}

/**
 * AeSdkMethods is the composition of:
 * - chain methods
 * - tx methods
 * - aens methods
 * - spend methods
 * - oracle methods
 * - contract methods
 * - contract ga methods
 *
 * While these methods can be used separately, this class provides a handy way to store
 * their context (current account, network, and compiler to use).
 */
class AeSdkMethods {
  _options: AeSdkMethodsOptions = { denomination: AE_AMOUNT_FORMATS.AETTOS };

  /**
   * @param options - Options
   */
  constructor(options: AeSdkMethodsOptions = {}) {
    Object.assign(this._options, options);
  }

  /**
   * Resolves an account
   * @param account - ak-address, instance of AccountBase, or keypair
   */
  // eslint-disable-next-line class-methods-use-this
  _resolveAccount(account?: OnAccount): AccountBase {
    if (typeof account === 'string') throw new NotImplementedError('Address in AccountResolver');
    if (typeof account === 'object') return account;
    throw new TypeError(
      'Account should be an address (ak-prefixed string), '
      + `or instance of AccountBase, got ${String(account)} instead`,
    );
  }

  _getOptions(): AeSdkMethodsOptions & { onAccount: AccountBase } {
    return {
      ...this._options,
      onAccount: getValueOrErrorProxy(() => this._resolveAccount()),
    };
  }

  async buildTx<TxType extends Tag>(
    txType: TxType,
    options: Omit<Parameters<typeof _buildTx<TxType>>[1], 'onNode'> & { onNode?: Node },
  ): Promise<Encoded.Transaction> {
    // @ts-expect-error TODO: need to figure out what's wrong here
    return _buildTx<TxType>(txType, {
      ...this._getOptions(),
      ...options,
    });
  }
}

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T];

type OptionalIfNotRequired<T extends [any]> = RequiredKeys<T[0]> extends never ? T | [] : T;

type MakeOptional<Options> = OptionalIfNotRequired<[
  Omit<Options, 'onNode' | 'onCompiler' | 'onAccount'>
  & { onNode?: Node; onCompiler?: Compiler; onAccount?: OnAccount },
]>;

type TransformMethods <Methods extends { [key: string]: Function }> =
  {
    [Name in keyof Methods]:
    Methods[Name] extends (...args: [...infer Args, infer Options]) => infer Ret
      ? (...args: [...Args, ...MakeOptional<Options>]) => Ret
      : never
  };

interface AeSdkMethodsTransformed extends TransformMethods<typeof methods> {}

Object.assign(AeSdkMethods.prototype, mapObject<Function, Function>(
  methods,
  ([name, handler]) => [
    name,
    function methodWrapper(...args: any[]) {
      args.length = handler.length;
      const options = args[args.length - 1];
      args[args.length - 1] = {
        ...this._getOptions(),
        ...options,
        ...options?.onAccount != null && { onAccount: this._resolveAccount(options.onAccount) },
      };
      return handler(...args);
    },
  ],
));

export default AeSdkMethods as new (options?: ConstructorParameters<typeof AeSdkMethods>[0]) =>
AeSdkMethods & AeSdkMethodsTransformed;
