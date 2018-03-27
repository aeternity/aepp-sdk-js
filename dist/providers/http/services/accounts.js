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
<<<<<<< HEAD
   * Retrieves the account balance
   *
   *
   * @returns {Promise<Accounts.getBalance>}
=======
   * Retrieve the public key of the account
   *
   * @returns {Promise<string>}
>>>>>>> feature/call-contracts
   */


  _createClass(Accounts, [{
<<<<<<< HEAD
=======
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
>>>>>>> feature/call-contracts
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

              case 5:
                _ref2 = _context.sent;
                data = _ref2.data;
                return _context.abrupt("return", data.balance);

              case 10:
                _context.prev = 10;
                _context.t0 = _context["catch"](2);
                response = _context.t0.response;
                throw "".concat(account, ": ").concat(response.data.reason);

              case 14:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[2, 10]]);
      }));

      return function getBalance(_x) {
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
            url,
            _ref5,
            data,
            _args2 = arguments;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _ref4 = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : {}, limit = _ref4.limit, offset = _ref4.offset, txTypes = _ref4.txTypes, excludeTxTypes = _ref4.excludeTxTypes;
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
                _context2.prev = 2;
                url = "".concat(this.BASE_ENDPOINT, "/txs/").concat(account);
                _context2.next = 6;
                return this.client.get(url, params);

              case 6:
                _ref5 = _context2.sent;
                data = _ref5.data;
                return _context2.abrupt("return", data.transactions);

              case 11:
                _context2.prev = 11;
                _context2.t0 = _context2["catch"](2);

                if (!(_context2.t0.response.status === 404)) {
                  _context2.next = 17;
                  break;
                }

                throw new Error('Account has no transactions');

              case 17:
                throw new Error("Status: ".concat(_context2.t0.response.status, " Data: '").concat(_context2.t0.response.data, "'"));

              case 18:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[2, 11]]);
      }));

      return function getTransactions(_x2) {
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