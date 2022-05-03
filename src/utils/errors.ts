/**
 * Error module
 * @module @aeternity/aepp-sdk/es/utils/errors
 * @example import { BytecodeMismatchError } from '@aeternity/aepp-sdk'
 */

/**
 * aepp-sdk originated error
 */
export abstract class BaseError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'BaseError'
  }
}

export class AccountError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'AccountError'
  }
}

export class AensError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'AensError'
  }
}

export class AeppError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'AeppError'
  }
}

export class ChannelError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'ChannelError'
  }
}

export class CompilerError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'CompilerError'
  }
}

export class ContractError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'ContractError'
  }
}

export class CryptographyError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'CryptographyError'
  }
}

export class NodeError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'NodeError'
  }
}

export class TransactionError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'TransactionError'
  }
}

export class WalletError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'WalletError'
  }
}

/* Common error patterns */
export class ArgumentError extends BaseError {
  constructor (argumentName: string, requirement: string, argumentValue: any) {
    super(`${argumentName} should be ${requirement}, got ${String(argumentValue)} instead`)
    this.name = 'ArgumentError'
  }
}

export class IllegalArgumentError extends CryptographyError {
  constructor (message: string) {
    super(message)
    this.name = 'IllegalArgumentError'
  }
}

export class ArgumentCountMismatchError extends BaseError {
  constructor (functionName: string, requiredCount: number, providedCount: number) {
    super(`${functionName} expects ${requiredCount} arguments, got ${providedCount} instead`)
    this.name = 'ArgumentCountMismatchError'
  }
}

export class InsufficientBalanceError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'InsufficientBalanceError'
  }
}

export class InvalidDenominationError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'InvalidDenominationError'
  }
}

export class InvalidNameError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'InvalidNameError'
  }
}

export class MissingParamError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'MissingParamError'
  }
}

export class NoBrowserFoundError extends BaseError {
  constructor () {
    super('Browser is not detected')
    this.name = 'NoBrowserFoundError'
  }
}

export class NoSerializerFoundError extends BaseError {
  constructor () {
    super('Byte serialization not supported')
    this.name = 'NoSerializerFoundError'
  }
}

export class RequestTimedOutError extends BaseError {
  constructor (requestTime: number, currentHeight?: number, height?: number) {
    if (currentHeight !== undefined && height !== undefined) {
      super(`Giving up after ${requestTime}ms, current height: ${currentHeight}, desired height: ${height}`)
    } else {
      super(`Giving up after ${requestTime} ms`)
    }
    this.name = 'RequestTimedOutError'
  }
}

export class TxTimedOutError extends BaseError {
  constructor (blocks: number, th: string) {
    super([
      `Giving up after ${blocks} blocks mined`,
      `transaction hash: ${th}`
    ].join(', '))
    this.name = 'TxTimedOutError'
  }
}

export class TypeError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'TypeError'
  }
}

export class UnsupportedPlatformError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'UnsupportedPlatformError'
  }
}

export class UnsupportedProtocolError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'UnsupportedProtocolError'
  }
}

export class NotImplementedError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'NotImplementedError'
  }
}

export class UnsupportedVersionError extends BaseError {
  constructor (dependency: string, version: string, geVersion: string, ltVersion: string) {
    super(`Unsupported ${dependency} version ${version}. Supported: >= ${geVersion} < ${ltVersion}`)
    this.name = 'UnsupportedVersionError'
  }
}

export class InternalError extends BaseError {
  constructor (message: string) {
    super(message)
    this.name = 'InternalError'
  }
}

/* keypair an account related errors */
export class InvalidKeypairError extends AccountError {
  constructor (message: string) {
    super(message)
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
  constructor (message: string) {
    super(message)
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

export class InvalidRpcMessageError extends AeppError {
  constructor (message: string) {
    super(`Received invalid message: ${message}`)
    this.name = 'InvalidRpcMessageError'
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
  constructor (message: string) {
    super(message)
    this.name = 'ChannelCallError'
  }
}

export class ChannelConnectionError extends ChannelError {
  constructor (message: string) {
    super(message)
    this.name = 'ChannelConnectionError'
  }
}

export class ChannelPingTimedOutError extends ChannelError {
  constructor () {
    super('Server pong timed out')
    this.name = 'ChannelPingTimedOutError'
  }
}

export class UnexpectedChannelMessageError extends ChannelError {
  constructor (message: string) {
    super(message)
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
/* errors from option validations */
export class InvalidAuthDataError extends CompilerError {
  constructor (message: string) {
    super(message)
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
  constructor (message: string) {
    super(message)
    this.name = 'InvalidMethodInvocationError'
  }
}

export class MissingContractAddressError extends ContractError {
  constructor (message: string) {
    super(message)
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
  transaction: string

  constructor (message: string, transaction: string) {
    super(`Invocation failed${message == null ? '' : `: "${message}"`}`)
    this.name = 'NodeInvocationError'
    this.transaction = transaction
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

export class MissingEventDefinitionError extends ContractError {
  constructor (eventNameHash: string, eventAddress: string) {
    super(
      `Can't find definition of ${eventNameHash} event emitted by ${eventAddress}` +
      ' (use omitUnknown option to ignore events like this)'
    )
    this.name = 'MissingEventDefinitionError'
  }
}

export class AmbiguousEventDefinitionError extends ContractError {
  constructor (eventAddress: string, matchedEvents: Array<[string, string]>) {
    super(
      `Found multiple definitions of "${matchedEvents[0][1]}" event emitted by ${eventAddress}` +
      ` in ${matchedEvents.map(([name]) => `"${name}"`).join(', ')} contracts` +
      ' (use contractAddressToName option to specify contract name corresponding to address)'
    )
    this.name = 'AmbiguousEventDefinitionError'
  }
}

/* cryptography errors */
export class InvalidChecksumError extends CryptographyError {
  constructor () {
    super('Invalid checksum')
    this.name = 'InvalidChecksumError'
  }
}

export class InvalidPasswordError extends CryptographyError {
  constructor () {
    super('Invalid password or nonce')
    this.name = 'InvalidPasswordError'
  }
}

export class MerkleTreeHashMismatchError extends CryptographyError {
  constructor () {
    super('Node hash is not equal to provided one')
    this.name = 'MerkleTreeHashMismatchError'
  }
}

export class MissingNodeInTreeError extends CryptographyError {
  constructor (message: string) {
    super(message)
    this.name = 'MissingNodeInTreeError'
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
  constructor (message: string) {
    super(message)
    this.name = 'NodeNotFoundError'
  }
}

/* transaction related errors */
export class DecodeError extends TransactionError {
  constructor (message: string) {
    super(message)
    this.name = 'DecodeError'
  }
}

export class PayloadLengthError extends TransactionError {
  constructor (message: string) {
    super(message)
    this.name = 'PayloadLengthError'
  }
}

export class DryRunError extends TransactionError {
  constructor (message: string) {
    super(message)
    this.name = 'DryRunError'
  }
}

export class IllegalBidFeeError extends TransactionError {
  constructor (message: string) {
    super(message)
    this.name = 'IllegalBidFeeError'
  }
}

export class InvalidSignatureError extends TransactionError {
  constructor (message: string) {
    super(message)
    this.name = 'InvalidSignatureError'
  }
}

export class InvalidTxError extends TransactionError {
  constructor (message: string) {
    super(message)
    this.name = 'InvalidTxError'
  }
}

export class InvalidTxParamsError extends TransactionError {
  constructor (message: string) {
    super(message)
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
  constructor (tag: string | number) {
    super(`Prefix for id-tag ${tag} not found.`)
    this.name = 'PrefixNotFoundError'
  }
}

export class SchemaNotFoundError extends TransactionError {
  constructor (message: string) {
    super(message)
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
  constructor (message: string) {
    super(message)
    this.name = 'UnknownTxError'
  }
}

export class UnsupportedABIversionError extends TransactionError {
  constructor (message: string) {
    super(message)
    this.name = 'UnsupportedABIversionError'
  }
}

export class UnsupportedVMversionError extends TransactionError {
  constructor (message: string) {
    super(message)
    this.name = 'UnsupportedVMversionError'
  }
}

/* Wallet Errors */
export class AlreadyConnectedError extends WalletError {
  constructor (message: string) {
    super(message)
    this.name = 'AlreadyConnectedError'
  }
}

export class MessageDirectionError extends WalletError {
  constructor (message: string) {
    super(message)
    this.name = 'MessageDirectionError'
  }
}

export class NoWalletConnectedError extends WalletError {
  constructor (message: string) {
    super(message)
    this.name = 'NoWalletConnectedError'
  }
}

export class RpcConnectionError extends WalletError {
  constructor (message: string) {
    super(message)
    this.name = 'RpcConnectionError'
  }
}
