var _Number$MAX_SAFE_INTEGER = require("@babel/runtime/core-js/number/max-safe-integer");

var _extends = require("@babel/runtime/helpers/extends");

var _JSON$stringify = require("@babel/runtime/core-js/json/stringify");

var _regeneratorRuntime = require("@babel/runtime/regenerator");

var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");

var _Object$getPrototypeOf = require("@babel/runtime/core-js/object/get-prototype-of");

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var _createClass = require("@babel/runtime/helpers/createClass");

var _possibleConstructorReturn = require("@babel/runtime/helpers/possibleConstructorReturn");

var _inherits = require("@babel/runtime/helpers/inherits");

/*
  ISC License (ISC)
  Copyright (c) 2018 aeternity developers

  Permission to use, copy, modify, and/or distribute this software for
  any purpose with or without fee is hereby granted, provided that the
  above copyright notice and this permission notice appear in all
  copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
  WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
  AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
  DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR
  PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
  TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.

*/
var HttpService = require('./index');

var Crypto = require('../../../utils/crypto');
/**
 * Wraps all AENS related services of the Epoch HTTP API
 *
 * {@link https://github.com/aeternity/protocol/blob/master/AENS.md}
 *
 */


var AENS =
/*#__PURE__*/
function (_HttpService) {
  _inherits(AENS, _HttpService);

  function AENS() {
    _classCallCheck(this, AENS);

    return _possibleConstructorReturn(this, (AENS.__proto__ || _Object$getPrototypeOf(AENS)).apply(this, arguments));
  }

  _createClass(AENS, [{
    key: "getCommitmentHash",

    /**
     * Retrieves the commitment hash for the AENS pre-claim commitment
     *
     * @param name The name to be claimed. Must end with `.aet` or `.test`
     * @param salt An int64 value to be used as salt for the hashing function.
     *             The caller should make sure that the salt is random and can not
     *             be guessed by any miner.
     * @returns {Promise<string>}
     */
    value: function () {
      var _getCommitmentHash = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(name, salt) {
        var _ref, data;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.client.get('commitment-hash', {
                  name: name,
                  salt: salt
                });

              case 2:
                _ref = _context.sent;
                data = _ref.data;
                return _context.abrupt("return", data.commitment);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function getCommitmentHash(_x, _x2) {
        return _getCommitmentHash.apply(this, arguments);
      };
    }()
    /**
     * Retrieves all public information about a claimed name
     *
     * @param name
     * @returns {Promise<*>}
     */

  }, {
    key: "getName",
    value: function () {
      var _getName = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee2(name) {
        var _ref2, data;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                _context2.next = 3;
                return this.client.get('name', {
                  name: name
                });

              case 3:
                _ref2 = _context2.sent;
                data = _ref2.data;
                return _context2.abrupt("return", data);

              case 8:
                _context2.prev = 8;
                _context2.t0 = _context2["catch"](0);
                return _context2.abrupt("return", '');

              case 11:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 8]]);
      }));

      return function getName(_x3) {
        return _getName.apply(this, arguments);
      };
    }()
    /**
     * Pre-claims a name on the block-chain. This operation is the first step
     * of the two-step name claiming process which is completed by
     * {@link AENS#claim}. To protect claimers from malicious nodes stealing
     * claims, a name is represented by a hash of the name and a salt
     * {@link AENS#getCommitmentHash}.
     *
     * @param commitment
     * @param fee
     * @param options
     * @returns {Promise<*>}
     */

  }, {
    key: "preClaim",
    value: function () {
      var _preClaim = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee3(commitment, fee) {
        var options,
            privateKey,
            payload,
            _ref3,
            data,
            _args3 = arguments;

        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                options = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : {};
                privateKey = options && options.privateKey;

                if (!privateKey) {
                  _context3.next = 22;
                  break;
                }

                _context3.t0 = fee;
                _context3.t1 = commitment;
                _context3.t2 = options && options.nonce;
                _context3.t3 = options && options.account;

                if (_context3.t3) {
                  _context3.next = 11;
                  break;
                }

                _context3.next = 10;
                return this.client.accounts.getPublicKey();

              case 10:
                _context3.t3 = _context3.sent;

              case 11:
                _context3.t4 = _context3.t3;
                payload = {
                  'fee': _context3.t0,
                  'commitment': _context3.t1,
                  'nonce': _context3.t2,
                  'account': _context3.t4
                };
                _context3.next = 15;
                return this.client.post('tx/name/preclaim', payload);

              case 15:
                _ref3 = _context3.sent;
                data = _ref3.data;
                _context3.next = 19;
                return this.client.tx.sendSigned(data.tx, privateKey);

              case 19:
                return _context3.abrupt("return", data);

              case 22:
                throw new Error('Private key must be set');

              case 23:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function preClaim(_x4, _x5) {
        return _preClaim.apply(this, arguments);
      };
    }()
    /**
     * Claims a name on the blockchain that has previously been pre-claimed.
     *
     * @param name
     * @param salt the same salt as used for the pre-claim step
     * @param fee
     * @param options
     * @returns {Promise<*>} resolves the name as a hashed form
     */

  }, {
    key: "claim",
    value: function () {
      var _claim = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee4(name, salt, fee) {
        var options,
            privateKey,
            payload,
            _ref4,
            data,
            txHash,
            _args4 = arguments;

        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                options = _args4.length > 3 && _args4[3] !== undefined ? _args4[3] : {};
                privateKey = options && options.privateKey;

                if (!privateKey) {
                  _context4.next = 24;
                  break;
                }

                _context4.t0 = salt;
                _context4.t1 = fee;
                _context4.t2 = "nm$".concat(Crypto.encodeBase58Check(Buffer.from(name)));
                _context4.t3 = options && options.nonce;
                _context4.t4 = options && options.account;

                if (_context4.t4) {
                  _context4.next = 12;
                  break;
                }

                _context4.next = 11;
                return this.client.accounts.getPublicKey();

              case 11:
                _context4.t4 = _context4.sent;

              case 12:
                _context4.t5 = _context4.t4;
                payload = {
                  'name_salt': _context4.t0,
                  'fee': _context4.t1,
                  'name': _context4.t2,
                  'nonce': _context4.t3,
                  'account': _context4.t5
                };
                _context4.next = 16;
                return this.client.post('tx/name/claim', payload);

              case 16:
                _ref4 = _context4.sent;
                data = _ref4.data;
                txHash = data.tx;
                _context4.next = 21;
                return this.client.tx.sendSigned(txHash, privateKey);

              case 21:
                return _context4.abrupt("return", data);

              case 24:
                return _context4.abrupt("return");

              case 26:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function claim(_x6, _x7, _x8) {
        return _claim.apply(this, arguments);
      };
    }()
    /**
     * Points a name to an address. This address can be either an account or an
     * oracle
     *
     * @param target account or oracle address
     * @param nameHash
     * @param nameTtl
     * @param ttl
     * @param fee
     * @returns {Promise<*>}
     */

  }, {
    key: "update",
    value: function () {
      var _update = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee5(target, nameHash, _ref5) {
        var _ref5$nameTtl, nameTtl, _ref5$ttl, ttl, _ref5$fee, fee, privateKey, account, pointers, inputData, _ref6, data;

        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _ref5$nameTtl = _ref5.nameTtl, nameTtl = _ref5$nameTtl === void 0 ? 600000 : _ref5$nameTtl, _ref5$ttl = _ref5.ttl, ttl = _ref5$ttl === void 0 ? 1 : _ref5$ttl, _ref5$fee = _ref5.fee, fee = _ref5$fee === void 0 ? 1 : _ref5$fee, privateKey = _ref5.privateKey, account = _ref5.account;

                if (!(typeof privateKey !== 'undefined')) {
                  _context5.next = 32;
                  break;
                }

                if (!target.startsWith('ak')) {
                  _context5.next = 6;
                  break;
                }

                pointers = _JSON$stringify({
                  'account_pubkey': target
                });
                _context5.next = 11;
                break;

              case 6:
                if (!target.startsWith('ok')) {
                  _context5.next = 10;
                  break;
                }

                pointers = _JSON$stringify({
                  'oracle_pubkey': target
                });
                _context5.next = 11;
                break;

              case 10:
                throw 'Target does not match account or oracle key';

              case 11:
                _context5.t0 = nameHash;
                _context5.t1 = nameTtl;
                _context5.t2 = ttl;
                _context5.t3 = fee;
                _context5.t4 = pointers;
                _context5.t5 = account;

                if (_context5.t5) {
                  _context5.next = 21;
                  break;
                }

                _context5.next = 20;
                return this.client.accounts.getPublicKey();

              case 20:
                _context5.t5 = _context5.sent;

              case 21:
                _context5.t6 = _context5.t5;
                inputData = {
                  'name_hash': _context5.t0,
                  'name_ttl': _context5.t1,
                  ttl: _context5.t2,
                  fee: _context5.t3,
                  pointers: _context5.t4,
                  account: _context5.t6
                };
                _context5.next = 25;
                return this.client.post('tx/name/update', inputData);

              case 25:
                _ref6 = _context5.sent;
                data = _ref6.data;
                _context5.next = 29;
                return this.client.tx.sendSigned(data.tx, privateKey);

              case 29:
                return _context5.abrupt("return", data);

              case 32:
                throw new Error('Private key must be set');

              case 33:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      return function update(_x9, _x10, _x11) {
        return _update.apply(this, arguments);
      };
    }()
    /**
     * Transfer ownership of a name
     *
     * @param nameHash
     * @param recipient
     * @param fee
     * @param options
     * @returns {Promise<*>}
     */

  }, {
    key: "transfer",
    value: function () {
      var _transfer = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee6(nameHash, recipient) {
        var fee,
            options,
            payload,
            privateKey,
            _ref7,
            data,
            _args6 = arguments;

        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                fee = _args6.length > 2 && _args6[2] !== undefined ? _args6[2] : 1;
                options = _args6.length > 3 && _args6[3] !== undefined ? _args6[3] : {};
                payload = {
                  'name_hash': nameHash,
                  'recipient_pubkey': recipient,
                  fee: fee
                };
                privateKey = options && options.privateKey;

                if (!privateKey) {
                  _context6.next = 26;
                  break;
                }

                _context6.t0 = _extends;
                _context6.t1 = {};
                _context6.t2 = payload;
                _context6.t3 = options && options.nonce;
                _context6.t4 = options && options.account;

                if (_context6.t4) {
                  _context6.next = 14;
                  break;
                }

                _context6.next = 13;
                return this.client.accounts.getPublicKey();

              case 13:
                _context6.t4 = _context6.sent;

              case 14:
                _context6.t5 = _context6.t4;
                _context6.t6 = {
                  nonce: _context6.t3,
                  account: _context6.t5
                };
                payload = (0, _context6.t0)(_context6.t1, _context6.t2, _context6.t6);
                _context6.next = 19;
                return this.client.post('tx/name/transfer', payload);

              case 19:
                _ref7 = _context6.sent;
                data = _ref7.data;
                _context6.next = 23;
                return this.client.tx.sendSigned(data.tx, privateKey);

              case 23:
                return _context6.abrupt("return", data);

              case 26:
                throw new Error('Private key must be set');

              case 27:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      return function transfer(_x12, _x13) {
        return _transfer.apply(this, arguments);
      };
    }()
    /**
     * Revoke a name
     *
     * @param nameHash
     * @param fee
     * @param options
     * @returns {Promise<*>}
     */

  }, {
    key: "revoke",
    value: function () {
      var _revoke = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee7(nameHash) {
        var fee,
            options,
            payload,
            privateKey,
            _ref8,
            data,
            _args7 = arguments;

        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                fee = _args7.length > 1 && _args7[1] !== undefined ? _args7[1] : 1;
                options = _args7.length > 2 && _args7[2] !== undefined ? _args7[2] : {};
                payload = {
                  'name_hash': nameHash,
                  fee: fee
                };
                privateKey = options && options.privateKey;

                if (!privateKey) {
                  _context7.next = 26;
                  break;
                }

                _context7.t0 = _extends;
                _context7.t1 = {};
                _context7.t2 = payload;
                _context7.t3 = options && options.nonce;
                _context7.t4 = options && options.account;

                if (_context7.t4) {
                  _context7.next = 14;
                  break;
                }

                _context7.next = 13;
                return this.client.accounts.getPublicKey();

              case 13:
                _context7.t4 = _context7.sent;

              case 14:
                _context7.t5 = _context7.t4;
                _context7.t6 = {
                  nonce: _context7.t3,
                  account: _context7.t5
                };
                payload = (0, _context7.t0)(_context7.t1, _context7.t2, _context7.t6);
                _context7.next = 19;
                return this.client.post('tx/name/revoke', payload);

              case 19:
                _ref8 = _context7.sent;
                data = _ref8.data;
                _context7.next = 23;
                return this.client.tx.sendSigned(data.tx, privateKey);

              case 23:
                return _context7.abrupt("return", data);

              case 26:
                throw new Error('Private key must be set');

              case 27:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      return function revoke(_x14) {
        return _revoke.apply(this, arguments);
      };
    }()
    /**
     * Executes the complete two-step process for claiming a name
     *
     * @param domain
     * @param preClaimFee
     * @param claimFee
     * @param options
     * @returns {Promise<*>}
     */

  }, {
    key: "fullClaim",
    value: function () {
      var _fullClaim = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee8(domain, preClaimFee, claimFee) {
        var options,
            salt,
            commitment,
            _args8 = arguments;
        return _regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                options = _args8.length > 3 && _args8[3] !== undefined ? _args8[3] : {};
                salt = options && options.salt;

                if (typeof salt === 'undefined') {
                  salt = Math.floor(Math.random() * Math.floor(_Number$MAX_SAFE_INTEGER));
                } // get a commitment hash


                _context8.next = 5;
                return this.getCommitmentHash(domain, salt);

              case 5:
                commitment = _context8.sent;
                _context8.next = 8;
                return this.preClaim(commitment, preClaimFee, options);

              case 8:
                _context8.next = 10;
                return this.client.base.waitNBlocks(1);

              case 10:
                _context8.next = 12;
                return this.claim(domain, salt, claimFee, options);

              case 12:
                return _context8.abrupt("return", _context8.sent);

              case 13:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      return function fullClaim(_x15, _x16, _x17) {
        return _fullClaim.apply(this, arguments);
      };
    }()
  }]);

  return AENS;
}(HttpService);

module.exports = AENS;