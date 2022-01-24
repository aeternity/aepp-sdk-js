# Error Handling

This guide shows you how to handle errors originating from the SDK. SDK by default exports the following error classes from file [errors.ts](../../src/utils/errors.ts)

## Error Hierarchy

```
AeError
│   IllegalArgumentError
│   IllegalArgumentError
│   InsufficientBalanceError
│   InvalidDenominationError
│   InvalidHashError
│   InvalidNameError
│   MissingParamError
│   NoBrowserFoundError
│   NoSerializerFoundError
│   RequestTimedOutError
│   TxTimedOutError
│   TypeError
│   UnknownHashClassError
│   UnsupportedPlatformError
│   UnsupportedProtocolError
│
└───AccountError
│   │   InvalidKeypairError
│   │   UnavailableAccountError
│
└───AensError
│   │   AensNameNotFoundError
│   │   AensPointerContextError
│   │   InsufficientNameFeeError
│   │   InvalidAensNameError
│
└───AeppError
│   │   DuplicateCallbackError
│   │   InvalidRpcMessage
│   │   MissingCallbackError
│   │   UnAuthorizedAccountError
│   │   UnknownRpcClientError
│   │   UnsubscribedAccountError
│
└───ChannelError
│   │   ChannelCallError
│   │   ChannelConnectionError
│   │   ChannelInitializationError
│   │   ChannelPingTimedOutError
│   │   UnexpectedChannelMessageError
│   │   UnknownChannelStateError
│
└───CompilerError
│   │   UnsupportedCompilerError
│   │   InvalidAuthDataError
│
└───ContractError
│   │   BytecodeMismatchError
│   │   DuplicateContractError
│   │   InactiveContractError
│   │   InvalidEventSchemaError
│   │   InvalidMethodInvocationError
│   │   MissingContractAddressError
│   │   MissingContractDefError
│   │   MissingFunctionNameError
│   │   NodeInvocationError
│   │   NoSuchContractError
│   │   NoSuchContractFunctionError
│   │   NotPayableFunctionError
│   │   UnknownCallReturnTypeError
│
└───CryptographyError
│   │   InvalidChecksumError
│   │   InvalidDerivationPathError
│   │   InvalidKeyError
│   │   InvalidMnemonicError
│   │   InvalidPasswordError
│   │   MerkleTreeHashMismatchError
│   │   MessageLimitError
│   │   MissingNodeInTreeError
│   │   NoSuchAlgorithmError
│   │   NotHardenedSegmentError
│   │   UnknownNodeLengthError
│   │   UnknownPathNibbleError
│   │   UnsupportedChildIndexError
│   │   UnsupportedKdfError
│
└───NodeError
│   │   DisconnectedError
│   │   DuplicateNodeError
│   │   NodeNotFoundError
│   │   UnsupportedNodeError
│
└───SwaggerError
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
│   │   PrefixMismatchError
│   │   PrefixNotFoundError
│   │   SchemaNotFoundError
│   │   TagNotFoundError
│   │   TxNotInChainError
│   │   UnknownTxError
│   │   UnsignedTxError
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
  Crypto,
  InvalidTxParamsError,
  InvalidAensNameError
} = require('@aeternity/aepp-sdk')

// setup
const NODE_URL = 'https://testnet.aeternity.io'
const PAYER_ACCOUNT_KEYPAIR = Crypto.generateKeyPair()
const NEW_USER_KEYPAIR = Crypto.generateKeyPair()

const payerAccount = MemoryAccount({ keypair: PAYER_ACCOUNT_KEYPAIR })
const newUserAccount = MemoryAccount({ keypair: NEW_USER_KEYPAIR })
const node = await Node({ url: NODE_URL })
const client = await Universal({
  nodes: [{ name: 'testnet', instance: node }],
  accounts: [payerAccount, newUserAccount]
})

// catch exceptions
try {
  const spendTxResult = await client.spend(-1, await newUserAccount.address(), { onAccount: payerAccount})
} catch(err) {
  if(err instanceof InvalidTxParamsError){
    console.log(`Amount specified is not valid, ${err.message}`)
  } else if(err instanceof InvalidAensNameError) {
    console.log(`Address specified is not valid, ${err.message}`)
  }
}

// using generic error classes
const {AensError, TransactionError, AeError } = require('@aeternity/aepp-sdk')

try {
  const spendTxResult = await client.spend(1, "ak_2tv", { onAccount: payerAccount})
} catch(err) {
  if(err instanceof AensError){
    // address or AENS related errors
  } else if(err instanceof TransactionError) {
    // transaction errors
  } else if(err instanceof AeError){
    // match any errors from the SDK
  }
}
```
