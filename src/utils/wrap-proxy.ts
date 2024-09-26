import { ArgumentError } from './errors';

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

export function unwrapProxy<Value extends object>(value: Value): Value {
  return (value as { _wrappedValue?: Value })._wrappedValue ?? value;
}
