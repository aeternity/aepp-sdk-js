/**
 * Error module
 * @module @aeternity/aepp-sdk/es/utils/error
 * @example import { BytecodeMismatchError } from '@aeternity/aepp-sdk'
 */

/**
 * aepp-sdk originated error
 */
export class AeError extends Error {
  constructor (msg: string) {
    super(msg)
    this.name = 'AeError'
  }
}

/* Common error patterns */
export class IlleagalArgumentError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'IlleagalArgumentError'
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
  constructor (blocks: number, th: string) {
    super(`Giving up after ${blocks} blocks mined, transaction hash: ${th}`)
    this.name = 'TxTimedOutError'
  }
}

export class TypeError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'TypeError'
  }
}

export class MissingParamError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'MissingParamError'
  }
}

export class InsufficientBalanceError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InsufficientBalanceError'
  }
}

export class UnsupportedProtocolError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnsupportedProtocolError'
  }
}

export class InvalidNameError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidNameError'
  }
}

export class InvalidHashError extends AeError {
  constructor () {
    super('Not a valid hash')
    this.name = 'InvalidHashError'
  }
}

export class UnknownHashClassError extends AeError {
  constructor (klass: string) {
    super(`Unknown class ${klass}`)
    this.name = 'UnknownHashClassError'
  }
}

/* keypair an account related errors */
export class InvalidKeypairError extends IlleagalArgumentError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidKeypairError'
  }
}

export class UnavailableAccountError extends AeError {
  constructor (address: string) {
    super(`Account for ${address} not available`)
    this.name = 'UnavailableAccountError'
  }
}

/* errors orginating from AENS operation */
export class InsufficientNameFeeError extends AeError {
  constructor (nameFee: number, minNameFee: number) {
    super(`the provided fee ${nameFee} is not enough to execute the claim, required: ${minNameFee}`)
    this.name = 'InsufficientNameFeeError'
  }
}

export class InvalidAensNameError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidAensNameError'
  }
}

export class AensNameNotFoundError extends AeError {
  constructor (nameOrId: string) {
    super(`Name not found: ${nameOrId}`)
    this.name = 'AensNameNotFoundError'
  }
}

export class AensPointerContextError extends AeError {
  constructor (nameOrId: string, prefix: string) {
    super(`Name ${nameOrId} don't have pointers for ${prefix}`)
    this.name = 'AensPointerContextError'
  }
}

/* transaction related errors */
export class InvalidTxError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidTxError'
  }
}

export class TxNotInChainError extends AeError {
  constructor (txHash: string) {
    super(`Transaction ${txHash} is removed from chain`)
    this.name = 'TxNotInChainError'
  }
}

export class DryRunError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'DryRunError'
  }
}

export class UnsupportedVMversionError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnsupportedVMversionError'
  }
}

export class UnsupportedABIversionError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnsupportedABIversionError'
  }
}

export class UnknownTxError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnknownTxError'
  }
}

export class UnsignedTxError extends AeError {
  constructor () {
    super('Signature not found, transaction is not signed')
    this.name = 'UnsignedTxError'
  }
}

export class InvalidSignatureError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnsignedTxError'
  }
}

export class SchemaNotFoundError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'SchemaNotFoundError'
  }
}

export class InvalidTxParamsError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidTxParamsError'
  }
}

export class PrefixMismatchError extends AeError {
  constructor (prefix: string, requiredPrefix: string) {
    super(`Encoded string have a wrong type: ${prefix} (expected: ${requiredPrefix})`)
    this.name = 'PrefixMismatchError'
  }
}

export class DecodeError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'DecodeError'
  }
}

export class TagNotFoundError extends AeError {
  constructor (prefix: string) {
    super(`Id tag for prefix ${prefix} not found.`)
    this.name = 'DecodeError'
  }
}

export class PrefixNotFoundError extends AeError {
  constructor (tag: string) {
    super(`Prefix for id-tag ${tag} not found.`)
    this.name = 'PrefixNotFoundError'
  }
}

export class IllegalBidFeeError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'IllegalBidFeeError'
  }
}

/* compiler issued errors */
export class UnsupportedCompilerError extends AeError {
  constructor (compilerVersion: string, COMPILER_GE_VERSION: string, COMPILER_LT_VERSION: string) {
    super(`Unsupported compiler version ${compilerVersion}. ` +
    `Supported: >= ${COMPILER_GE_VERSION} < ${COMPILER_LT_VERSION}`)
    this.name = 'UnsupportedCompilerError'
  }
}

export class UnavailableCompilerError extends AeError {
  constructor () {
    super('Compiler is not ready')
    this.name = 'UnavailableCompilerError'
  }
}

/* errors from option validations */
export class InvalidAuthDataError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidAuthDataError'
  }
}

/* contract invocation errors */
export class MissingContractDefError extends AeError {
  constructor () {
    super('Either ACI or source code is required')
    this.name = 'MissingContractDefError'
  }
}

export class MissingContractAddressError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'MissingContractAddressError'
  }
}

export class NoSuchContractError extends AeError {
  constructor (notExistingContractAddress: string) {
    super(`Contract with address ${notExistingContractAddress} not found on-chain`)
    this.name = 'NoSuchContractError'
  }
}

export class InactiveContractError extends AeError {
  constructor (contractAddress: string) {
    super(`Contract with address ${contractAddress} not active`)
    this.name = 'InactiveContractError'
  }
}

export class BytecodeMismatchError extends AeError {
  constructor (source: string) {
    super(`Contract ${source} do not correspond to the bytecode deployed on the chain`)
    this.name = 'BytecodeMismatchError'
  }
}

export class UnknownCallReturnTypeError extends AeError {
  constructor (returnType: any) {
    super(`Unknown returnType: ${String(returnType)}`)
    this.name = 'UnknownCallReturnTypeError'
  }
}

export class NodeInvocationError extends AeError {
  constructor (msg?: string) {
    msg = msg ?? ''
    super(`Invocation failed${msg === '' ? '' : `: "${msg}"`}`)
    this.name = 'NodeInvocationError'
  }
}

export class DuplicateContractError extends AeError {
  constructor () {
    super('Contract already deployed')
    this.name = 'DuplicateContractError'
  }
}

export class MissingFunctionNameError extends AeError {
  constructor () {
    super('Function name is required')
    this.name = 'MissingFunctionNameError'
  }
}

export class InvalidMethodInvocationError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidMethodInvocationError'
  }
}

export class NotPayableFunctionError extends AeError {
  constructor (amount: string, fn: string) {
    super(
      `You try to pay "${amount}" to function "${fn}" which is not payable. ` +
      'Only payable function can accept tokens')
    this.name = 'NotPayableFunctionError'
  }
}

export class InvalidSchemaError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'InvalidSchemaError'
  }
}

/* Node communication errors  */
export class UnsupportedNodeError extends AeError {
  constructor (nodeVersion: string, NODE_GE_VERSION: string, NODE_LT_VERSION: string) {
    super(
      `Unsupported node version ${nodeVersion}. ` +
      `Supported: >= ${NODE_GE_VERSION} < ${NODE_LT_VERSION}`)
    this.name = 'UnsupportedNodeError'
  }
}

/* Channel orginated errors */
export class ChannelInitializationError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'ChannelInitializationError'
  }
}

export class UnknownChannelStateError extends AeError {
  constructor () {
    super('State Channels FSM entered unknown state')
    this.name = 'UnknownChannelStateError'
  }
}

export class ChannelPingTimedOutError extends AeError {
  constructor () {
    super('Server pong timed out')
    this.name = 'ChannelPingTimedOutError'
  }
}

export class ChannelCallError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'ChannelCallError'
  }
}

export class UnexpectedChannelMessageError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'UnexpectedChannelMessageError'
  }
}

export class ChannelConnectionError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'ChannelConnectionError'
  }
}

/* Node errors */
export class NodeNotFoundError extends AeError {
  constructor (msg: string) {
    super(msg)
    this.name = 'NodeNotFoundError'
  }
}

export class DuplicateNodeError extends AeError {
  constructor (name: string) {
    super(`Node with name ${name} already exist`)
    this.name = 'DuplicateNodeError'
  }
}

export class DisconnectedError extends AeError {
  constructor () {
    super('Can not get node info. Node is not connected')
    this.name = 'DisconnectedError'
  }
}
