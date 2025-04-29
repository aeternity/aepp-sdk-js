# Error Handling

This guide shows you how to handle errors originating from the SDK. SDK by default exports the following error classes from file [errors.ts](https://github.com/aeternity/aepp-sdk-js/blob/1cd128798018d98bdd41eff9104442b44b385d46/src/utils/errors.ts)

## Error Hierarchy

```
BaseError
├── ArgumentError
├── IllegalArgumentError
├── ArgumentCountMismatchError
├── InsufficientBalanceError
├── MissingParamError
├── NoSerializerFoundError
├── RequestTimedOutError
├── TxTimedOutError
├── TypeError
├── UnsupportedPlatformError
├── UnsupportedProtocolError
├── NotImplementedError
├── UnsupportedVersionError
├── LogicError
│
├── InternalError
│   └── UnexpectedTsError
│
├── AccountError
│   └── UnavailableAccountError
│
├── AensError
│   ├── AensPointerContextError
│   ├── InsufficientNameFeeError
│   └── InvalidAensNameError
│
├── AeppError
│   ├── InvalidRpcMessageError
│   ├── MissingCallbackError
│   ├── UnAuthorizedAccountError
│   ├── UnknownRpcClientError
│   └── UnsubscribedAccountError
│
├── ChannelError
│   ├── ChannelCallError
│   ├── ChannelConnectionError
│   ├── ChannelPingTimedOutError
│   ├── UnexpectedChannelMessageError
│   ├── ChannelIncomingMessageError
│   └── UnknownChannelStateError
│
├── CompilerError
│   └── InvalidAuthDataError
│
├── ContractError
│   ├── BytecodeMismatchError
│   ├── DuplicateContractError
│   ├── InactiveContractError
│   ├── InvalidMethodInvocationError
│   ├── MissingContractAddressError
│   ├── MissingContractDefError
│   ├── MissingFunctionNameError
│   ├── NodeInvocationError
│   ├── NoSuchContractFunctionError
│   ├── NotPayableFunctionError
│   ├── MissingEventDefinitionError
│   └── AmbiguousEventDefinitionError
│
├── CryptographyError
│   ├── InvalidChecksumError
│   ├── MerkleTreeHashMismatchError
│   ├── MissingNodeInTreeError
│   ├── UnknownNodeLengthError
│   └── UnknownPathNibbleError
│
├── NodeError
│   ├── DuplicateNodeError
│   └── NodeNotFoundError
│
├── TransactionError
│   ├── DecodeError
│   ├── PayloadLengthError
│   ├── DryRunError
│   ├── IllegalBidFeeError
│   ├── InvalidSignatureError
│   ├── InvalidTxError
│   ├── PrefixNotFoundError
│   ├── SchemaNotFoundError
│   ├── TagNotFoundError
│   └── TxNotInChainError
│
├── WalletError
│   ├── AlreadyConnectedError
│   ├── NoWalletConnectedError
│   └── RpcConnectionError
│
├── RpcError
│   ├── RpcInvalidTransactionError
│   ├── RpcRejectedByUserError
│   ├── RpcUnsupportedProtocolError
│   ├── RpcConnectionDenyError
│   ├── RpcNotAuthorizeError
│   ├── RpcPermissionDenyError
│   └── RpcInternalError
```

## Usage

```js
// import required error classes
import {
  AeSdk,
  Node,
  AccountMemory,
  ArgumentError,
  InvalidAensNameError,
} from '@aeternity/aepp-sdk';

// setup
const payerAccount = AccountMemory.generate();
const newUserAccount = AccountMemory.generate();
const node = new Node('https://testnet.aeternity.io');
const aeSdk = new AeSdk({
  nodes: [{ name: 'testnet', instance: node }],
  accounts: [payerAccount, newUserAccount],
});

// catch exceptions
try {
  const spendTxResult = await aeSdk.spend(-1, newUserAccount.address, { onAccount: payerAccount });
} catch (err) {
  if (err instanceof ArgumentError) {
    console.log(`Amount specified is not valid, ${err.message}`);
  } else if (err instanceof InvalidAensNameError) {
    console.log(`Address specified is not valid, ${err.message}`);
  }
}

// using generic error classes
import { AensError, TransactionError, BaseError } from '@aeternity/aepp-sdk';

try {
  const spendTxResult = await aeSdk.spend(1, 'ak_2tv', { onAccount: payerAccount });
} catch (err) {
  if (err instanceof AensError) {
    // address or AENS related errors
  } else if (err instanceof TransactionError) {
    // transaction errors
  } else if (err instanceof BaseError) {
    // match any errors from the SDK
  }
}
```
