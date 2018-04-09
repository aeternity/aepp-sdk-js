var _Number$MAX_SAFE_INTEGER = require("@babel/runtime/core-js/number/max-safe-integer");

var _extends = require("@babel/runtime/helpers/extends");

var _JSON$stringify = require("@babel/runtime/core-js/json/stringify");

var _typeof = require("@babel/runtime/helpers/typeof");

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
      _regeneratorRuntime.mark(function _callee3(commitment, fee, account) {
        var options,
            pub,
            priv,
            payload,
            _ref3,
            data,
            _args3 = arguments;

        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                options = _args3.length > 3 && _args3[3] !== undefined ? _args3[3] : {};
                pub = account.pub, priv = account.priv;

                if (!priv) {
                  _context3.next = 13;
                  break;
                }

                payload = {
                  'fee': fee,
                  'commitment': commitment,
                  'nonce': options && options.nonce,
                  'account': pub
                };
                _context3.next = 6;
                return this.client.post('tx/name/preclaim', payload);

              case 6:
                _ref3 = _context3.sent;
                data = _ref3.data;
                _context3.next = 10;
                return this.client.tx.sendSigned(data.tx, priv);

              case 10:
                return _context3.abrupt("return", data);

              case 13:
                throw new Error('Private key must be set');

              case 14:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function preClaim(_x4, _x5, _x6) {
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
      _regeneratorRuntime.mark(function _callee4(name, salt, fee, account) {
        var options,
            pub,
            priv,
            payload,
            _ref4,
            data,
            txHash,
            _args4 = arguments;

        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                options = _args4.length > 4 && _args4[4] !== undefined ? _args4[4] : {};
                pub = account.pub, priv = account.priv;

                if (!(_typeof(priv) !== void 0)) {
                  _context4.next = 14;
                  break;
                }

                payload = {
                  'name_salt': salt,
                  'fee': fee,
                  'name': "nm$".concat(Crypto.encodeBase58Check(Buffer.from(name))),
                  'nonce': options && options.nonce,
                  'account': pub
                };
                _context4.next = 6;
                return this.client.post('tx/name/claim', payload);

              case 6:
                _ref4 = _context4.sent;
                data = _ref4.data;
                txHash = data.tx;
                _context4.next = 11;
                return this.client.tx.sendSigned(txHash, priv);

              case 11:
                return _context4.abrupt("return", data);

              case 14:
                throw new Error('Private key must be set');

              case 15:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function claim(_x7, _x8, _x9, _x10) {
        return _claim.apply(this, arguments);
      };
    }()
    /**
     * Points a name to an address. This address can be either an account or an
     * oracle
     *
     * @param target account or oracle address
     * @param nameHash
     * @param account
     * @param options
     * @returns {Promise<*>}
     */

  }, {
    key: "update",
    value: function () {
      var _update = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee5(target, nameHash, account) {
        var options,
            _options$nameTtl,
            nameTtl,
            _options$ttl,
            ttl,
            _options$fee,
            fee,
            pub,
            priv,
            pointers,
            inputData,
            _ref5,
            data,
            _args5 = arguments;

        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                options = _args5.length > 3 && _args5[3] !== undefined ? _args5[3] : {};
                _options$nameTtl = options.nameTtl, nameTtl = _options$nameTtl === void 0 ? 600000 : _options$nameTtl, _options$ttl = options.ttl, ttl = _options$ttl === void 0 ? 1 : _options$ttl, _options$fee = options.fee, fee = _options$fee === void 0 ? 1 : _options$fee;
                pub = account.pub, priv = account.priv;

                if (!(typeof priv !== 'undefined')) {
                  _context5.next = 23;
                  break;
                }

                if (!target.startsWith('ak')) {
                  _context5.next = 8;
                  break;
                }

                pointers = _JSON$stringify({
                  'account_pubkey': target
                });
                _context5.next = 13;
                break;

              case 8:
                if (!target.startsWith('ok')) {
                  _context5.next = 12;
                  break;
                }

                pointers = _JSON$stringify({
                  'oracle_pubkey': target
                });
                _context5.next = 13;
                break;

              case 12:
                throw 'Target does not match account or oracle key';

              case 13:
                inputData = {
                  'name_hash': nameHash,
                  'name_ttl': nameTtl,
                  ttl: ttl,
                  fee: fee,
                  pointers: pointers,
                  account: pub
                };
                _context5.next = 16;
                return this.client.post('tx/name/update', inputData);

              case 16:
                _ref5 = _context5.sent;
                data = _ref5.data;
                _context5.next = 20;
                return this.client.tx.sendSigned(data.tx, priv);

              case 20:
                return _context5.abrupt("return", data);

              case 23:
                throw new Error('Private key must be set');

              case 24:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      return function update(_x11, _x12, _x13) {
        return _update.apply(this, arguments);
      };
    }()
    /**
     * Transfer ownership of a name
     *
     * @param nameHash
     * @param recipient
     * @param fee
     * @param account
     * @param options
     * @returns {Promise<*>}
     */

  }, {
    key: "transfer",
    value: function () {
      var _transfer = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee6(nameHash, recipient, account) {
        var options,
            _options$fee2,
            fee,
            priv,
            pub,
            payload,
            _ref6,
            data,
            _args6 = arguments;

        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                options = _args6.length > 3 && _args6[3] !== undefined ? _args6[3] : {};
                _options$fee2 = options.fee, fee = _options$fee2 === void 0 ? 1 : _options$fee2;
                priv = account.priv, pub = account.pub;
                payload = {
                  'name_hash': nameHash,
                  'recipient_pubkey': recipient,
                  fee: fee
                };

                if (!priv) {
                  _context6.next = 15;
                  break;
                }

                payload = _extends({}, payload, {
                  nonce: options && options.nonce,
                  account: pub
                });
                _context6.next = 8;
                return this.client.post('tx/name/transfer', payload);

              case 8:
                _ref6 = _context6.sent;
                data = _ref6.data;
                _context6.next = 12;
                return this.client.tx.sendSigned(data.tx, priv);

              case 12:
                return _context6.abrupt("return", data);

              case 15:
                throw new Error('Private key must be set');

              case 16:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      return function transfer(_x14, _x15, _x16) {
        return _transfer.apply(this, arguments);
      };
    }()
    /**
     * Revoke a name
     *
     * @param nameHash
     * @param account
     * @param options
     * @returns {Promise<*>}
     */

  }, {
    key: "revoke",
    value: function () {
      var _revoke = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee7(nameHash, account) {
        var options,
            _options$fee3,
            fee,
            pub,
            priv,
            payload,
            _ref7,
            data,
            _args7 = arguments;

        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                options = _args7.length > 2 && _args7[2] !== undefined ? _args7[2] : {};
                _options$fee3 = options.fee, fee = _options$fee3 === void 0 ? 1 : _options$fee3;
                pub = account.pub, priv = account.priv;
                payload = {
                  'name_hash': nameHash,
                  fee: fee
                };

                if (!priv) {
                  _context7.next = 15;
                  break;
                }

                payload = _extends({}, payload, {
                  nonce: options && options.nonce,
                  account: pub
                });
                _context7.next = 8;
                return this.client.post('tx/name/revoke', payload);

              case 8:
                _ref7 = _context7.sent;
                data = _ref7.data;
                _context7.next = 12;
                return this.client.tx.sendSigned(data.tx, priv);

              case 12:
                return _context7.abrupt("return", data);

              case 15:
                throw new Error('Private key must be set');

              case 16:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      return function revoke(_x17, _x18) {
        return _revoke.apply(this, arguments);
      };
    }()
    /**
     * Executes the complete two-step process for claiming a name
     *
     * @param domain
     * @param preClaimFee
     * @param claimFee
     * @param account
     * @param options
     * @returns {Promise<*>}
     */

  }, {
    key: "fullClaim",
    value: function () {
      var _fullClaim = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee8(domain, preClaimFee, claimFee, account) {
        var options,
            salt,
            commitment,
            data,
            _args8 = arguments;
        return _regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                options = _args8.length > 4 && _args8[4] !== undefined ? _args8[4] : {};
                salt = options && options.salt;

                if (typeof salt === 'undefined') {
                  salt = Math.floor(Math.random() * Math.floor(_Number$MAX_SAFE_INTEGER));
                } // get a commitment hash


                _context8.next = 5;
                return this.getCommitmentHash(domain, salt);

              case 5:
                commitment = _context8.sent;
                _context8.next = 8;
                return this.preClaim(commitment, preClaimFee, account, options);

              case 8:
                data = _context8.sent;
                _context8.next = 11;
                return this.client.tx.waitForTransaction(data['tx_hash']);

              case 11:
                _context8.next = 13;
                return this.claim(domain, salt, claimFee, account, options);

              case 13:
                return _context8.abrupt("return", _context8.sent);

              case 14:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      return function fullClaim(_x19, _x20, _x21, _x22) {
        return _fullClaim.apply(this, arguments);
      };
    }()
  }]);

  return AENS;
}(HttpService);

module.exports = AENS;