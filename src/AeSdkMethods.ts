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
import CompilerBase from './contract/compiler/Base';

export type OnAccount = Encoded.AccountAddress | AccountBase | undefined;

export function getValueOrErrorProxy<Value extends object | undefined>(
  valueCb: () => Value,
): NonNullable<Value> {
  return new Proxy(
    {},
    Object.fromEntries(([
      'apply', 'construct', 'defineProperty', 'deleteProperty', 'getOwnPropertyDescriptor',
      'getPrototypeOf', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
      'get', 'has',
    ] as const).map((name) => [name, (t: {}, ...args: unknown[]) => {
      const target = valueCb() as object; // to get a native exception in case it missed
      const res = (Reflect[name] as any)(target, ...args);
      return typeof res === 'function' && name === 'get'
        ? res.bind(target) // otherwise it fails with attempted to get private field on non-instance
        : res;
    }])),
  ) as NonNullable<Value>;
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
export interface AeSdkMethodsOptions
  extends Partial<UnionToIntersection<MethodsOptions[keyof MethodsOptions]>> {
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

  _getOptions(
    callOptions: AeSdkMethodsOptions = {},
  ): AeSdkMethodsOptions & { onAccount: AccountBase; onCompiler: CompilerBase; onNode: Node } {
    return {
      ...this._options,
      onAccount: getValueOrErrorProxy(() => this._options.onAccount),
      onNode: getValueOrErrorProxy(() => this._options.onNode),
      onCompiler: getValueOrErrorProxy(() => this._options.onCompiler),
      ...callOptions,
    };
  }

  async buildTx(options: TxParamsAsync): Promise<Encoded.Transaction> {
    return buildTxAsync({ ...this._getOptions(), ...options });
  }

  async initializeContract<Methods extends ContractMethodsBase>(
    options?: Omit<Parameters<typeof Contract.initialize>[0], 'onNode'> & { onNode?: Node },
  ): Promise<Contract<Methods>> {
    return Contract.initialize<Methods>(this._getOptions(options as AeSdkMethodsOptions));
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
    function methodWrapper(this: AeSdkMethods, ...args: any[]) {
      args.length = handler.length;
      const options = args[args.length - 1];
      args[args.length - 1] = this._getOptions(options);
      return handler(...args);
    },
  ],
));

type AeSdkMethodsTyped = AeSdkMethods & AeSdkMethodsTransformed;
// eslint-disable-next-line @typescript-eslint/no-redeclare
const AeSdkMethodsTyped = AeSdkMethods as new (options?: AeSdkMethodsOptions) => AeSdkMethodsTyped;
export default AeSdkMethodsTyped;
