var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var _createClass = require("@babel/runtime/helpers/createClass");

/*
 * ISC License (ISC)
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
var AeSubscription =
/*#__PURE__*/
function () {
  function AeSubscription() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, AeSubscription);

    this.origin = options && options.origin;
    this.action = options && options.action;

    if (options && options.update) {
      this.update = options.update;
    }

    if (options && options.matches) {
      this.matches = options.matches;
    }
  }

  _createClass(AeSubscription, [{
    key: "matches",
    value: function matches(data) {
      return (typeof this.origin === 'undefined' || this.origin === data.origin) && (typeof this.action === 'undefined' || this.action === data.action);
    }
  }, {
    key: "update",
    value: function update(data) {}
  }]);

  return AeSubscription;
}();

module.exports = {
  AeSubscription: AeSubscription
};