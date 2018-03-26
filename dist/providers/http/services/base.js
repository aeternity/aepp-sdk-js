var _Promise = require("@babel/runtime/core-js/promise");

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
var HttpService = require('./index');
/**
 * Wraps the core functionalities of the Epoch HTTP API
 */


var Base =
/*#__PURE__*/
function (_HttpService) {
  _inherits(Base, _HttpService);

  function Base() {
    _classCallCheck(this, Base);

    return _possibleConstructorReturn(this, (Base.__proto__ || _Object$getPrototypeOf(Base)).apply(this, arguments));
  }

  _createClass(Base, [{
    key: "getHeight",

    /**
     * Retrieve the current block height
     *
     * @returns {Promise<void>}
     */
    value: function () {
      var _getHeight = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee() {
        var result;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.client.get('top');

              case 2:
                result = _context.sent;
                return _context.abrupt("return", result.data.height);

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function getHeight() {
        return _getHeight.apply(this, arguments);
      };
    }()
    /**
     * Wait until the block with the given height has been mined
     *
     * @param height
     * @param intervalTimeout specifies the interval time in miliseconds
     * @returns {Promise<any>}
     */

  }, {
    key: "waitForBlock",
    value: function () {
      var _waitForBlock = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee3(height) {
        var _this = this;

        var intervalTimeout,
            _args3 = arguments;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                intervalTimeout = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : 5000;
                _context3.next = 3;
                return new _Promise(function (resolve, reject) {
                  var interval = setInterval(
                  /*#__PURE__*/
                  _asyncToGenerator(
                  /*#__PURE__*/
                  _regeneratorRuntime.mark(function _callee2() {
                    var currentHeight;
                    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            _context2.next = 2;
                            return _this.getHeight();

                          case 2:
                            currentHeight = _context2.sent;

                            if (currentHeight >= height) {
                              clearInterval(interval);
                              resolve(currentHeight);
                            }

                          case 4:
                          case "end":
                            return _context2.stop();
                        }
                      }
                    }, _callee2, this);
                  })), intervalTimeout);
                });

              case 3:
                return _context3.abrupt("return", _context3.sent);

              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function waitForBlock(_x) {
        return _waitForBlock.apply(this, arguments);
      };
    }()
    /**
     * Wait until a given amount of blocks has been mined
     *
     * @param delta
     * @returns {Promise<any>}
     */

  }, {
    key: "waitNBlocks",
    value: function () {
      var _waitNBlocks = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee4(delta) {
        var currentHeight, resultBlock;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.getHeight();

              case 2:
                currentHeight = _context4.sent;
                _context4.next = 5;
                return this.waitForBlock(currentHeight + delta);

              case 5:
                resultBlock = _context4.sent;
                return _context4.abrupt("return", resultBlock);

              case 7:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function waitNBlocks(_x2) {
        return _waitNBlocks.apply(this, arguments);
      };
    }()
    /**
     * Send a given amount of tokens to a recipient
     *
     * @param recipient
     * @param amount
     * @param fee
     * @param options
     * @returns {Promise<*>}
     */

  }, {
    key: "spend",
    value: function () {
      var _spend = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee5(recipient, amount, fee, options) {
        var data;
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!(options && options.privateKey)) {
                  _context5.next = 9;
                  break;
                }

                _context5.next = 3;
                return this.client.base.getSpendTx(recipient, amount, options);

              case 3:
                data = _context5.sent;
                _context5.next = 6;
                return this.client.tx.sendSigned(data.tx, options.privateKey, options);

              case 6:
                return _context5.abrupt("return", data);

              case 9:
                throw new Error('Private key is not set');

              case 10:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      return function spend(_x3, _x4, _x5, _x6) {
        return _spend.apply(this, arguments);
      };
    }()
    /**
     * Get a block by height
     *
     * @param height
     * @returns {Promise<*>}
     */

  }, {
    key: "getBlockByHeight",
    value: function () {
      var _getBlockByHeight = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee6(height) {
        var _ref2, data;

        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.client.get('block-by-height', {
                  height: height
                }, false);

              case 2:
                _ref2 = _context6.sent;
                data = _ref2.data;
                return _context6.abrupt("return", data);

              case 5:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      return function getBlockByHeight(_x7) {
        return _getBlockByHeight.apply(this, arguments);
      };
    }()
    /**
     * Get a block by hash
     *
     * @param hash
     * @returns {Promise<*>}
     */

  }, {
    key: "getBlockByHash",
    value: function () {
      var _getBlockByHash = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee7(hash) {
        var _ref3, data;

        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this.client.get('block-by-hash', {
                  hash: hash
                }, false);

              case 2:
                _ref3 = _context7.sent;
                data = _ref3.data;
                return _context7.abrupt("return", data);

              case 5:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      return function getBlockByHash(_x8) {
        return _getBlockByHash.apply(this, arguments);
      };
    }()
    /**
     * Get the genesis block
     *
     * @param encoding
     * @returns {Promise<*>}
     */

  }, {
    key: "getGenesisBlock",
    value: function () {
      var _getGenesisBlock = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee8(encoding) {
        var params, _ref4, data;

        return _regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                params = {
                  'tx_encoding': encoding
                };
                _context8.next = 3;
                return this.client.get('block/genesis', params, true);

              case 3:
                _ref4 = _context8.sent;
                data = _ref4.data;
                return _context8.abrupt("return", data);

              case 6:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      return function getGenesisBlock(_x9) {
        return _getGenesisBlock.apply(this, arguments);
      };
    }()
    /**
     * Get the block being mined
     *
     * @param encoding
     * @returns {Promise<*>}
     */

  }, {
    key: "getPendingBlock",
    value: function () {
      var _getPendingBlock = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee9(encoding) {
        var params, _ref5, data;

        return _regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                params = {
                  'tx_encoding': encoding
                };
                _context9.next = 3;
                return this.client.get('block/pending', params, true);

              case 3:
                _ref5 = _context9.sent;
                data = _ref5.data;
                return _context9.abrupt("return", data);

              case 6:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      return function getPendingBlock(_x10) {
        return _getPendingBlock.apply(this, arguments);
      };
    }()
    /**
     * Get node’s version
     *
     * @param name
     * @returns {Promise<*>}
     */

  }, {
    key: "getVersion",
    value: function () {
      var _getVersion = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee10() {
        var _ref6, data;

        return _regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return this.client.get('version');

              case 2:
                _ref6 = _context10.sent;
                data = _ref6.data;
                return _context10.abrupt("return", data);

              case 5:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      return function getVersion() {
        return _getVersion.apply(this, arguments);
      };
    }()
    /**
     * Get node info
     *
     * @param name
     * @returns {Promise<*>}
     */

  }, {
    key: "getInfo",
    value: function () {
      var _getInfo = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee11() {
        var _ref7, data;

        return _regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.next = 2;
                return this.client.get('info');

              case 2:
                _ref7 = _context11.sent;
                data = _ref7.data;
                return _context11.abrupt("return", data);

              case 5:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      return function getInfo() {
        return _getInfo.apply(this, arguments);
      };
    }()
    /**
     * Get all users’ balances
     * @returns {Promise<*>}
     */

  }, {
    key: "getBalances",
    value: function () {
      var _getBalances = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee12() {
        var _ref8, data;

        return _regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return this.client.get('balances');

              case 2:
                _ref8 = _context12.sent;
                data = _ref8.data;
                return _context12.abrupt("return", data);

              case 5:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      return function getBalances() {
        return _getBalances.apply(this, arguments);
      };
    }()
  }, {
    key: "getSpendTx",
    value: function () {
      var _getSpendTx = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee13(recipient, amount) {
        var options,
            payload,
            _ref9,
            data,
            _args13 = arguments;

        return _regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                options = _args13.length > 2 && _args13[2] !== undefined ? _args13[2] : {};
                payload = {
                  'amount': amount,
                  'sender': options && options.sender,
                  // || await this.client.accounts.getPublicKey (),
                  'fee': options && options.fee || 1,
                  'recipient_pubkey': recipient,
                  'nonce': options && options.nonce
                };
                _context13.prev = 2;
                _context13.next = 5;
                return this.client.post('tx/spend', payload);

              case 5:
                _ref9 = _context13.sent;
                data = _ref9.data;
                return _context13.abrupt("return", data);

              case 10:
                _context13.prev = 10;
                _context13.t0 = _context13["catch"](2);
                console.log(_context13.t0);

              case 13:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this, [[2, 10]]);
      }));

      return function getSpendTx(_x11, _x12) {
        return _getSpendTx.apply(this, arguments);
      };
    }()
  }]);

  return Base;
}(HttpService);

module.exports = Base;