import {
  writeId, readId, produceNameId, getMinimumNameFee, readInt, writeInt, isNameValid
} from './helpers'
import { InsufficientNameFeeError, IllegalArgumentError } from '../../utils/errors'
import BigNumber from 'bignumber.js'
import { MIN_GAS_PRICE } from './constants'
import { AensName } from '../../chain'

// todo: update me
// ? This is a TS workaround because this has to be a class with only static methods
export class Field {
  public prototype: any

  /**
   * @param value
   * @param _txFields
   */
  static serialize (value: any, _txFields: object = {}): Buffer {
    return Buffer.from(value)
  }

  /**
   * @param value
   */
  static deserialize (value: Buffer): any {
    return value.toString()
  }
}

export class Name extends Field {
  /**
   * @param value - AENS name
   */
  static serialize (value: AensName): Buffer {
    return Buffer.from(value)
  }

  /**
   * @param value - AENS name
   */
  static deserialize (value: Buffer): string {
    return value.toString()
  }
}

export class NameId extends Field {
  /**
   * @param value - AENS name ID
   */
  static serialize (value: AensName): Buffer {
    return writeId(isNameValid(value) ? produceNameId(value) : value)
  }

  /**
   * @param value - AENS name ID Buffer
   */
  static deserialize (value: Buffer): string {
    return readId(value)
  }
}

export class NameFee extends Field {
  /**
   * @param value - AENS name fee Buffer
   * @param txFields - Transaction fields
   * @param txFields.name - AENS Name in transaction
   */
  static serialize (value: BigNumber, { name }: { name: AensName }): Buffer {
    const minNameFee = getMinimumNameFee(name)
    value ??= minNameFee
    if (minNameFee.gt(value)) {
      throw new InsufficientNameFeeError(value.toNumber(), minNameFee.toNumber())
    }
    return writeInt(value)
  }

  /**
   * @param value - AENS name fee Buffer
   * @returns AENS name fee
   */
  static deserialize (value: Buffer): string {
    return readInt(value)
  }
}

export class Deposit extends Field {
  /**
   * @param value Deposit value in string format. Should be equal to  '0'.
   * @returns Deposit value Buffer.
   */
  static serialize (value: string): Buffer {
    value ??= '0'
    if (parseInt(value) !== 0) throw new IllegalArgumentError(`Contract deposit is not refundable, so it should be equal 0, got ${value.toString()} instead`)
    return writeInt(0)
  }

  /**
   * @param value Deposit value Buffer.
   * @returns Deposit value.
   */
  static deserialize (value: Buffer): string {
    return readInt(value)
  }
}

export class GasPrice extends Field {
  static serialize (value = MIN_GAS_PRICE): Buffer {
    if (+value < MIN_GAS_PRICE) {
      throw new IllegalArgumentError(`Gas price ${value} must be bigger then ${MIN_GAS_PRICE}`)
    }
    return writeInt(value)
  }

  static deserialize (value: Buffer): string {
    return readInt(value)
  }
}
