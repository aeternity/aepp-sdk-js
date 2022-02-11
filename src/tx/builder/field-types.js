import { writeId, readId, isNameValid, produceNameId } from './helpers'

export class Field {
  static serialize (value) {
    return value
  }

  static deserialize (value) {
    return value
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
