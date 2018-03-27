var _regeneratorRuntime = require("@babel/runtime/regenerator");

var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");

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
var HttpService = require('./index');

var Oracles =
/*#__PURE__*/
function (_HttpService) {
  _inherits(Oracles, _HttpService);

  function Oracles() {
    _classCallCheck(this, Oracles);

    return _possibleConstructorReturn(this, (Oracles.__proto__ || _Object$getPrototypeOf(Oracles)).apply(this, arguments));
  }

  _createClass(Oracles, [{
    key: "getOracles",
    value: function () {
      var _getOracles = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee() {
        var _ref, data;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.client.get('oracles', {}, true);

              case 2:
                _ref = _context.sent;
                data = _ref.data;
                return _context.abrupt("return", data);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function getOracles() {
        return _getOracles.apply(this, arguments);
      };
    }()
  }, {
    key: "getOracleQuestions",
    value: function () {
      var _getOracleQuestions = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee2(oracleId, from, max) {
        var params, _ref2, data;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                params = {
                  'oracle_pub_key': oracleId,
                  from: from,
                  max: max
                };
                _context2.next = 3;
                return this.client.get('oracle-questions', params, true);

              case 3:
                _ref2 = _context2.sent;
                data = _ref2.data;
                return _context2.abrupt("return", data);

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function getOracleQuestions(_x, _x2, _x3) {
        return _getOracleQuestions.apply(this, arguments);
      };
    }()
    /**
     * Registers an oracle on the blockchain
     *
     * @param queryFormat format of the input
     * @param responseFormat format of the response
     * @param queryFee regular costs to post a query
     * @param ttl relative number of blocks before a query is dropped
     * @param fee the fee to register the oracle
     * @param account
     * @param options
     */

  }, {
    key: "register",
    value: function () {
      var _register = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee3(queryFormat, responseFormat, queryFee, ttl, fee, account, options) {
        var priv, pub, payload, _ref3, data;

        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                priv = account.priv, pub = account.pub;
                payload = {
                  'response_format': responseFormat,
                  'fee': fee,
                  'query_fee': queryFee,
                  'ttl': {
                    'type': 'delta',
                    'value': ttl
                  },
                  'nonce': options && options.nonce,
                  'query_format': queryFormat,
                  'account': pub
                };
                _context3.next = 4;
                return this.client.post("tx/oracle/register", payload);

              case 4:
                _ref3 = _context3.sent;
                data = _ref3.data;
                _context3.next = 8;
                return this.client.tx.sendSigned(data.tx, priv, options);

              case 8:
                return _context3.abrupt("return", data);

              case 9:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function register(_x4, _x5, _x6, _x7, _x8, _x9, _x10) {
        return _register.apply(this, arguments);
      };
    }()
    /**
     * Posts a query to an oracle
     *
     * @param oracleId
     * @param queryFee reward for the oracle to respond to the query
     * @param queryTtl relative number of blocks before the query dies
     * @param responseTtl relative number of blocks before the response dies
     * @param fee transaction fee
     * @param query the query
     * @param privateKey
     * @param options
     */

  }, {
    key: "query",
    value: function () {
      var _query2 = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee4(oracleId, queryFee, queryTtl, responseTtl, fee, _query, account) {
        var options,
            payload,
            _ref4,
            data,
            _args4 = arguments;

        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                options = _args4.length > 7 && _args4[7] !== undefined ? _args4[7] : {};
                payload = {
                  'response_ttl': {
                    'type': 'delta',
                    'value': responseTtl
                  },
                  'sender': options.sender,
                  query: _query,
                  'query_ttl': {
                    'type': 'delta',
                    'value': queryTtl
                  },
                  'fee': fee,
                  'query_fee': queryFee,
                  'nonce': options && options.nonce,
                  'oracle_pubkey': oracleId
                };
                _context4.next = 4;
                return this.client.post("tx/oracle/query", payload);

              case 4:
                _ref4 = _context4.sent;
                data = _ref4.data;
                return _context4.abrupt("return", this.client.tx.sendSigned(data.tx, account.priv, options));

              case 7:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function query(_x11, _x12, _x13, _x14, _x15, _x16, _x17) {
        return _query2.apply(this, arguments);
      };
    }()
    /**
     * Responds to a query
     *
     * @param queryId
     * @param fee a transction fee
     * @param response the response
     * @param privateKey
     */

  }, {
    key: "respond",
    value: function () {
      var _respond = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee5(queryId, fee, response, privateKey) {
        var payload, _ref5, data;

        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                payload = {
                  "oracle": null,
                  'query_id': {},
                  'response': 'response',
                  'fee': 0,
                  'nonce': options && options.nonce
                };
                _context5.next = 3;
                return this.client.post("tx/oracle/respond", payload);

              case 3:
                _ref5 = _context5.sent;
                data = _ref5.data;
                return _context5.abrupt("return", this.client.tx.sendSigned(data.tx, privateKey));

              case 6:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      return function respond(_x18, _x19, _x20, _x21) {
        return _respond.apply(this, arguments);
      };
    }()
  }]);

  return Oracles;
}(HttpService);

module.exports = Oracles;