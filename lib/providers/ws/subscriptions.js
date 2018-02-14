/*
 * Copyright 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

const {actions} = require('./types')

class AeSubscription {
  constructor(options = {}) {
    this.origin = options && options.origin
    this.action = options && options.action
    if (options && options.update) {
      this.update = options.update
    }
  }

  matches(data) {
    return (typeof this.origin === 'undefined' || this.origin === data.origin)
      && (typeof this.action === 'undefined' || this.action === data.action)
  }

  update(data) {}

}

class OracleRegistrationSubscription extends AeSubscription {

  constructor(emitter) {
    super()
    this.pendingOracleIds = []
    this.emitter = emitter
  }

  matches(data) {
    return (data.action === actions.MINED_BLOCK)
      || (data.action === actions.NEW_BLOCK)
      || (data.action === actions.REGISTER && data.origin === 'oracle')
  }

  update(data) {
    if ([actions.MINED_BLOCK, actions.NEW_BLOCK].includes(data.action)) {
      console.log(`New block ${JSON.stringify(data)}`)
      if (this.pendingOracleIds.length > 0) {
        for (let i in this.pendingOracleIds) {
          this.emitter.emit('registeredOracle', this.pendingOracleIds[i])
        }
        this.pendingOracleIds = []
      }
    } else {
      console.log(`New oracle registration ${data.payload['oracle_id']}`)
      this.pendingOracleIds.push(data.payload['oracle_id'])
    }
  }
}

module.exports = {
  AeSubscription,
  OracleRegistrationSubscription
}