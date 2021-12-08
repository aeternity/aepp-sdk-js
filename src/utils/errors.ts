/**
 * Error module
 * @module @aeternity/aepp-sdk/es/utils/errors
 * @example import { BytecodeMismatchError } from '@aeternity/aepp-sdk'
 */

/**
 * aepp-sdk originated error
 */
export abstract class AeError extends Error {
  constructor (msg: string) {
    super(msg)
    this.name = 'AeError'
  }
}

export class AccountError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'AccountError'
  }
}

export class AensError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'AensError'
  }
}

export class AeppError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'AeppError'
  }
}

export class ChannelError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'ChannelError'
  }
}

export class CompilerError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'CompilerError'
  }
}

export class ContractError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'ContractError'
  }
}

export class CryptographyError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'CryptographyError'
  }
}

export class NodeError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'NodeError'
  }
}

export class SwaggerError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'SwaggerError'
  }
}

export class TransactionError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'TransactionError'
  }
}

export class WalletError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'WalletError'
  }
}

/* Common error patterns */
export class IllegalArgumentError extends CryptographyError {
  constructor (msg: string) {
    super(msg)
    this.name = 'IllegalArgumentError'
  }
}

export class InsufficientBalanceError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InsufficientBalanceError'
  }
}

export class InvalidDenominationError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidDenominationError'
  }
}

export class InvalidHashError extends AeError {
  constructor () {
    super('Not a valid hash')
    this.name = 'InvalidHashError'
  }
}

export class InvalidNameError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidNameError'
  }
}

export class MissingParamError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'MissingParamError'
  }
}

export class NoBrowserFoundError extends AeError {
  constructor () {
    super('Browser is not detected')
    this.name = 'NoBrowserFoundError'
  }
}

export class NoSerializerFoundError extends AeError {
  constructor () {
    super('Byte serialization not supported')
    this.name = 'NoSerializerFoundError'
  }
}

export class RequestTimedOutError extends AeError {
  constructor (requestTime: number);
  constructor (requestTime: number, currentHeight?: number, height?: number) {
    if (currentHeight !== undefined && height !== undefined) {
      super(`Giving up after ${requestTime}ms, current height: ${currentHeight}, desired height: ${height}`)
    } else {
      super(`Giving up after ${requestTime} ms`)
    }
    this.name = 'RequestTimedOutError'
  }
}

export class TxTimedOutError extends AeError {
  constructor (blocks: number, th: string, status?: string) {
    super([
      `Giving up after ${blocks} blocks mined`,
      `transaction hash: ${th}`,
      ...status ? [`status: ${status}`] : []
    ].join(', '))
    this.name = 'TxTimedOutError'
  }
}

export class UnknownHashClassError extends AeError {
  constructor (klass: string) {
    super(`Unknown class ${klass}`)
    this.name = 'UnknownHashClassError'
  }
}

export class TypeError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'TypeError'
  }
}

export class UnsupportedPlatformError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnsupportedPlatformError'
  }
}
export class UnsupportedProtocolError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnsupportedProtocolError'
  }
}

/* keypair an account related errors */
export class InvalidKeypairError extends AccountError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidKeypairError'
  }
}

export class UnavailableAccountError extends AccountError {
  constructor (address: string) {
    super(`Account for ${address} not available`)
    this.name = 'UnavailableAccountError'
  }
}

/* errors originating from AENS operation */
export class AensNameNotFoundError extends AensError {
  constructor (nameOrId: string) {
    super(`Name not found: ${nameOrId}`)
    this.name = 'AensNameNotFoundError'
  }
}

export class AensPointerContextError extends AensError {
  constructor (nameOrId: string, prefix: string) {
    super(`Name ${nameOrId} don't have pointers for ${prefix}`)
    this.name = 'AensPointerContextError'
  }
}

export class InsufficientNameFeeError extends AensError {
  constructor (nameFee: number, minNameFee: number) {
    super(`the provided fee ${nameFee} is not enough to execute the claim, required: ${minNameFee}`)
    this.name = 'InsufficientNameFeeError'
  }
}

export class InvalidAensNameError extends AensError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidAensNameError'
  }
}

/* Aepp Errors */
export class DuplicateCallbackError extends AeppError {
  constructor () {
    super('Callback Already exist')
    this.name = 'DuplicateCallbackError'
  }
}

export class InvalidRpcMessage extends AeppError {
  constructor (msg: string) {
    super(`Received invalid message: ${msg}`)
    this.name = 'InvalidRpcMessage'
  }
}

export class MissingCallbackError extends AeppError {
  constructor (id: string) {
    super(`Can't find callback for this messageId ${id}`)
    this.name = 'MissingCallbackError'
  }
}

export class UnAuthorizedAccountError extends AeppError {
  constructor (onAccount: string) {
    super(`You do not have access to account ${onAccount}`)
    this.name = 'UnAuthorizedAccountError'
  }
}

export class UnknownRpcClientError extends AeppError {
  constructor (id: string) {
    super(`RpcClient with id ${id} do not exist`)
    this.name = 'UnknownRpcClientError'
  }
}

export class UnsubscribedAccountError extends AeppError {
  constructor () {
    super('You are not subscribed for an account.')
    this.name = 'UnsubscribedAccountError'
  }
}

/* Channel originated errors */
export class ChannelCallError extends ChannelError {
  constructor (msg: string) {
    super(msg)
    this.name = 'ChannelCallError'
  }
}

export class ChannelConnectionError extends ChannelError {
  constructor (msg: string) {
    super(msg)
    this.name = 'ChannelConnectionError'
  }
}

export class ChannelInitializationError extends ChannelError {
  constructor (msg: string) {
    super(msg)
    this.name = 'ChannelInitializationError'
  }
}

export class ChannelPingTimedOutError extends ChannelError {
  constructor () {
    super('Server pong timed out')
    this.name = 'ChannelPingTimedOutError'
  }
}

export class UnexpectedChannelMessageError extends ChannelError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnexpectedChannelMessageError'
  }
}

export class UnknownChannelStateError extends ChannelError {
  constructor () {
    super('State Channels FSM entered unknown state')
    this.name = 'UnknownChannelStateError'
  }
}

/* compiler issued errors */
export class UnsupportedCompilerError extends CompilerError {
  constructor (compilerVersion: string, COMPILER_GE_VERSION: string, COMPILER_LT_VERSION: string) {
    super(`Unsupported compiler version ${compilerVersion}. ` +
    `Supported: >= ${COMPILER_GE_VERSION} < ${COMPILER_LT_VERSION}`)
    this.name = 'UnsupportedCompilerError'
  }
}

/* errors from option validations */
export class InvalidAuthDataError extends CompilerError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidAuthDataError'
  }
}

/* contract invocation errors */
export class BytecodeMismatchError extends ContractError {
  constructor (source: string) {
    super(`Contract ${source} do not correspond to the bytecode deployed on the chain`)
    this.name = 'BytecodeMismatchError'
  }
}

export class DuplicateContractError extends ContractError {
  constructor () {
    super('Contract already deployed')
    this.name = 'DuplicateContractError'
  }
}

export class InactiveContractError extends ContractError {
  constructor (contractAddress: string) {
    super(`Contract with address ${contractAddress} not active`)
    this.name = 'InactiveContractError'
  }
}

export class InvalidMethodInvocationError extends ContractError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidMethodInvocationError'
  }
}

export class MissingContractAddressError extends ContractError {
  constructor (msg: string) {
    super(msg)
    this.name = 'MissingContractAddressError'
  }
}

export class MissingContractDefError extends ContractError {
  constructor () {
    super('Either ACI or source code is required')
    this.name = 'MissingContractDefError'
  }
}

export class MissingFunctionNameError extends ContractError {
  constructor () {
    super('Function name is required')
    this.name = 'MissingFunctionNameError'
  }
}

export class NodeInvocationError extends ContractError {
  constructor (msg?: string) {
    msg = msg ?? ''
    super(`Invocation failed${msg === '' ? '' : `: "${msg}"`}`)
    this.name = 'NodeInvocationError'
  }
}

export class NoSuchContractError extends ContractError {
  constructor (notExistingContractAddress: string) {
    super(`Contract with address ${notExistingContractAddress} not found on-chain`)
    this.name = 'NoSuchContractError'
  }
}

export class NoSuchContractFunctionError extends ContractError {
  constructor (name: string) {
    super(`Function ${name} doesn't exist in contract`)
    this.name = 'NoSuchContractFunctionError'
  }
}

export class NotPayableFunctionError extends ContractError {
  constructor (amount: string, fn: string) {
    super(
      `You try to pay "${amount}" to function "${fn}" which is not payable. ` +
      'Only payable function can accept tokens')
    this.name = 'NotPayableFunctionError'
  }
}

export class UnknownCallReturnTypeError extends ContractError {
  constructor (returnType: any) {
    super(`Unknown returnType: ${String(returnType)}`)
    this.name = 'UnknownCallReturnTypeError'
  }
}

/* cryptography errors */
export class InvalidChecksumError extends CryptographyError {
  constructor () {
    super('Invalid checksum')
    this.name = 'InvalidChecksumError'
  }
}

export class InvalidDerivationPathError extends CryptographyError {
  constructor () {
    super('Invalid path')
    this.name = 'InvalidDerivationPathError'
  }
}

export class InvalidKeyError extends CryptographyError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidKeyError'
  }
}

export class InvalidMnemonicError extends CryptographyError {
  constructor () {
    super('Invalid mnemonic')
    this.name = 'InvalidMnemonicError'
  }
}

export class InvalidPasswordError extends CryptographyError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidPasswordError'
  }
}

export class MerkleTreeHashMismatchError extends CryptographyError {
  constructor () {
    super('Node hash is not equal to provided one')
    this.name = 'MerkleTreeHashMismatchError'
  }
}

export class MessageLimitError extends CryptographyError {
  constructor () {
    super('message too long')
    this.name = 'MessageLimitError'
  }
}

export class MissingNodeInTreeError extends CryptographyError {
  constructor (msg: string) {
    super(msg)
    this.name = 'MissingNodeInTreeError'
  }
}

export class NoSuchAlgorithmError extends CryptographyError {
  constructor (algo: string) {
    super(algo + ' is not available')
    this.name = 'NoSuchAlgorithmError'
  }
}

export class NotHardenedSegmentError extends CryptographyError {
  constructor (msg: string) {
    super(msg)
    this.name = 'NotHardenedSegmentError'
  }
}

export class UnknownNodeLengthError extends CryptographyError {
  constructor (nodeLength: number) {
    super(`Unknown node length: ${nodeLength}`)
    this.name = 'UnknownNodeLengthError'
  }
}

export class UnknownPathNibbleError extends CryptographyError {
  constructor (nibble: number) {
    super(`Unknown path nibble: ${nibble}`)
    this.name = 'UnknownPathNibbleError'
  }
}

export class UnsupportedChildIndexError extends CryptographyError {
  constructor (index: string) {
    super(`Child index #${index} is not supported`)
    this.name = 'UnsupportedChildIndexError'
  }
}

export class UnsupportedKdfError extends CryptographyError {
  constructor () {
    super('Unsupported kdf type')
    this.name = 'UnsupportedKdfError'
  }
}

/* Node errors */
export class DisconnectedError extends NodeError {
  constructor () {
    super('Can not get node info. Node is not connected')
    this.name = 'DisconnectedError'
  }
}

export class DuplicateNodeError extends NodeError {
  constructor (name: string) {
    super(`Node with name ${name} already exist`)
    this.name = 'DuplicateNodeError'
  }
}

export class NodeNotFoundError extends NodeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'NodeNotFoundError'
  }
}

/* Node communication errors  */
export class UnsupportedNodeError extends NodeError {
  constructor (nodeVersion: string, NODE_GE_VERSION: string, NODE_LT_VERSION: string) {
    super(
      `Unsupported node version ${nodeVersion}. ` +
      `Supported: >= ${NODE_GE_VERSION} < ${NODE_LT_VERSION}`)
    this.name = 'UnsupportedNodeError'
  }
}

/* transaction related errors */
export class DecodeError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'DecodeError'
  }
}

export class EncodeError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'EncodeError'
  }
}

export class PayloadLengthError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'PayloadLengthError'
  }
}

export class DryRunError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'DryRunError'
  }
}

export class IllegalBidFeeError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'IllegalBidFeeError'
  }
}

export class InvalidSignatureError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnsignedTxError'
  }
}

export class InvalidTxError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidTxError'
  }
}

export class InvalidTxParamsError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidTxParamsError'
  }
}

export class NoDefaultAensPointerError extends TransactionError {
  constructor (prefix: string) {
    super(`Default AENS pointer key is not defined for ${prefix} prefix`)
    this.name = 'NoDefaultAensPointerError'
  }
}

export class PrefixMismatchError extends TransactionError {
  constructor (prefix: string, requiredPrefix: string) {
    super(`Encoded string have a wrong type: ${prefix} (expected: ${requiredPrefix})`)
    this.name = 'PrefixMismatchError'
  }
}

export class PrefixNotFoundError extends TransactionError {
  constructor (tag: string) {
    super(`Prefix for id-tag ${tag} not found.`)
    this.name = 'PrefixNotFoundError'
  }
}

export class SchemaNotFoundError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'SchemaNotFoundError'
  }
}

export class TagNotFoundError extends TransactionError {
  constructor (prefix: string) {
    super(`Id tag for prefix ${prefix} not found.`)
    this.name = 'DecodeError'
  }
}

export class TxNotInChainError extends TransactionError {
  constructor (txHash: string) {
    super(`Transaction ${txHash} is removed from chain`)
    this.name = 'TxNotInChainError'
  }
}

export class UnknownTxError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnknownTxError'
  }
}

export class UnsignedTxError extends TransactionError {
  constructor () {
    super('Signature not found, transaction is not signed')
    this.name = 'UnsignedTxError'
  }
}

export class UnsupportedABIversionError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnsupportedABIversionError'
  }
}

export class UnsupportedVMversionError extends TransactionError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnsupportedVMversionError'
  }
}

/* Wallet Errors */
export class AlreadyConnectedError extends WalletError {
  constructor (msg: string) {
    super(msg)
    this.name = 'AlreadyConnectedError'
  }
}

export class MessageDirectionError extends WalletError {
  constructor (msg: string) {
    super(msg)
    this.name = 'MessageDirectionError'
  }
}

export class NoWalletConnectedError extends WalletError {
  constructor (msg: string) {
    super(msg)
    this.name = 'NoWalletConnectedError'
  }
}

export class RpcConnectionError extends WalletError {
  constructor (msg: string) {
    super(msg)
    this.name = 'RpcConnectionError'
  }
}
