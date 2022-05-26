import {
  writeId, readId, isNameValid, produceNameId, getMinimumNameFee, readInt, writeInt
} from './helpers'
import { InsufficientNameFeeError, IllegalArgumentError } from '../../utils/errors'
import { MIN_GAS_PRICE } from './constants'

export class Field {
  static serialize (value) {
    return value
  }

  static deserialize (value) {
    return value
  }
}

export class Name extends Field {
  static serialize (value) {
    return Buffer.from(value)
  }

  static deserialize (value) {
    return value.toString()
  }
}

export class NameId extends Field {
  static serialize (value) {
    return writeId(isNameValid(value) ? produceNameId(value) : value)
  }

  static deserialize (value) {
    return readId(value)
  }
}

export class NameFee extends Field {
  static serialize (value, { name }) {
    const minNameFee = getMinimumNameFee(name)
    value ??= minNameFee
    if (minNameFee.gt(value)) {
      throw new InsufficientNameFeeError(value, minNameFee)
    }
    return writeInt(value)
  }

  static deserialize (value) {
    return readInt(value)
  }
}

export class Deposit extends Field {
  static serialize (value) {
    if (+value) throw new IllegalArgumentError(`Contract deposit is not refundable, so it should be equal 0, got ${value} instead`)
    return writeInt(0)
  }

  static deserialize (value) {
    return readInt(value)
  }
}

export class GasPrice extends Field {
  static serialize (value = MIN_GAS_PRICE) {
    if (+value < MIN_GAS_PRICE) {
      throw new IllegalArgumentError(`Gas price ${value} must be bigger then ${MIN_GAS_PRICE}`)
    }
    return writeInt(value)
  }

  static deserialize (value) {
    return readInt(value)
  }
}
