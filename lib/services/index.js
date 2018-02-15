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


class Service {
  constructor(provider, namespace, methods) {
    if (!methods) {
      throw 'Service does not implement namespace'
    }
    if (!namespace) {
      throw 'Service does not implement namespace'
    }
    this.methods = methods
    this.namespace = namespace
    this.provider = provider
    this._assignProviderMethods()
  }

  setProvider(provider) {
    this.provider = provider
    this._assignProviderMethods()
  }

  _assignProviderMethods() {
    let methods = this.methods

    methods.forEach((method) => {
      if (this.provider[this.namespace] && this.provider[this.namespace][method]) {
        this[method] = this.provider[this.namespace][method].bind(this.provider[this.namespace])
      } else {
        let error = `'${this.namespace}.${method}' is not implemented`
        this[method] = () => {
          new Promise((resolve, reject) => reject(error))
        }
      }
    })
  }

}

module.exports = Service
