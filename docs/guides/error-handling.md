# Error Handling

This guide shows you how to handle errors originating from the SDK. SDK by default exports the following error classes from file [errors.ts](https://github.com/aeternity/aepp-sdk-js/blob/develop/src/utils/errors.ts)

## Error Hierarchy

```
BaseError
│   ArgumentError
│   IllegalArgumentError
│   ArgumentCountMismatchError
│   InsufficientBalanceError
│   InvalidDenominationError
│   InvalidNameError
│   MissingParamError
│   NoBrowserFoundError
│   NoSerializerFoundError
│   RequestTimedOutError
│   TxTimedOutError
│   TypeError
│   UnsupportedPlatformError
│   UnsupportedProtocolError
│   NotImplementedError
│   UnsupportedVersionError
│   InternalError
│
└───AccountError
│   │   InvalidKeypairError
│   │   UnavailableAccountError
│
└───AensError
│   │   AensPointerContextError
│   │   InsufficientNameFeeError
│   │   InvalidAensNameError
│
└───AeppError
│   │   DuplicateCallbackError
│   │   InvalidRpcMessageError
│   │   MissingCallbackError
│   │   UnAuthorizedAccountError
│   │   UnknownRpcClientError
│   │   UnsubscribedAccountError
│
└───ChannelError
│   │   ChannelCallError
│   │   ChannelConnectionError
│   │   ChannelPingTimedOutError
│   │   UnexpectedChannelMessageError
│   │   UnknownChannelStateError
│
└───CompilerError
│   │   InvalidAuthDataError
│
└───ContractError
│   │   BytecodeMismatchError
│   │   DuplicateContractError
│   │   InactiveContractError
│   │   InvalidMethodInvocationError
│   │   MissingContractAddressError
│   │   MissingContractDefError
│   │   MissingFunctionNameError
│   │   NodeInvocationError
│   │   NoSuchContractFunctionError
│   │   NotPayableFunctionError
│   │   MissingEventDefinitionError
│   │   AmbiguousEventDefinitionError
│
└───CryptographyError
│   │   InvalidChecksumError
│   │   DerivationError
│   │   InvalidPasswordError
│   │   MerkleTreeHashMismatchError
│   │   MissingNodeInTreeError
│   │   UnknownNodeLengthError
│   │   UnknownPathNibbleError
│
└───NodeError
│   │   DisconnectedError
│   │   DuplicateNodeError
│   │   NodeNotFoundError
│
└───TransactionError
│   │   DecodeError
│   │   EncodeError
│   │   PayloadLengthError
│   │   DryRunError
│   │   IllegalBidFeeError
│   │   InvalidSignatureError
│   │   InvalidTxError
│   │   InvalidTxParamsError
│   │   NoDefaultAensPointerError
│   │   PrefixNotFoundError
│   │   SchemaNotFoundError
│   │   TagNotFoundError
│   │   TxNotInChainError
│   │   UnknownTxError
│   │   UnsupportedABIversionError
│   │   UnsupportedVMversionError
│
└̌───WalletError
│   │   AlreadyConnectedError
│   │   MessageDirectionError
│   │   NoWalletConnectedError
│   │   RpcConnectionError
```

## Usage

```js
// import required error classes
const {
  Universal,
  Node,
  MemoryAccount,
  generateKeyPair,
  InvalidTxParamsError,
  InvalidAensNameError
} = require('@aeternity/aepp-sdk')

// setup
const NODE_URL = 'https://testnet.aeternity.io'
const PAYER_ACCOUNT_KEYPAIR = generateKeyPair()
const NEW_USER_KEYPAIR = generateKeyPair()

const payerAccount = MemoryAccount({ keypair: PAYER_ACCOUNT_KEYPAIR })
const newUserAccount = MemoryAccount({ keypair: NEW_USER_KEYPAIR })
const node = await Node({ url: NODE_URL })
const aeSdk = await Universal({
  nodes: [{ name: 'testnet', instance: node }],
  accounts: [payerAccount, newUserAccount]
})

// catch exceptions
try {
  const spendTxResult = await aeSdk.spend(-1, await newUserAccount.address(), { onAccount: payerAccount})
} catch(err) {
  if(err instanceof InvalidTxParamsError){
    console.log(`Amount specified is not valid, ${err.message}`)
  } else if(err instanceof InvalidAensNameError) {
    console.log(`Address specified is not valid, ${err.message}`)
  }
}

// using generic error classes
const {AensError, TransactionError, BaseError } = require('@aeternity/aepp-sdk')

try {
  const spendTxResult = await aeSdk.spend(1, "ak_2tv", { onAccount: payerAccount})
} catch(err) {
  if(err instanceof AensError) {
    // address or AENS related errors
  } else if(err instanceof TransactionError) {
    // transaction errors
  } else if(err instanceof BaseError) {
    // match any errors from the SDK
  }
}
```
