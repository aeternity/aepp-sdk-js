var _Object$getPrototypeOf = require("@babel/runtime/core-js/object/get-prototype-of");

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var _createClass = require("@babel/runtime/helpers/createClass");

var _possibleConstructorReturn = require("@babel/runtime/helpers/possibleConstructorReturn");

var _inherits = require("@babel/runtime/helpers/inherits");

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
var EventEmitter = require('events').EventEmitter;

var WebSocketProxy =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(WebSocketProxy, _EventEmitter);

  function WebSocketProxy(host, port, endpoint) {
    var _this;

    _classCallCheck(this, WebSocketProxy);

    _this = _possibleConstructorReturn(this, (WebSocketProxy.__proto__ || _Object$getPrototypeOf(WebSocketProxy)).call(this));
    _this.wsProvider = new WebSocket("ws://".concat(host, ":").concat(port, "/").concat(endpoint));
    _this.readyState = _this.wsProvider.readyState;

    _this.wsProvider.onclose = function () {
      _this.emit('close');

      _this.readyState = WebSocket.CLOSED;
    };

    _this.wsProvider.onopen = function () {
      _this.emit('open');

      _this.readyState = WebSocket.OPEN;
    };

    _this.wsProvider.onerror = function (error) {
      return _this.emit('error', error);
    };

    _this.wsProvider.onmessage = function (message) {
      return _this.emit('message', message.data);
    };

    return _this;
  }

  _createClass(WebSocketProxy, [{
    key: "send",
    value: function send(message) {
      this.wsProvider.send(message);
    }
  }, {
    key: "close",
    value: function close() {
      this.wsProvider.close();
    }
  }]);

  return WebSocketProxy;
}(EventEmitter);

module.exports = WebSocketProxy;