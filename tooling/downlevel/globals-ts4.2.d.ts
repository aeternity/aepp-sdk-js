/**
 * required for TS\@4.4 and below
 * copied from https://github.com/microsoft/TypeScript/blob/f6628a4573cd37c26912f78de3d08cd1dbf687a5/lib/lib.es5.d.ts#L1530-L1539
 * Recursively unwraps the "awaited type" of a type. Non-promise "thenables" should resolve to
 * `never`. This emulates the behavior of `await`.
 */
type Awaited<T> =
  // special case for `null | undefined` when not in `--strictNullChecks` mode
  T extends null | undefined ? T :
    // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
    T extends object & { then: (onfulfilled: infer F, ...args: infer _) => any } ?
      // if the argument to `then` is callable, extracts the first argument
      F extends ((value: infer V, ...args: infer _2) => any) ?
        Awaited<V> : // recursively unwrap the value
        never : // the argument to `then` was not callable
      T; // non-object or non-thenable
