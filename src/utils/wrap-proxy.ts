import { ArgumentError } from './errors.js';

export function wrapWithProxy<Value extends object | undefined>(
  valueCb: () => Value,
): NonNullable<Value> {
  return new Proxy(
    {},
    Object.fromEntries(
      (
        [
          'apply',
          'construct',
          'defineProperty',
          'deleteProperty',
          'getOwnPropertyDescriptor',
          'getPrototypeOf',
          'isExtensible',
          'ownKeys',
          'preventExtensions',
          'set',
          'setPrototypeOf',
          'get',
          'has',
        ] as const
      ).map((name) => [
        name,
        (t: {}, ...args: unknown[]) => {
          const target = valueCb();
          if (target == null) throw new ArgumentError('wrapped value', 'defined', target);
          if (name === 'get' && args[0] === '_wrappedValue') return target;
          const res = (Reflect[name] as any)(target, ...args);
          return typeof res === 'function' && name === 'get' ? res.bind(target) : res;
        },
      ]),
    ),
  ) as NonNullable<Value>;
}

/**
 * Returns the value a proxy wraps. Anything keyed by a node must key by this: `onNode` is a proxy
 * created once per sdk instance and its identity doesn't change on `selectNode`, so a cache keyed
 * by the proxy would apply one network's values on another.
 */
export function unwrapProxy<Value extends object>(value: Value): Value {
  return (value as { _wrappedValue?: Value })._wrappedValue ?? value;
}

/**
 * The same as {@link unwrapProxy}, but returns `undefined` instead of throwing when the proxy has
 * nothing to unwrap — an sdk instance with no node selected wraps a value that isn't there yet.
 */
export function unwrapProxyIfPossible<Value extends object>(value: Value): Value | undefined {
  try {
    return unwrapProxy(value);
  } catch {
    return undefined;
  }
}
