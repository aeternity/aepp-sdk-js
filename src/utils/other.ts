import { snakeToPascal, pascalToSnake } from './string'

export const pause = async (duration: number): Promise<void> =>
  await new Promise(resolve => setTimeout(resolve, duration))

export const mapObject = <InputV, OutputV>(
  object: { [k: string]: InputV },
  fn: (
    value: [string, InputV], index: number, array: Array<[string, InputV]>
  ) => [number | string, OutputV]
): { [k: string]: OutputV } => Object.fromEntries(Object.entries(object).map(fn))

export const filterObject = (
  object: object,
  fn: (value: [string, any], index: number, array: Array<[string, any]>) => boolean
): object => Object.fromEntries(Object.entries(object).filter(fn))

/**
 * Key traversal metafunction
 * @static
 * @param {Function} fn - Key transformation function
 * @param {Object} object - Object to traverse
 * @returns Transformed object
 */
export const traverseKeys = (fn: (s: string) => string, object: any): any => {
  if (typeof object !== 'object' || object === null) return object
  if (Array.isArray(object)) return object.map(i => traverseKeys(fn, i))
  return mapObject(object, ([key, value]) => [fn(key), traverseKeys(fn, value)])
}

/**
 * snake_case key traversal
 * @static
 * @param {Object} object - Object to traverse
 * @returns Transformed object
 * @see pascalToSnake
 */
export const snakizeKeys = traverseKeys.bind(null, pascalToSnake)

/**
 * PascalCase key traversal
 * @static
 * @param {Object} object - Object to traverse
 * @returns Transformed object
 * @see snakeToPascal
 */
export const pascalizeKeys = traverseKeys.bind(null, snakeToPascal)

// remove after dropping webpack4 support
const isWebpack4Buffer = (() => {
  try {
    Buffer.concat([Uint8Array.from([])])
    return false
  } catch (error) {
    return true
  }
})()

export const concatBuffers = isWebpack4Buffer
  ? (list: readonly Uint8Array[], totalLength?: number): Buffer =>
      Buffer.concat(list.map(el => Buffer.from(el)), totalLength)
  : Buffer.concat

/**
 * Object key type guard
 * @param key - Object key
 * @param object - object
 */
export function isKeyOfObject<T> (
  key: string | number | symbol,
  object: T
): key is keyof T {
  return key in object
}
