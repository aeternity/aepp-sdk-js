var _extends = require("@babel/runtime/helpers/extends");

var _regeneratorRuntime = require("@babel/runtime/regenerator");

var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");

var _Object$getPrototypeOf = require("@babel/runtime/core-js/object/get-prototype-of");

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var _createClass = require("@babel/runtime/helpers/createClass");

var _possibleConstructorReturn = require("@babel/runtime/helpers/possibleConstructorReturn");

var _inherits = require("@babel/runtime/helpers/inherits");

/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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
var _require = require('./utils'),
    createTxParams = _require.createTxParams;

var HttpService = require('./index');
/**
 * Wraps all account related services of the Epoch HTTP API
 */


var Accounts =
/*#__PURE__*/
function (_HttpService) {
  _inherits(Accounts, _HttpService);

  function Accounts(httpClient) {
    var _this;

    _classCallCheck(this, Accounts);

    _this = _possibleConstructorReturn(this, (Accounts.__proto__ || _Object$getPrototypeOf(Accounts)).call(this, httpClient));
    _this.BASE_ENDPOINT = 'account';
    return _this;
  }
  /**
   * Retrieve the public key of the account
   *
   * @returns {Promise<string>}
   */


  _createClass(Accounts, [{
    key: "getPublicKey",
    value: function () {
      var _getPublicKey = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee() {
        var url, _ref, data;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                url = "".concat(this.BASE_ENDPOINT, "/pub-key");
                _context.next = 3;
                return this.client.get(url, {}, true);

              case 3:
                _ref = _context.sent;
                data = _ref.data;
                return _context.abrupt("return", data['pub_key']);

              case 6:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function getPublicKey() {
        return _getPublicKey.apply(this, arguments);
      };
    }()
    /**
     * Retrieves the account balance
     *
     *
     * @returns {Promise<Accounts.getBalance>}
     */

  }, {
    key: "getBalance",
    value: function () {
      var _getBalance = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee2() {
        var _ref2,
            height,
            hash,
            pubKey,
            url,
            _ref3,
            data,
            response,
            _args2 = arguments;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _ref2 = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : {}, height = _ref2.height, hash = _ref2.hash;
                _context2.next = 3;
                return this.getPublicKey();

              case 3:
                pubKey = _context2.sent;
                url = "".concat(this.BASE_ENDPOINT, "/balance/").concat(pubKey);
                _context2.prev = 5;
                _context2.next = 8;
                return this.client.get(url, {
                  height: height,
                  hash: hash
                }, true);

              case 8:
                _ref3 = _context2.sent;
                data = _ref3.data;
                return _context2.abrupt("return", data.balance);

              case 13:
                _context2.prev = 13;
                _context2.t0 = _context2["catch"](5);
                response = _context2.t0.response;
                throw "".concat(pubKey, ": ").concat(response.data.reason);

              case 17:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[5, 13]]);
      }));

      return function getBalance() {
        return _getBalance.apply(this, arguments);
      };
    }()
    /**
     * Get accounts’s transactions included in blocks in the longest chain
     *
     * @param limit
     * @param offset
     * @param txTypes
     * @param excludeTxTypes
     * @returns {Promise<*>}
     */

  }, {
    key: "getTransactions",
    value: function () {
      var _getTransactions = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee3() {
        var _ref5,
            limit,
            offset,
            txTypes,
            excludeTxTypes,
            params,
            pubKey,
            url,
            _ref6,
            data,
            _args3 = arguments;

        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _ref5 = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : {}, limit = _ref5.limit, offset = _ref5.offset, txTypes = _ref5.txTypes, excludeTxTypes = _ref5.excludeTxTypes;
                // TODO tests?
                params = _extends({}, createTxParams({
                  txTypes: txTypes,
                  excludeTxTypes: excludeTxTypes
                }), {
                  limit: limit,
                  offset: offset,
                  'tx_encoding': 'json'
                });
                _context3.next = 4;
                return this.getPublicKey();

              case 4:
                pubKey = _context3.sent;
                _context3.prev = 5;
                url = "".concat(this.BASE_ENDPOINT, "/txs/").concat(pubKey);
                _context3.next = 9;
                return this.client.get(url, params, true);

              case 9:
                _ref6 = _context3.sent;
                data = _ref6.data;
                return _context3.abrupt("return", data.transactions);

              case 14:
                _context3.prev = 14;
                _context3.t0 = _context3["catch"](5);

                if (!(_context3.t0.response.status === 404)) {
                  _context3.next = 20;
                  break;
                }

                throw 'Account has no transactions';

              case 20:
                throw new Error("Status: ".concat(_context3.t0.response.status, " Data: '").concat(_context3.t0.response.data, "'"));

              case 21:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[5, 14]]);
      }));

      return function getTransactions() {
        return _getTransactions.apply(this, arguments);
      };
    }()
  }, {
    key: "getTransactionCount",
    value: function () {
      var _getTransactionCount = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee4() {
        var _ref7,
            txTypes,
            excludeTxTypes,
            options,
            transactions,
            _args4 = arguments;

        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _ref7 = _args4.length > 0 && _args4[0] !== undefined ? _args4[0] : {}, txTypes = _ref7.txTypes, excludeTxTypes = _ref7.excludeTxTypes;
                // This method is a work around to receive a nonce until a
                // proper endpoint is implemented
                // TODO change this when endpoint is provided
                options = {
                  txTypes: txTypes,
                  excludeTxTypes: excludeTxTypes,
                  limit: 100
                };
                _context4.next = 4;
                return this.getTransactions(options);

              case 4:
                transactions = _context4.sent;
                return _context4.abrupt("return", transactions && transactions.length || 0);

              case 6:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function getTransactionCount() {
        return _getTransactionCount.apply(this, arguments);
      };
    }()
  }]);

  return Accounts;
}(HttpService);

module.exports = Accounts;