import { snakeToPascal, pascalToSnake } from './string'

export const pause = duration => new Promise(resolve => setTimeout(resolve, duration))

export const mapObject = (object, fn) => Object.fromEntries(Object.entries(object).map(fn))
export const filterObject = (object, fn) => Object.fromEntries(Object.entries(object).filter(fn))

/**
 * Key traversal metafunction
 * @static
 * @function
 * @rtype (fn: (s: String) => String) => (o: Object) => Object
 * @param {Function} fn - Key transformation function
 * @param {Object} object - Object to traverse
 * @param {Array} [keysOfValuesToIgnore] - Workaround to fix serialisation
 * @return {Object} Transformed object
 */
export const traverseKeys = (fn, object, keysOfValuesToIgnore = []) => {
  if (typeof object !== 'object' || object === null) return object
  if (Array.isArray(object)) return object.map(i => traverseKeys(fn, i, keysOfValuesToIgnore))
  return mapObject(object, ([key, value]) => [
    fn(key),
    keysOfValuesToIgnore.includes(key) ? value : traverseKeys(fn, value, keysOfValuesToIgnore)
  ])
}

/**
 * snake_case key traversal
 * @static
 * @rtype (o: Object) => Object
 * @param {Object} object - Object to traverse
 * @param {Array} keysOfValuesToIgnore
 * @return {Object} Transformed object
 * @see pascalToSnake
 */
export const snakizeKeys = traverseKeys.bind(null, pascalToSnake)

/**
 * PascalCase key traversal
 * @static
 * @rtype (o: Object) => Object
 * @param {Object} object - Object to traverse
 * @param {Array} keysOfValuesToIgnore
 * @return {Object} Transformed object
 * @see snakeToPascal
 */
export const pascalizeKeys = traverseKeys.bind(null, snakeToPascal)
