import { snakeToPascal, pascalToSnake } from './string'

export const pause = async (duration: number): Promise<void> =>
  await new Promise(resolve => setTimeout(resolve, duration))

export const mapObject = (
  object: object,
  fn: (value: [string, any], index: number, array: Array<[string, any]>) => Array<[string, any]>
): object => Object.fromEntries(Object.entries(object).map(fn))

export const filterObject = (
  object: object,
  fn: (value: [string, any], index: number, array: Array<[string, any]>) => boolean
): object => Object.fromEntries(Object.entries(object).filter(fn))

/**
 * Key traversal metafunction
 * @static
 * @function
 * @rtype (fn: (s: String) => String) => (o: Object) => Object
 * @param {Function} fn - Key transformation function
 * @param {Object} object - Object to traverse
 * @return {Object} Transformed object
 */
export const traverseKeys = (fn: Function, object: any): any => {
  if (typeof object !== 'object' || object === null) return object
  if (Array.isArray(object)) return object.map(i => traverseKeys(fn, i))
  return mapObject(object, ([key, value]: [string, any]) => [
    fn(key), traverseKeys(fn, value)
  ])
}

/**
 * snake_case key traversal
 * @static
 * @rtype (o: Object) => Object
 * @param {Object} object - Object to traverse
 * @return {Object} Transformed object
 * @see pascalToSnake
 */
export const snakizeKeys = traverseKeys.bind(null, pascalToSnake)

/**
 * PascalCase key traversal
 * @static
 * @rtype (o: Object) => Object
 * @param {Object} object - Object to traverse
 * @return {Object} Transformed object
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
