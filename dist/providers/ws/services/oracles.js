var _regeneratorRuntime = require("@babel/runtime/regenerator");

var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");

var _Promise = require("@babel/runtime/core-js/promise");

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
var _require = require('../types'),
    actions = _require.actions,
    origins = _require.origins,
    targets = _require.targets;

var _require2 = require('../subscriptions'),
    AeSubscription = _require2.AeSubscription;

var Oracles =
/*#__PURE__*/
function () {
  /**
   *
   */
  function Oracles(wsProvider) {
    _classCallCheck(this, Oracles);

    this.wsProvider = wsProvider;
  }
  /**
   * Registers an oracle on the blockchain
   *
   * @param queryFormat format of the input
   * @param responseFormat format of the response
   * @param queryFee regular costs to post a query
   * @param ttl relative number of blocks before a query is dropped
   * @param fee the fee to register the oracle
   */


  _createClass(Oracles, [{
    key: "register",
    value: function register(queryFormat, responseFormat, queryFee, ttl, fee) {
      var _this = this;

      var data = {
        'target': targets.ORACLE,
        'action': actions.REGISTER,
        'payload': {
          'type': 'OracleRegisterTxObject',
          'vsn': 1,
          'query_format': queryFormat,
          'response_format': responseFormat,
          'query_fee': queryFee,
          'ttl': {
            'type': 'delta',
            'value': ttl
          },
          'fee': fee
        }
      };
      var promise = new _Promise(function (resolve, reject) {
        var subscription = new AeSubscription({
          pendingOracleId: undefined,
          matches: function matches(data) {
            return data.action === actions.MINED_BLOCK || data.action === actions.NEW_BLOCK || data.action === actions.REGISTER && data.origin === origins.ORACLE;
          },
          update: function update(data) {
            if ([actions.MINED_BLOCK, actions.NEW_BLOCK].includes(data.action)) {
              if (_this.pendingOracleId) {
                _this.wsProvider.removeSubscription(subscription);

                _this.subscribe(_this.pendingOracleId);

                resolve(_this.pendingOracleId);
              }
            } else {
              _this.pendingOracleId = data.payload['oracle_id'];
            }
          }
        });

        _this.wsProvider.addSubscription(subscription);
      });
      this.wsProvider.sendJson(data);
      return promise;
    }
    /**
     * Subscribes to an oracle
     *
     * @param oracleId Identifies the oracle on the blockchain
     */

  }, {
    key: "subscribe",
    value: function subscribe(oracleId) {
      var data = {
        'target': targets.CHAIN,
        'action': actions.SUBSCRIBE,
        'payload': {
          'type': 'oracle_query',
          'oracle_id': oracleId
        }
      };
      this.wsProvider.sendJson(data);
      return data;
    }
    /**
     * Posts a query to an oracle
     *
     * @param oracleId
     * @param queryFee reward for the oracle to respond to the query
     * @param queryTtl relative number of blocks before the query dies
     * @param responseTtl relative number of blocks before the response dies
     * @param fee transaction fee
     * @param query the query
     */

  }, {
    key: "query",
    value: function () {
      var _query2 = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(oracleId, queryFee, queryTtl, responseTtl, fee, _query) {
        var _this2 = this;

        var data, queryAcknowledged, queryId, receivedResponse;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                data = {
                  'target': targets.ORACLE,
                  'action': actions.QUERY,
                  'payload': {
                    'type': 'OracleQueryTxObject',
                    'vsn': 1,
                    'oracle_pubkey': oracleId,
                    'query_fee': queryFee,
                    'query_ttl': {
                      'type': 'delta',
                      'value': queryTtl
                    },
                    'response_ttl': {
                      'type': 'delta',
                      'value': responseTtl
                    },
                    'fee': fee,
                    'query': typeof _query.toString !== 'undefined' ? _query.toString() : _query
                  } // First specify to resovle the `query_id` once the subscription
                  // has been notified

                };
                queryAcknowledged = new _Promise(function (resolve, reject) {
                  var subscription = new AeSubscription({
                    action: actions.QUERY,
                    origin: origins.ORACLE,
                    update: function update(data) {
                      var queryId = data.payload['query_id'];

                      _this2.wsProvider.removeSubscription(subscription);

                      resolve(queryId);
                    }
                  });

                  _this2.wsProvider.addSubscription(subscription);
                }); // then send the query data

                this.wsProvider.sendJson(data); // wait for the query being ackowledged

                _context.next = 5;
                return queryAcknowledged;

              case 5:
                queryId = _context.sent;
                // then specify to resolve the query payload once the
                // subscription has been notified
                receivedResponse = new _Promise(function (resolve, reject) {
                  var subscription = new AeSubscription({
                    action: actions.NEW_ORACLE_RESPONSE,
                    origin: origins.CHAIN,
                    update: function update(data) {
                      _this2.wsProvider.removeSubscription(subscription);

                      resolve(data.payload);
                    }
                  });

                  _this2.wsProvider.addSubscription(subscription);
                }); // subscribe to the query response

                this.subscribeToResponse(queryId);
                return _context.abrupt("return", receivedResponse);

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function query(_x, _x2, _x3, _x4, _x5, _x6) {
        return _query2.apply(this, arguments);
      };
    }()
    /**
     * Subscribe to the event when the query gets answered
     *
     * @param queryId
     */

  }, {
    key: "subscribeToResponse",
    value: function subscribeToResponse(queryId) {
      var data = {
        'target': targets.CHAIN,
        'action': actions.SUBSCRIBE,
        'payload': {
          'type': 'oracle_response',
          'query_id': queryId
        }
      };
      this.wsProvider.sendJson(data);
      return data;
    }
    /**
     * Responds to a query
     *
     * @param queryId
     * @param fee a transction fee
     * @param response the response
     */

  }, {
    key: "respond",
    value: function respond(queryId, fee, response) {
      var data = {
        'target': targets.ORACLE,
        'action': actions.RESPONSE,
        'payload': {
          'type': 'OracleResponseTxObject',
          'vsn': 1,
          'query_id': queryId,
          'fee': fee,
          'response': response
        }
      };
      this.wsProvider.sendJson(data);
      return data;
    }
  }, {
    key: "setResolver",
    value: function setResolver(callback) {
      if (this.currentResolver) {
        this.wsProvider.removeSubscription(this.currentResolver);
      }

      var resolver = new AeSubscription(new AeSubscription({
        action: actions.NEW_ORACLE_QUERY,
        origin: origins.CHAIN,
        update: function update(data) {
          callback(data.payload);
        }
      }));
      this.wsProvider.addSubscription(resolver);
      this.currentResolver = resolver;
    }
  }]);

  return Oracles;
}();

module.exports = Oracles;