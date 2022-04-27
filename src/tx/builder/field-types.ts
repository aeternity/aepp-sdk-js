import {
  writeId, readId, isNameValid, produceNameId, ensureNameValid, getMinimumNameFee, readInt, writeInt
} from './helpers'
import { InsufficientNameFeeError, IllegalArgumentError } from '../../utils/errors'
import BigNumber from 'bignumber.js'

/**
 * Class implementing a common interface for all TX field types
 * @class
 */
export class Field {
  public prototype: any

  /**
   * Serialize value to Buffer
   * @function
   * @param {String | BigNumber} value
   * @param {Object} _options
   * @return {Buffer}
   */
  static serialize (value: string | BigNumber, _options: object = {}): Buffer {
    return Buffer.from(value)
  }

  /**
   * Deserialize value from Buffer
   * @function
   * @param {Buffer} value
   * @return {String}
   */
  static deserialize (value: Buffer): string {
    return value.toString()
  }
}

/**
 * Name Field Type Class
 * @class
 * @extends Field
 */
export class Name extends Field {
  /**
   * Serialize AENS name to Buffer
   * @function
   * @static
   * @param {String} value - AENS name
   * @returns {Buffer}
   */
  static serialize (value: string): Buffer {
    ensureNameValid(value)
    return Buffer.from(value)
  }

  /**
   * Deserialize AENS name from Buffer
   * @function
   * @static
   * @param {Buffer} value - AENS name
   * @returns {String}
   */
  static deserialize (value: Buffer): string {
    return value.toString()
  }
}

/**
 * NameId Field Type Class
 * @class
 * @extends Field
 */
export class NameId extends Field {
  /**
   * Serializes AENS name ID to Buffer
   * @function
   * @static
   * @param {String} value - AENS name ID
   * @returns {Buffer}
   */
  static serialize (value: string): Buffer {
    return writeId(isNameValid(value) ? produceNameId(value) : value)
  }

  /**
   * Deserializes AENS name ID from Buffer
   * @function
   * @static
   * @param value - AENS name ID Buffer
   * @returns {String}
   */
  static deserialize (value: Buffer): string {
    return readId(value)
  }
}

/**
 * NameFee Field Type Class
 * @class
 * @extends Field
 */
export class NameFee extends Field {
  /**
   * Serializes AENS name fee to Buffer
   * @function
   * @static
   * @param {BigNumber} value - AENS name fee Buffer
   * @param {Object} options - Options
   * @param {String} options.name - AENS Name in transaction
   * @returns {Buffer}
   */
  static serialize (value: BigNumber, { name }: { name: string }): Buffer {
    const minNameFee = getMinimumNameFee(name)
    value ??= minNameFee
    if (minNameFee.gt(value)) {
      throw new InsufficientNameFeeError(value.toNumber(), minNameFee.toNumber())
    }
    return writeInt(value)
  }

  /**
   * Deserializes AENS name fee from Buffer
   * @function
   * @static
   * @param value - AENS name fee Buffer
   * @returns {String} AENS name fee
   */
  static deserialize (value: Buffer): string {
    return readInt(value)
  }
}

/**
 * Deposit Field Type Class
 * @class
 * @extends Field
 */
export class Deposit extends Field {
  /**
   * Serializes deposit value to Buffer.
   * Each numerical value should be 0.
   * @function
   * @static
   * @param {String} [value=0]  - Deposit value in string format. Should be equal to  '0'.
   * @returns {Buffer} - Deposit value Buffer.
   */
  static serialize (value: string): Buffer {
    value ??= '0'
    if (parseInt(value) !== 0) throw new IllegalArgumentError(`Contract deposit is not refundable, so it should be equal 0, got ${value.toString()} instead`)
    return writeInt(0)
  }

  /**
   * Deserializes deposit value from Buffer.
   * @function
   * @static
   * @param {Buffer} [value]  - Deposit value Buffer.
   * @returns {String} - Deposit value.
   */
  static deserialize (value: Buffer): string {
    return readInt(value)
  }
}
