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
var ConnectionListener =
/*#__PURE__*/
function () {
  function ConnectionListener(_ref) {
    var onOpen = _ref.onOpen,
        onClosed = _ref.onClosed;

    _classCallCheck(this, ConnectionListener);

    if (onOpen && typeof onOpen === 'function') {
      this.onOpen = onOpen;
    }

    if (onClosed && typeof onClosed === 'function') {
      this.onClosed = onClosed;
    }
  }

  _createClass(ConnectionListener, [{
    key: "onOpen",
    value: function onOpen() {}
  }, {
    key: "onClosed",
    value: function onClosed() {}
  }]);

  return ConnectionListener;
}();

module.exports = {
  ConnectionListener: ConnectionListener
};