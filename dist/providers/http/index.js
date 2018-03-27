var _regeneratorRuntime = require("@babel/runtime/regenerator");

var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var _createClass = require("@babel/runtime/helpers/createClass");

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
var axios = require('axios');

var Base = require('./services/base');

var AENS = require('./services/aens');

var Accounts = require('./services/accounts');

var Transactions = require('./services/transactions');

var Oracles = require('./services/oracles');

var Contracts = require('./services/contracts');

var CURRENT_API_VERSION = 'v2';
var DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
  /**
   * Client to interact with the Epoch reference implementation
   */

};

var AeHttpProvider =
/*#__PURE__*/
function () {
  /**
   *
   * @param host Hostname
   * @param port External HTTP port
   * @param version HTTP API version
   * @param secured Use the https protocol if set to `true`
   */
  function AeHttpProvider(host, port) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref$version = _ref.version,
        version = _ref$version === void 0 ? CURRENT_API_VERSION : _ref$version,
        _ref$secured = _ref.secured,
        secured = _ref$secured === void 0 ? false : _ref$secured;

    _classCallCheck(this, AeHttpProvider);

    this.host = host || 'localhost';
    this.port = port || 3003;
    this.version = version;
    this.protocol = secured ? 'https' : 'http';
    this.base = new Base(this);
    this.aens = new AENS(this);
    this.accounts = new Accounts(this);
    this.oracles = new Oracles(this);
    this.tx = new Transactions(this);
    this.contracts = new Contracts(this);
    this.baseUrl = "".concat(this.protocol, "://").concat(this.host, ":").concat(this.port, "/").concat(this.version, "/");
  } // noinspection JSUnusedGlobalSymbols

  /**
   * Call Http `GET` for a given endpoint
   *
   * @param endpoint
   * @param params
   * @returns {Promise<*>}
   */


  _createClass(AeHttpProvider, [{
    key: "get",
    value: function () {
      var _get = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(endpoint, params) {
        var url;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                url = "".concat(this.baseUrl).concat(endpoint);
                _context.next = 3;
                return axios.get(url, {
                  params: params
                });

              case 3:
                return _context.abrupt("return", _context.sent);

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function get(_x, _x2) {
        return _get.apply(this, arguments);
      };
    }()
    /**
     * Call Http `POST` for a given endpoint
     *
     * @param endpoint
     * @param data
     * @param options
     * @returns {Promise<*>}
     */

  }, {
    key: "post",
    value: function () {
      var _post = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee2(endpoint, data, options) {
        var headers, fullUrl;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                headers = options && options.headers || DEFAULT_HEADERS;
                fullUrl = "".concat(this.baseUrl).concat(endpoint);
                _context2.prev = 2;
                _context2.next = 5;
                return axios.post(fullUrl, data, {
                  headers: headers
                });

              case 5:
                return _context2.abrupt("return", _context2.sent);

              case 8:
                _context2.prev = 8;
                _context2.t0 = _context2["catch"](2);
                throw _context2.t0;

              case 11:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[2, 8]]);
      }));

      return function post(_x3, _x4, _x5) {
        return _post.apply(this, arguments);
      };
    }()
  }]);

  return AeHttpProvider;
}();

module.exports = AeHttpProvider;