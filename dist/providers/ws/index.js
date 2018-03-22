var _JSON$stringify = require("@babel/runtime/core-js/json/stringify");

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
// const {AeSubscription} = require('./subscriptions')
var WebSocket;

if (process.browser || typeof window !== 'undefined') {
  WebSocket = window.WebSocket;
} else {
  WebSocket = require('websocket').w3cwebsocket;
}

var Oracles = require('./services/oracles');

var WebSocketProvider =
/*#__PURE__*/
function () {
  function WebSocketProvider(host, port) {
    var _this = this;

    var endpoint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'websocket';

    _classCallCheck(this, WebSocketProvider);

    this._ws = new WebSocket("ws://".concat(host, ":").concat(port, "/").concat(endpoint));
    this.subscriptions = [];
    this.connectionListeners = [];

    this._ws.onmessage = function (message) {
      var data = JSON.parse(message.data);

      _this.subscriptions.forEach(function (sub) {
        if (sub.matches(data)) {
          sub.update(data);
        }
      });
    }; // New block mining events are so fundamental that the subscription
    // should be active by default


    this._ws.onopen = function () {
      // register to mining event
      _this.sendJson({
        "target": "chain",
        "action": "subscribe",
        "payload": {
          "type": "new_block"
        }
      });

      _this.connectionListeners.forEach(function (listener) {
        listener.onOpen();
      });
    };

    this.oracles = new Oracles(this);
  }

  _createClass(WebSocketProvider, [{
    key: "addSubscription",
    value: function addSubscription(subscription) {
      this.subscriptions.push(subscription);
    }
  }, {
    key: "removeSubscription",
    value: function removeSubscription(subscription) {
      this.subscriptions = this.subscriptions.filter(function (x) {
        return x !== subscription;
      });
    }
  }, {
    key: "sendJson",
    value: function sendJson(data) {
      var stringified = _JSON$stringify(data);

      this._ws.send(stringified);
    }
  }, {
    key: "addConnectionListener",
    value: function addConnectionListener(listener) {
      this.connectionListeners.push(listener);
    }
  }, {
    key: "removeConnectionListener",
    value: function removeConnectionListener(listener) {
      this.connectionListeners = this.connectionListeners.filter(function (x) {
        return x !== listener;
      });
    }
  }]);

  return WebSocketProvider;
}();

module.exports = WebSocketProvider;