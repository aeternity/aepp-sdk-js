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
var _require = require('./utils'),
    createTxParams = _require.createTxParams,
    createTxRangeParams = _require.createTxRangeParams;

var HttpService = require('./index');

var Crypto = require('../../../utils/crypto');

var Transactions =
/*#__PURE__*/
function (_HttpService) {
  _inherits(Transactions, _HttpService);

  function Transactions() {
    _classCallCheck(this, Transactions);

    return _possibleConstructorReturn(this, (Transactions.__proto__ || _Object$getPrototypeOf(Transactions)).apply(this, arguments));
  }

  _createClass(Transactions, [{
    key: "getPendingList",

    /**
     * Get transactions in the mempool
     *
     * @returns {Promise<*>}
     */
    value: function () {
      var _getPendingList = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee() {
        var _ref, data;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.client.get('transactions');

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

      return function getPendingList() {
        return _getPendingList.apply(this, arguments);
      };
    }()
    /**
     * Get a block transactions count by hash
     *
     * @param hash
     * @param txTypes
     * @param excludeTxTypes
     * @returns {Promise<number>}
     */

  }, {
    key: "getCountByHash",
    value: function () {
      var _getCountByHash = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee2(hash, _ref2) {
        var txTypes, excludeTxTypes, params, endpoint, _ref3, data;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                txTypes = _ref2.txTypes, excludeTxTypes = _ref2.excludeTxTypes;
                params = createTxParams({
                  txTypes: txTypes,
                  excludeTxTypes: excludeTxTypes
                });
                endpoint = "/block/txs/count/hash/".concat(hash);
                _context2.next = 5;
                return this.client.get(endpoint, params, true);

              case 5:
                _ref3 = _context2.sent;
                data = _ref3.data;
                return _context2.abrupt("return", data.count);

              case 8:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function getCountByHash(_x, _x2) {
        return _getCountByHash.apply(this, arguments);
      };
    }()
    /**
     * Get a block transactions count by height
     *
     * @param height
     * @param txTypes
     * @param excludeTxTypes
     * @returns {Promise<number>}
     */

  }, {
    key: "getCountByHeight",
    value: function () {
      var _getCountByHeight = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee3(height, _ref4) {
        var txTypes, excludeTxTypes, params, endpoint, _ref5, data;

        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                txTypes = _ref4.txTypes, excludeTxTypes = _ref4.excludeTxTypes;
                params = createTxParams({
                  txTypes: txTypes,
                  excludeTxTypes: excludeTxTypes
                });
                endpoint = "/block/txs/count/height/".concat(height);
                _context3.next = 5;
                return this.client.get(endpoint, params, true);

              case 5:
                _ref5 = _context3.sent;
                data = _ref5.data;
                return _context3.abrupt("return", data.count);

              case 8:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function getCountByHeight(_x3, _x4) {
        return _getCountByHeight.apply(this, arguments);
      };
    }()
    /**
     * Get a transaction by index in the block by hash
     *
     * @param blockHash
     * @param txIdx
     * @returns {Promise<*>}
     */

  }, {
    key: "getFromBlockHash",
    value: function () {
      var _getFromBlockHash = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee4(blockHash, txIdx) {
        var endpoint, _ref6, data;

        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                endpoint = "block/tx/hash/".concat(blockHash, "/").concat(txIdx);
                _context4.next = 3;
                return this.client.get(endpoint, {
                  'tx_encoding': 'json'
                }, true);

              case 3:
                _ref6 = _context4.sent;
                data = _ref6.data;
                return _context4.abrupt("return", data);

              case 6:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function getFromBlockHash(_x5, _x6) {
        return _getFromBlockHash.apply(this, arguments);
      };
    }()
    /**
     * Get a transaction by index in the block by height
     *
     * @param height
     * @param txIdx
     * @returns {Promise<*>}
     */

  }, {
    key: "getFromBlockHeight",
    value: function () {
      var _getFromBlockHeight = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee5(height, txIdx) {
        var endpoint, _ref7, data;

        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                endpoint = "block/tx/height/".concat(height, "/").concat(txIdx);
                _context5.next = 3;
                return this.client.get(endpoint, {
                  'tx_encoding': 'json'
                }, true);

              case 3:
                _ref7 = _context5.sent;
                data = _ref7.data;
                return _context5.abrupt("return", data);

              case 6:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      return function getFromBlockHeight(_x7, _x8) {
        return _getFromBlockHeight.apply(this, arguments);
      };
    }()
    /**
     * Get a transaction by index in the latest block
     *
     * @param txIdx
     * @returns {Promise<*>}
     */

  }, {
    key: "getFromLatest",
    value: function () {
      var _getFromLatest = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee6(txIdx) {
        var url, _ref8, data;

        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                url = "block/tx/latest/".concat(txIdx);
                _context6.next = 3;
                return this.client.get(url, {
                  'tx_encoding': 'json'
                }, true);

              case 3:
                _ref8 = _context6.sent;
                data = _ref8.data;
                return _context6.abrupt("return", data);

              case 6:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      return function getFromLatest(_x9) {
        return _getFromLatest.apply(this, arguments);
      };
    }()
    /**
     * Get transactions list from a block range by hash
     *
     * @param from
     * @param to
     * @param txTypes
     * @param excludeTxTypes
     * @returns {Promise<*>}
     */

  }, {
    key: "filterByHashRange",
    value: function () {
      var _filterByHashRange = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee7(from, to, _ref9) {
        var txTypes, excludeTxTypes, url, params, _ref10, data;

        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                txTypes = _ref9.txTypes, excludeTxTypes = _ref9.excludeTxTypes;
                url = "block/txs/list/hash";
                params = createTxRangeParams(from, to, {
                  txTypes: txTypes,
                  excludeTxTypes: excludeTxTypes
                });
                _context7.next = 5;
                return this.client.get(url, params, true);

              case 5:
                _ref10 = _context7.sent;
                data = _ref10.data;
                return _context7.abrupt("return", data);

              case 8:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      return function filterByHashRange(_x10, _x11, _x12) {
        return _filterByHashRange.apply(this, arguments);
      };
    }()
    /**
     * Get transactions list from a block range by height
     *
     * @param from
     * @param to
     * @param txTypes
     * @param excludeTxTypes
     * @returns {Promise<*>}
     */

  }, {
    key: "filterByHeightRange",
    value: function () {
      var _filterByHeightRange = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee8(from, to, _ref11) {
        var txTypes, excludeTxTypes, endpoint, params, _ref12, data;

        return _regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                txTypes = _ref11.txTypes, excludeTxTypes = _ref11.excludeTxTypes;
                endpoint = 'block/txs/list/height';
                params = createTxRangeParams(from, to, {
                  txTypes: txTypes,
                  excludeTxTypes: excludeTxTypes
                });
                _context8.next = 5;
                return this.client.get(endpoint, params, true);

              case 5:
                _ref12 = _context8.sent;
                data = _ref12.data;
                return _context8.abrupt("return", data);

              case 8:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      return function filterByHeightRange(_x13, _x14, _x15) {
        return _filterByHeightRange.apply(this, arguments);
      };
    }()
  }, {
    key: "send",
    value: function () {
      var _send = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee9(tx) {
        var body, _ref13, data;

        return _regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                body = {
                  tx: tx
                };
                _context9.next = 3;
                return this.client.post('tx', body);

              case 3:
                _ref13 = _context9.sent;
                data = _ref13.data;
                return _context9.abrupt("return", data);

              case 6:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      return function send(_x16) {
        return _send.apply(this, arguments);
      };
    }()
  }, {
    key: "sendSigned",
    value: function () {
      var _sendSigned = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee10(txHash, privateKey) {
        var options,
            binaryKey,
            base58CheckTx,
            binaryTx,
            signature,
            unpackedSignedTx,
            _args10 = arguments;
        return _regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                options = _args10.length > 2 && _args10[2] !== undefined ? _args10[2] : {};
                // Get binary from hex variant of the private key
                binaryKey = Buffer.from(privateKey, 'hex'); // Split the base58Check part of the transaction

                base58CheckTx = txHash.split('$')[1]; // ... and sign the binary create_contract transaction

                binaryTx = Crypto.decodeBase58Check(base58CheckTx);
                signature = Crypto.sign(binaryTx, binaryKey); // the signed tx deserializer expects a 4-tuple:
                // <tag, version, signatures_array, binary_tx>

                unpackedSignedTx = [Buffer.from([11]), Buffer.from([options.version || 1]), [Buffer.from(signature)], binaryTx];
                return _context10.abrupt("return", this.client.tx.send(Crypto.encodeTx(unpackedSignedTx)));

              case 7:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      return function sendSigned(_x17, _x18) {
        return _sendSigned.apply(this, arguments);
      };
    }()
  }, {
    key: "getTransaction",
    value: function () {
      var _getTransaction = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee11(txHash) {
        var _ref14, data;

        return _regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.next = 2;
                return this.client.get("tx/".concat(txHash), {
                  'tx_encoding': 'json'
                });

              case 2:
                _ref14 = _context11.sent;
                data = _ref14.data;
                return _context11.abrupt("return", data.transaction);

              case 5:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      return function getTransaction(_x19) {
        return _getTransaction.apply(this, arguments);
      };
    }()
  }, {
    key: "waitForTransaction",
    value: function () {
      var _waitForTransaction = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee13(txHash) {
        var _this = this;

        var timeout,
            intervalTimeout,
            maxAttempts,
            _args13 = arguments;
        return _regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                timeout = _args13.length > 1 && _args13[1] !== undefined ? _args13[1] : 60 * 60 * 1000;
                intervalTimeout = 2000;
                maxAttempts = Math.floor(timeout / intervalTimeout);
                _context13.next = 5;
                return new _Promise(function (resolve, reject) {
                  var attempts = 0;
                  var interval = setInterval(
                  /*#__PURE__*/
                  _asyncToGenerator(
                  /*#__PURE__*/
                  _regeneratorRuntime.mark(function _callee12() {
                    var transaction, blockHeight;
                    return _regeneratorRuntime.wrap(function _callee12$(_context12) {
                      while (1) {
                        switch (_context12.prev = _context12.next) {
                          case 0:
                            if (!(++attempts < maxAttempts)) {
                              _context12.next = 21;
                              break;
                            }

                            _context12.t0 = console;
                            _context12.t1 = "\rWaiting for ".concat(txHash, " on ");
                            _context12.next = 5;
                            return _this.client.base.getHeight();

                          case 5:
                            _context12.t2 = _context12.sent;
                            _context12.t3 = _context12.t1.concat.call(_context12.t1, _context12.t2);

                            _context12.t0.log.call(_context12.t0, _context12.t3);

                            _context12.prev = 8;
                            _context12.next = 11;
                            return _this.getTransaction(txHash);

                          case 11:
                            transaction = _context12.sent;
                            _context12.next = 17;
                            break;

                          case 14:
                            _context12.prev = 14;
                            _context12.t4 = _context12["catch"](8);
                            return _context12.abrupt("return", reject(_context12.t4));

                          case 17:
                            blockHeight = transaction['block_height'];

                            if (blockHeight !== -1) {
                              // TODO integrate into proper logging
                              console.log("\rTx has been mined in ".concat(blockHeight));
                              clearInterval(interval);
                              resolve(blockHeight);
                            }

                            _context12.next = 23;
                            break;

                          case 21:
                            clearInterval(interval);
                            reject(new Error("Timeout reached after ".concat(attempts, " attempts")));

                          case 23:
                          case "end":
                            return _context12.stop();
                        }
                      }
                    }, _callee12, this, [[8, 14]]);
                  })), intervalTimeout);
                });

              case 5:
                return _context13.abrupt("return", _context13.sent);

              case 6:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      return function waitForTransaction(_x20) {
        return _waitForTransaction.apply(this, arguments);
      };
    }()
  }]);

  return Transactions;
}(HttpService);

module.exports = Transactions;