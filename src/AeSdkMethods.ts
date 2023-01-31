import * as chainMethods from './chain';
import * as aensMethods from './aens';
import * as spendMethods from './spend';
import * as oracleMethods from './oracle';
import Contract, { ContractMethodsBase } from './contract/Contract';
import createDelegationSignature from './contract/delegation-signature';
import * as contractGaMethods from './contract/ga';
import { buildTxAsync } from './tx/builder';
import { mapObject, UnionToIntersection } from './utils/other';
import Node from './Node';
import { TxParamsAsync } from './tx/builder/schema.generated';
import AccountBase from './account/Base';
import { Encoded } from './utils/encoder';
import { ArgumentError, NotImplementedError, TypeError } from './utils/errors';

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
  createDelegationSignature,
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
  _options: AeSdkMethodsOptions = {};

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

  async buildTx(options: TxParamsAsync): Promise<Encoded.Transaction> {
    return buildTxAsync({ ...this._getOptions(), ...options });
  }

  async initializeContract<Methods extends ContractMethodsBase>(
    options?: Omit<Parameters<typeof Contract.initialize>[0], 'onNode'> & { onNode?: Node },
  ): Promise<Contract<Methods>> {
    const { onNode, onCompiler, ...otherOptions } = this._getOptions();
    if (onCompiler == null || onNode == null) {
      throw new ArgumentError('onCompiler, onNode', 'provided', null);
    }
    return Contract.initialize<Methods>({
      ...otherOptions,
      onNode,
      onCompiler,
      ...options,
    });
  }
}

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T];

type OptionalIfNotRequired<T extends [any]> = RequiredKeys<T[0]> extends never ? T | [] : T;

type ReplaceOnAccount<Options> = Options extends { onAccount: any }
  ? Omit<Options, 'onAccount'> & { onAccount: OnAccount } : Options;

type MakeOptional<Options> = OptionalIfNotRequired<[
  Omit<Options, 'onNode' | 'onCompiler' | 'onAccount'> & Partial<ReplaceOnAccount<Options>>,
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
