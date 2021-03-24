import * as R from 'ramda'
import { snakeToPascal, pascalToSnake } from './string'

export const pause = duration => new Promise(resolve => setTimeout(resolve, duration))

/**
 * Key traversal metafunction
 * @static
 * @function
 * @rtype (fn: (s: String) => String) => (o: Object) => Object
 * @param {Function} fn - Key transformation function
 * @param {Object} o - Object to traverse
 * @return {Object} Transformed object
 */
export const traverseKeys = R.curry((fn, o) => {
  const dispatch = {
    Object: o => R.fromPairs(R.toPairs(o).map(function (arr) {
      const k = arr[0]
      const v = arr[1]
      return [fn(k), traverseKeys(fn, v)]
    })),
    Array: o => o.map(traverseKeys(fn))
  }

  return (dispatch[R.type(o)] || R.identity)(o)
})

/**
 * snake_case key traversal
 * @static
 * @rtype (o: Object) => Object
 * @param {Object} o - Object to traverse
 * @return {Object} Transformed object
 * @see pascalToSnake
 */
export const snakizeKeys = o => traverseKeys(pascalToSnake, o)

/**
 * PascalCase key traversal
 * @static
 * @rtype (o: Object) => Object
 * @param {Object} o - Object to traverse
 * @return {Object} Transformed object
 * @see snakeToPascal
 */
export const pascalizeKeys = o => traverseKeys(snakeToPascal, o)
