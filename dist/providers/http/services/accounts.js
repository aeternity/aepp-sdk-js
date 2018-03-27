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
   * Retrieves the account balance
   *
   *
   * @returns {Promise<Accounts.getBalance>}
   */


  _createClass(Accounts, [{
    key: "getBalance",
    value: function () {
      var _getBalance = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(account) {
        var _ref,
            height,
            hash,
            url,
            _ref2,
            data,
            response,
            _args = arguments;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _ref = _args.length > 1 && _args[1] !== undefined ? _args[1] : {}, height = _ref.height, hash = _ref.hash;
                url = "".concat(this.BASE_ENDPOINT, "/balance/").concat(account);
                _context.prev = 2;
                _context.next = 5;
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
      _regeneratorRuntime.mark(function _callee2(account) {
        var _ref4,
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
      _regeneratorRuntime.mark(function _callee3() {
        var _ref6,
            txTypes,
            excludeTxTypes,
            options,
            transactions,
            _args3 = arguments;

        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _ref6 = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : {}, txTypes = _ref6.txTypes, excludeTxTypes = _ref6.excludeTxTypes;
                // This method is a work around to receive a nonce until a
                // proper endpoint is implemented
                // TODO change this when endpoint is provided
                options = {
                  txTypes: txTypes,
                  excludeTxTypes: excludeTxTypes,
                  limit: 100
                };
                _context3.next = 4;
                return this.getTransactions(options);

              case 4:
                transactions = _context3.sent;
                return _context3.abrupt("return", transactions && transactions.length || 0);

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function getTransactionCount() {
        return _getTransactionCount.apply(this, arguments);
      };
    }()
  }]);

  return Accounts;
}(HttpService);

module.exports = Accounts;