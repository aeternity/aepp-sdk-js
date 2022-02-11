import { writeId, readId, isNameValid, produceNameId, ensureNameValid } from './helpers'

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
    ensureNameValid(value)
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
