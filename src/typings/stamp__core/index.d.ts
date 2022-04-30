declare module '@stamp/core'{
  /**
   * Mutates destination object with shallow assign of passed source objects.
   * Returns destination object.
   */
  export const assign: <T extends object = object>(dst: T, ...args: Array<object | undefined>) => T

  /**
   * Mutates destination object by deeply merging passed source objects.
   * Arrays are concatenated, not overwritten.
   * Everything else but plain objects are copied by reference.
   *
   * Returns destination object/array or a new object/array in case it was not.
   */
  export const merge: <T extends object = object>(dst: T, ...args: Array<object | undefined>) => T

  /** @deprecated Use Reflect.ownKeys() instead */
  export const getOwnPropertyKeys: typeof Reflect.ownKeys
}
