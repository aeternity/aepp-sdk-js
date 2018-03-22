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
    key: "register",
    value: function () {
      var _register = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(queryFormat, responseFormat, queryFee, ttl, fee) {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function register(_x, _x2, _x3, _x4, _x5) {
        return _register.apply(this, arguments);
      };
    }()
  }, {
    key: "query",
    value: function () {
      var _query3 = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee2(oracleId, queryFee, queryTtl, responseTtl, fee, _query) {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function query(_x6, _x7, _x8, _x9, _x10, _x11) {
        return _query3.apply(this, arguments);
      };
    }()
  }, {
    key: "getOracles",
    value: function () {
      var _getOracles = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee3() {
        var _ref, data;

        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.client.get('oracles', {}, true);

              case 2:
                _ref = _context3.sent;
                data = _ref.data;
                return _context3.abrupt("return", data);

              case 5:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
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
      _regeneratorRuntime.mark(function _callee4(oracleId, from, max) {
        var params, _ref2, data;

        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                params = {
                  'oracle_pub_key': oracleId,
                  from: from,
                  max: max
                };
                _context4.next = 3;
                return this.client.get('oracle-questions', params, true);

              case 3:
                _ref2 = _context4.sent;
                data = _ref2.data;
                return _context4.abrupt("return", data);

              case 6:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function getOracleQuestions(_x12, _x13, _x14) {
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
     * @param privateKey
     * @param options
     */

  }, {
    key: "register",
    value: function () {
      var _register2 = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee5(queryFormat, responseFormat, queryFee, ttl, fee, privateKey, options) {
        var payload, _ref3, data;

        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.t0 = responseFormat;
                _context5.t1 = fee;
                _context5.t2 = queryFee;
                _context5.t3 = {
                  'type': 'delta',
                  'value': ttl
                };
                _context5.t4 = options && options.nonce;
                _context5.t5 = queryFormat;
                _context5.t6 = options && options.account;

                if (_context5.t6) {
                  _context5.next = 11;
                  break;
                }

                _context5.next = 10;
                return this.client.accounts.getPublicKey();

              case 10:
                _context5.t6 = _context5.sent;

              case 11:
                _context5.t7 = _context5.t6;
                payload = {
                  'response_format': _context5.t0,
                  'fee': _context5.t1,
                  'query_fee': _context5.t2,
                  'ttl': _context5.t3,
                  'nonce': _context5.t4,
                  'query_format': _context5.t5,
                  'account': _context5.t7
                };
                _context5.next = 15;
                return this.client.post("tx/oracle/register", payload);

              case 15:
                _ref3 = _context5.sent;
                data = _ref3.data;
                return _context5.abrupt("return", this.client.tx.sendSigned(data.tx, privateKey, options));

              case 18:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      return function register(_x15, _x16, _x17, _x18, _x19, _x20, _x21) {
        return _register2.apply(this, arguments);
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
      var _query4 = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee6(oracleId, queryFee, queryTtl, responseTtl, fee, _query2, privateKey) {
        var options,
            payload,
            _ref4,
            data,
            _args6 = arguments;

        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                options = _args6.length > 7 && _args6[7] !== undefined ? _args6[7] : {};
                _context6.t0 = {
                  'type': 'delta',
                  'value': responseTtl
                };
                _context6.t1 = options.sender;

                if (_context6.t1) {
                  _context6.next = 7;
                  break;
                }

                _context6.next = 6;
                return this.client.accounts.getPublicKey();

              case 6:
                _context6.t1 = _context6.sent;

              case 7:
                _context6.t2 = _context6.t1;
                _context6.t3 = _query2;
                _context6.t4 = {
                  'type': 'delta',
                  'value': queryTtl
                };
                _context6.t5 = fee;
                _context6.t6 = queryFee;
                _context6.t7 = options && options.nonce;
                _context6.t8 = oracleId;
                payload = {
                  'response_ttl': _context6.t0,
                  'sender': _context6.t2,
                  'query': _context6.t3,
                  'query_ttl': _context6.t4,
                  'fee': _context6.t5,
                  'query_fee': _context6.t6,
                  'nonce': _context6.t7,
                  'oracle_pubkey': _context6.t8
                };
                _context6.next = 17;
                return this.client.post("tx/oracle/query", payload);

              case 17:
                _ref4 = _context6.sent;
                data = _ref4.data;
                return _context6.abrupt("return", this.client.tx.sendSigned(data.tx, privateKey, options));

              case 20:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      return function query(_x22, _x23, _x24, _x25, _x26, _x27, _x28) {
        return _query4.apply(this, arguments);
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
      _regeneratorRuntime.mark(function _callee7(queryId, fee, response, privateKey) {
        var payload, _ref5, data;

        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                payload = {
                  "oracle": null,
                  'query_id': {},
                  'response': 'response',
                  'fee': 0,
                  'nonce': options && options.nonce
                };
                _context7.next = 3;
                return this.client.post("tx/oracle/respond", payload);

              case 3:
                _ref5 = _context7.sent;
                data = _ref5.data;
                return _context7.abrupt("return", this.client.tx.sendSigned(data.tx, privateKey));

              case 6:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      return function respond(_x29, _x30, _x31, _x32) {
        return _respond.apply(this, arguments);
      };
    }()
  }]);

  return Oracles;
}(HttpService);

module.exports = Oracles;