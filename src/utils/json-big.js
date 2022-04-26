import JsonBig from 'json-bigint'
import BigNumber from 'bignumber.js'
import { mapObject } from './other'

const jsonBig = JsonBig({ storeAsString: true })

const convertValuesToBigNumbers = value => {
  if (typeof value === 'object' && value !== null && value.constructor === Object) {
    return mapObject(value, ([key, value]) => [key, convertValuesToBigNumbers(value)])
  }
  if (Array.isArray(value)) {
    return value.map(item => convertValuesToBigNumbers(item))
  }
  if (typeof value === 'string' && BigNumber(value).toString(10) === value) {
    const bn = BigNumber(value)
    bn.toJSON = () => bn.toString(10)
    return bn
  }
  return value
}

export default {
  stringify: (object, ...args) => jsonBig.stringify(convertValuesToBigNumbers(object), ...args),
  parse: jsonBig.parse
}
