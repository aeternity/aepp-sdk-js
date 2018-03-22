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
   * @param internalPort Internal HTTP port
   * @param version HTTP API version
   * @param secured Use the https protocol if set to `true`
   */
  function AeHttpProvider(host, port) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref$internalPort = _ref.internalPort,
        internalPort = _ref$internalPort === void 0 ? 3103 : _ref$internalPort,
        _ref$version = _ref.version,
        version = _ref$version === void 0 ? CURRENT_API_VERSION : _ref$version,
        _ref$secured = _ref.secured,
        secured = _ref$secured === void 0 ? false : _ref$secured;

    _classCallCheck(this, AeHttpProvider);

    this.host = host || 'localhost';
    this.port = port || 3003;
    this.internalPort = internalPort;
    this.version = version;
    this.protocol = secured ? 'https' : 'http';
    this.base = new Base(this);
    this.aens = new AENS(this);
    this.accounts = new Accounts(this);
    this.oracles = new Oracles(this);
    this.tx = new Transactions(this);
    this.contracts = new Contracts(this); // This pattern might change during the alpha phase as the topic
    // internal vs. external ports still has to be discussed.
    // Until then the base url can be set programmatically via `setBaseUrl`

    this.baseUrls = {
      external: "".concat(this.protocol, "://").concat(this.host, ":").concat(this.port, "/").concat(this.version, "/"),
      internal: "".concat(this.protocol, "://").concat(this.host, ":").concat(this.internalPort, "/").concat(this.version, "/")
    };
  }
  /**
   * Return the base url
   *
   * @param internal Use an internal endpoint route
   * @returns {string}
   */


  _createClass(AeHttpProvider, [{
    key: "getBaseUrl",
    value: function getBaseUrl(internal) {
      return this.baseUrls[internal ? 'internal' : 'external'];
    }
    /**
     * Set base url programmatically
     *
     * @param url
     * @param internal if `true` the url represents the internal base url
     */

  }, {
    key: "setBaseUrl",
    value: function setBaseUrl(url, internal) {
      this.baseUrls[internal ? 'internal' : 'external'] = url;
    } // noinspection JSUnusedGlobalSymbols

    /**
     * Call Http `GET` for a given endpoint
     *
     * @param endpoint
     * @param params
     * @param internal
     * @returns {Promise<*>}
     */

  }, {
    key: "get",
    value: function () {
      var _get = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(endpoint, params, internal) {
        var url;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                url = "".concat(this.getBaseUrl(internal)).concat(endpoint);
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

      return function get(_x, _x2, _x3) {
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
        var internal, headers, fullUrl;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                internal = options && options.internal;
                headers = options && options.headers || DEFAULT_HEADERS;
                fullUrl = "".concat(this.getBaseUrl(internal)).concat(endpoint);
                _context2.prev = 3;
                _context2.next = 6;
                return axios.post(fullUrl, data, {
                  headers: headers
                });

              case 6:
                return _context2.abrupt("return", _context2.sent);

              case 9:
                _context2.prev = 9;
                _context2.t0 = _context2["catch"](3);
                throw _context2.t0;

              case 12:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[3, 9]]);
      }));

      return function post(_x4, _x5, _x6) {
        return _post.apply(this, arguments);
      };
    }()
  }]);

  return AeHttpProvider;
}();

module.exports = AeHttpProvider;