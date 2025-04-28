import * as chainMethods from './chain.js';
import { sendTransaction } from './send-transaction.js';
import * as spendMethods from './spend.js';
import * as contractGaMethods from './contract/ga.js';
import { buildTxAsync } from './tx/builder/index.js';
import { mapObject, UnionToIntersection } from './utils/other.js';
import { wrapWithProxy } from './utils/wrap-proxy.js';
import Node from './Node.js';
import { TxParamsAsync } from './tx/builder/schema.generated.js';
import AccountBase from './account/Base.js';
import { Encoded } from './utils/encoder.js';
import CompilerBase from './contract/compiler/Base.js';

export type OnAccount = Encoded.AccountAddress | AccountBase | undefined;

const methods = {
  ...chainMethods,
  sendTransaction,
  ...spendMethods,
  ...contractGaMethods,
} as const;

type Decrement<Number extends number> = [-1, 0, 1, 2, 3, 4, 5][Number];
type GetMethodsOptions<Methods extends { [key: string]: Function }> = {
  [Name in keyof Methods]: Methods[Name] extends (...args: infer Args) => any
    ? Args[Decrement<Args['length']>]
    : never;
};
type MethodsOptions = GetMethodsOptions<typeof methods>;
export interface AeSdkMethodsOptions
  extends Partial<UnionToIntersection<MethodsOptions[keyof MethodsOptions]>> {}

export interface WrappedOptions {
  onAccount: AccountBase;
  onCompiler: CompilerBase;
  onNode: Node;
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

  readonly #wrappedOptions: WrappedOptions;

  /**
   * @param options - Options
   */
  constructor(options: AeSdkMethodsOptions = {}) {
    Object.assign(this._options, options);
    this.#wrappedOptions = {
      onAccount: wrapWithProxy(() => this._options.onAccount),
      onNode: wrapWithProxy(() => this._options.onNode),
      onCompiler: wrapWithProxy(() => this._options.onCompiler),
    };
  }

  /**
   * Returns sdk instance options with references to current account, node, compiler.
   * Used to create an instance (Contract, Oracle) bound to AeSdk state.
   * @param mergeWith - Merge context with these extra options
   * @returns Context object
   */
  getContext(mergeWith: AeSdkMethodsOptions = {}): AeSdkMethodsOptions & WrappedOptions {
    return {
      ...this._options,
      ...this.#wrappedOptions,
      ...mergeWith,
    };
  }

  // TODO: omit onNode from options, because it is already in context
  async buildTx(options: TxParamsAsync): Promise<Encoded.Transaction> {
    // TODO: remove `any` at the same time as AeSdk class
    return buildTxAsync({ ...(this.getContext() as any), ...options });
  }
}

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OptionalIfNotRequired<T extends [any]> = RequiredKeys<T[0]> extends never ? T | [] : T;

type ReplaceOnAccount<Options> = Options extends { onAccount: any }
  ? Omit<Options, 'onAccount'> & {
      /**
       * Make operation on specific account by providing address (to use account from sdk) or instance
       * of AccountBase (like AccountMemory)
       */
      onAccount: OnAccount;
    }
  : Options;

type MakeOptional<Options> = OptionalIfNotRequired<
  [Omit<Options, 'onNode' | 'onCompiler' | 'onAccount'> & Partial<ReplaceOnAccount<Options>>]
>;

type TransformMethods<Methods extends { [key: string]: Function }> = {
  [Name in keyof Methods]: Methods[Name] extends (
    ...args: [...infer Args, infer Options]
  ) => infer Ret
    ? (...args: [...Args, ...MakeOptional<Options>]) => Ret
    : never;
};

interface AeSdkMethodsTransformed extends TransformMethods<typeof methods> {}

Object.assign(
  AeSdkMethods.prototype,
  mapObject<Function, Function>(methods, ([name, handler]) => [
    name,
    function methodWrapper(this: AeSdkMethods, ...args: any[]) {
      args.length = handler.length;
      const options = args[args.length - 1];
      args[args.length - 1] = this.getContext(options);
      return handler(...args);
    },
  ]),
);

type AeSdkMethodsTyped = AeSdkMethods & AeSdkMethodsTransformed;
// eslint-disable-next-line @typescript-eslint/no-redeclare
const AeSdkMethodsTyped = AeSdkMethods as new (options?: AeSdkMethodsOptions) => AeSdkMethodsTyped;
export default AeSdkMethodsTyped;
