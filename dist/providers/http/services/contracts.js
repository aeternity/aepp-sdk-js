var _regeneratorRuntime = require("@babel/runtime/regenerator");

var _extends = require("@babel/runtime/helpers/extends");

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

var _require = require('./utils'),
    createTxCallParams = _require.createTxCallParams;

var Contracts =
/*#__PURE__*/
function (_HttpService) {
  _inherits(Contracts, _HttpService);

  function Contracts() {
    _classCallCheck(this, Contracts);

    return _possibleConstructorReturn(this, (Contracts.__proto__ || _Object$getPrototypeOf(Contracts)).apply(this, arguments));
  }

  _createClass(Contracts, [{
    key: "getCreateTx",
    value: function () {
      var _getCreateTx = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(code, owner) {
        var options,
            contractTxData,
            _ref,
            data,
            _args = arguments;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options = _args.length > 2 && _args[2] !== undefined ? _args[2] : {};
                contractTxData = _extends({}, createTxCallParams(options), {
                  owner: owner,
                  'vm_version': options.vmVersion || 1,
                  code: code,
                  'call_data': options.callData || '',
                  deposit: options.deposit || 4
                });
                _context.next = 4;
                return this.client.post('tx/contract/create', contractTxData);

              case 4:
                _ref = _context.sent;
                data = _ref.data;
                return _context.abrupt("return", data);

              case 7:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function getCreateTx(_x, _x2) {
        return _getCreateTx.apply(this, arguments);
      };
    }()
  }, {
    key: "getCallTxWithData",
    value: function () {
      var _getCallTxWithData = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee2(callData, contractPubKey) {
        var options,
            payload,
            _ref2,
            data,
            _args2 = arguments;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                options = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : {};
                payload = _extends({}, createTxCallParams(options), {
                  'caller': options.caller,
                  'vm_version': options.vmVersion || 1,
                  'call_data': callData,
                  'contract': contractPubKey
                });
                _context2.next = 4;
                return this.client.post('tx/contract/call', payload);

              case 4:
                _ref2 = _context2.sent;
                data = _ref2.data;
                return _context2.abrupt("return", data);

              case 7:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function getCallTxWithData(_x3, _x4) {
        return _getCallTxWithData.apply(this, arguments);
      };
    }()
  }, {
    key: "getCallTx",
    value: function () {
      var _getCallTx = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee3(contractAddress, callData) {
        var options,
            payload,
            _ref3,
            data,
            _args3 = arguments;

        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                options = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : {};
                payload = _extends({}, createTxCallParams(options), {
                  'caller': options.caller,
                  'vm_version': options.vmVersion || 1,
                  'call_data': callData,
                  'contract': contractAddress
                });
                _context3.next = 4;
                return this.client.post('tx/contract/call', payload);

              case 4:
                _ref3 = _context3.sent;
                data = _ref3.data;
                return _context3.abrupt("return", data);

              case 7:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function getCallTx(_x5, _x6) {
        return _getCallTx.apply(this, arguments);
      };
    }()
  }, {
    key: "compile",
    value: function () {
      var _compile = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee4(code, options) {
        var inputData, _ref4, data;

        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                inputData = {
                  code: code,
                  options: options
                };
                _context4.next = 3;
                return this.client.post('contract/compile', inputData);

              case 3:
                _ref4 = _context4.sent;
                data = _ref4.data;
                return _context4.abrupt("return", data.bytecode);

              case 6:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function compile(_x7, _x8) {
        return _compile.apply(this, arguments);
      };
    }()
  }, {
<<<<<<< HEAD
    key: "callStatic",
    value: function () {
      var _callStatic = _asyncToGenerator(
=======
    key: "call",
    value: function () {
      var _call = _asyncToGenerator(
>>>>>>> 91b014ba5374c364edc4208c01da471dbf0bc943
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee5(abi, code, func, arg) {
        var inputData, _ref5, data;

        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                inputData = {
                  abi: abi,
                  code: code,
                  'function': func,
                  arg: arg
                };
                _context5.next = 3;
                return this.client.post('contract/call', inputData);

              case 3:
                _ref5 = _context5.sent;
                data = _ref5.data;
                return _context5.abrupt("return", data.out);

              case 6:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

<<<<<<< HEAD
      return function callStatic(_x9, _x10, _x11, _x12) {
        return _callStatic.apply(this, arguments);
=======
      return function call(_x9, _x10, _x11, _x12) {
        return _call.apply(this, arguments);
>>>>>>> 91b014ba5374c364edc4208c01da471dbf0bc943
      };
    }()
  }, {
    key: "encodeCallData",
    value: function () {
      var _encodeCallData = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee6(abi, code, func) {
        var args,
            body,
            _ref6,
            data,
            _args6 = arguments;

        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                args = _args6.length > 3 && _args6[3] !== undefined ? _args6[3] : [];
                body = {
                  code: code,
                  abi: abi,
                  'function': func,
                  'arg': args.join(',')
                };
                _context6.next = 4;
                return this.client.post('contract/encode-calldata', body);

              case 4:
                _ref6 = _context6.sent;
                data = _ref6.data;
                return _context6.abrupt("return", data.calldata);

              case 7:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      return function encodeCallData(_x13, _x14, _x15) {
        return _encodeCallData.apply(this, arguments);
      };
    }()
  }, {
    key: "deployContract",
    value: function () {
      var _deployContract = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee7(code, account) {
        var options,
            data,
            _args7 = arguments;
        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                options = _args7.length > 2 && _args7[2] !== undefined ? _args7[2] : {};
                _context7.next = 3;
                return this.getCreateTx(code, account.pub, options);

              case 3:
                data = _context7.sent;
                _context7.next = 6;
                return this.client.tx.sendSigned(data.tx, account.priv, options);

              case 6:
                return _context7.abrupt("return", data);

              case 7:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      return function deployContract(_x16, _x17) {
        return _deployContract.apply(this, arguments);
      };
    }()
  }, {
    key: "getComputeCallTx",
    value: function () {
      var _getComputeCallTx = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee8(contract, func, args) {
        var options,
            body,
            _ref7,
            data,
            _args8 = arguments;

        return _regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                options = _args8.length > 3 && _args8[3] !== undefined ? _args8[3] : {};
                body = {
                  'gas_price': options.gasPrice || 1,
                  'caller': options.caller,
                  'vm_version': options.vmVersion || 1,
                  'amount': options.amount || 0,
                  'contract': contract,
                  'fee': options.fee || 1,
                  'function': func,
                  'gas': options.gas || 1,
                  'arguments': args,
                  'nonce': options.nonce
                };
                _context8.next = 4;
                return this.client.post('tx/contract/call/compute', body);

              case 4:
                _ref7 = _context8.sent;
                data = _ref7.data;
                return _context8.abrupt("return", data);

              case 7:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      return function getComputeCallTx(_x18, _x19, _x20) {
        return _getComputeCallTx.apply(this, arguments);
      };
    }()
  }]);

  return Contracts;
}(HttpService);

module.exports = Contracts;