// eslint-disable-next-line max-classes-per-file
import BigNumber from 'bignumber.js';
import { AensName, Int } from '../tx/builder/constants';
import * as Encoded from './encoder-types';

/**
 * aepp-sdk originated error
 * @category exception
 */
export abstract class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BaseError';
  }
}

/**
 * @category exception
 */
export class AccountError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'AccountError';
  }
}

/**
 * @category exception
 */
export class AensError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'AensError';
  }
}

/**
 * @category exception
 */
export class AeppError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'AeppError';
  }
}

/**
 * @category exception
 */
export class ChannelError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'ChannelError';
  }
}

/**
 * @category exception
 */
export class CompilerError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'CompilerError';
  }
}

/**
 * @category exception
 */
export class ContractError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'ContractError';
  }
}

/**
 * @category exception
 */
export class CryptographyError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'CryptographyError';
  }
}

/**
 * @category exception
 */
export class NodeError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'NodeError';
  }
}

/**
 * @category exception
 */
export class TransactionError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * @category exception
 */
export class WalletError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

/**
 * @category exception
 */
export class ArgumentError extends BaseError {
  constructor(argumentName: string, requirement: unknown, argumentValue: unknown) {
    super(`${argumentName} should be ${requirement}, got ${argumentValue} instead`);
    this.name = 'ArgumentError';
  }
}

/**
 * @category exception
 */
export class IllegalArgumentError extends CryptographyError {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalArgumentError';
  }
}

/**
 * @category exception
 */
export class ArgumentCountMismatchError extends BaseError {
  constructor(functionName: string, requiredCount: number, providedCount: number) {
    super(`${functionName} expects ${requiredCount} arguments, got ${providedCount} instead`);
    this.name = 'ArgumentCountMismatchError';
  }
}

/**
 * @category exception
 */
export class InsufficientBalanceError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

/**
 * @category exception
 */
export class MissingParamError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'MissingParamError';
  }
}

/**
 * @category exception
 */
export class NoSerializerFoundError extends BaseError {
  constructor() {
    super('Byte serialization not supported');
    this.name = 'NoSerializerFoundError';
  }
}

/**
 * @category exception
 */
export class RequestTimedOutError extends BaseError {
  constructor(height: number) {
    super(`Giving up at height ${height}`);
    this.name = 'RequestTimedOutError';
  }
}

/**
 * @category exception
 */
export class TxTimedOutError extends BaseError {
  constructor(blocks: number, th: Encoded.TxHash) {
    super([
      `Giving up after ${blocks} blocks mined`,
      `transaction hash: ${th}`,
    ].join(', '));
    this.name = 'TxTimedOutError';
  }
}

/**
 * @category exception
 */
export class TypeError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'TypeError';
  }
}

/**
 * @category exception
 */
export class UnsupportedPlatformError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedPlatformError';
  }
}

/**
 * @category exception
 */
export class UnsupportedProtocolError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedProtocolError';
  }
}

/**
 * @category exception
 */
export class NotImplementedError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

/**
 * @category exception
 */
export class UnsupportedVersionError extends BaseError {
  constructor(dependency: string, version: string, geVersion: string, ltVersion: string) {
    super(`Unsupported ${dependency} version ${version}. Supported: >= ${geVersion} < ${ltVersion}`);
    this.name = 'UnsupportedVersionError';
  }
}

/**
 * @category exception
 */
export class LogicError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'LogicError';
  }
}

/**
 * @category exception
 */
export class InternalError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'InternalError';
  }
}

/**
 * @category exception
 */
export class UnexpectedTsError extends InternalError {
  constructor(message = 'Expected to not happen, required for TS') {
    super(message);
    this.name = 'UnexpectedTsError';
  }
}

/**
 * @category exception
 */
export class UnavailableAccountError extends AccountError {
  constructor(address: Encoded.AccountAddress) {
    super(`Account for ${address} not available`);
    this.name = 'UnavailableAccountError';
  }
}

/**
 * @category exception
 */
export class AensPointerContextError extends AensError {
  constructor(nameOrId: AensName | Encoded.Name, prefix: string) {
    super(`Name ${nameOrId} don't have pointers for ${prefix}`);
    this.name = 'AensPointerContextError';
  }
}

/**
 * @category exception
 */
export class InsufficientNameFeeError extends AensError {
  constructor(nameFee: BigNumber, minNameFee: BigNumber) {
    super(`the provided fee ${nameFee.toString()} is not enough to execute the claim, required: ${minNameFee.toString()}`);
    this.name = 'InsufficientNameFeeError';
  }
}

/**
 * @category exception
 */
export class InvalidAensNameError extends AensError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAensNameError';
  }
}

/**
 * @category exception
 */
export class InvalidRpcMessageError extends AeppError {
  constructor(message: string) {
    super(`Received invalid message: ${message}`);
    this.name = 'InvalidRpcMessageError';
  }
}

/**
 * @category exception
 */
export class MissingCallbackError extends AeppError {
  constructor(id: number) {
    super(`Can't find callback for this messageId ${id}`);
    this.name = 'MissingCallbackError';
  }
}

/**
 * @category exception
 */
export class UnAuthorizedAccountError extends AeppError {
  constructor(onAccount: Encoded.AccountAddress) {
    super(`You do not have access to account ${onAccount}`);
    this.name = 'UnAuthorizedAccountError';
  }
}

/**
 * @category exception
 */
export class UnknownRpcClientError extends AeppError {
  constructor(id: string) {
    super(`RpcClient with id ${id} do not exist`);
    this.name = 'UnknownRpcClientError';
  }
}

/**
 * @category exception
 */
export class UnsubscribedAccountError extends AeppError {
  constructor() {
    super('You are not subscribed for an account.');
    this.name = 'UnsubscribedAccountError';
  }
}

/**
 * @category exception
 */
export class ChannelCallError extends ChannelError {
  constructor(message: string) {
    super(message);
    this.name = 'ChannelCallError';
  }
}

/**
 * @category exception
 */
export class ChannelConnectionError extends ChannelError {
  constructor(message: string) {
    super(message);
    this.name = 'ChannelConnectionError';
  }
}

/**
 * @category exception
 */
export class ChannelPingTimedOutError extends ChannelError {
  constructor() {
    super('Server pong timed out');
    this.name = 'ChannelPingTimedOutError';
  }
}

/**
 * @category exception
 */
export class UnexpectedChannelMessageError extends ChannelError {
  constructor(message: string) {
    super(message);
    this.name = 'UnexpectedChannelMessageError';
  }
}

/**
 * @category exception
 */
export class ChannelIncomingMessageError extends ChannelError {
  handlerError: Error;

  incomingMessage: { [key: string]: any };

  constructor(handlerError: Error, incomingMessage: { [key: string]: any }) {
    super(handlerError.message);
    this.handlerError = handlerError;
    this.incomingMessage = incomingMessage;
    this.name = 'ChannelIncomingMessageError';
  }
}

/**
 * @category exception
 */
export class UnknownChannelStateError extends ChannelError {
  constructor() {
    super('State Channels FSM entered unknown state');
    this.name = 'UnknownChannelStateError';
  }
}

/**
 * @category exception
 */
export class InvalidAuthDataError extends CompilerError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAuthDataError';
  }
}

/**
 * @category exception
 */
export class BytecodeMismatchError extends ContractError {
  constructor(source: 'source code' | 'bytecode') {
    super(`Contract ${source} do not correspond to the bytecode deployed on the chain`);
    this.name = 'BytecodeMismatchError';
  }
}

/**
 * @category exception
 */
export class DuplicateContractError extends ContractError {
  constructor() {
    super('Contract already deployed');
    this.name = 'DuplicateContractError';
  }
}

/**
 * @category exception
 */
export class InactiveContractError extends ContractError {
  constructor(contractAddress: Encoded.ContractAddress) {
    super(`Contract with address ${contractAddress} not active`);
    this.name = 'InactiveContractError';
  }
}

/**
 * @category exception
 */
export class InvalidMethodInvocationError extends ContractError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMethodInvocationError';
  }
}

/**
 * @category exception
 */
export class MissingContractAddressError extends ContractError {
  constructor(message: string) {
    super(message);
    this.name = 'MissingContractAddressError';
  }
}

/**
 * @category exception
 */
export class MissingContractDefError extends ContractError {
  constructor() {
    super('Either ACI or sourceCode or sourceCodePath is required');
    this.name = 'MissingContractDefError';
  }
}

/**
 * @category exception
 */
export class MissingFunctionNameError extends ContractError {
  constructor() {
    super('Function name is required');
    this.name = 'MissingFunctionNameError';
  }
}

/**
 * @category exception
 */
export class NodeInvocationError extends ContractError {
  transaction?: Encoded.Transaction;

  constructor(message: string, transaction?: Encoded.Transaction) {
    super(`Invocation failed${message == null ? '' : `: "${message}"`}`);
    this.name = 'NodeInvocationError';
    this.transaction = transaction;
  }
}

/**
 * @category exception
 */
export class NoSuchContractFunctionError extends ContractError {
  constructor(name: string) {
    super(`Function ${name} doesn't exist in contract`);
    this.name = 'NoSuchContractFunctionError';
  }
}

/**
 * @category exception
 */
export class NotPayableFunctionError extends ContractError {
  constructor(amount: Int, fn: string) {
    super(
      `You try to pay "${amount}" to function "${fn}" which is not payable. `
      + 'Only payable function can accept coins',
    );
    this.name = 'NotPayableFunctionError';
  }
}

/**
 * @category exception
 */
export class MissingEventDefinitionError extends ContractError {
  constructor(eventNameHash: string, eventAddress: Encoded.ContractAddress) {
    super(
      `Can't find definition of ${eventNameHash} event emitted by ${eventAddress}`
      + ' (use omitUnknown option to ignore events like this)',
    );
    this.name = 'MissingEventDefinitionError';
  }
}

/**
 * @category exception
 */
export class AmbiguousEventDefinitionError extends ContractError {
  constructor(eventAddress: Encoded.ContractAddress, matchedEvents: Array<[string, string]>) {
    super(
      `Found multiple definitions of "${matchedEvents[0][1]}" event with different types emitted by`
      + ` ${eventAddress} in ${matchedEvents.map(([name]) => `"${name}"`).join(', ')} contracts`
      + ' (use contractAddressToName option to specify contract name corresponding to address)',
    );
    this.name = 'AmbiguousEventDefinitionError';
  }
}

/**
 * @category exception
 */
export class InvalidChecksumError extends CryptographyError {
  constructor() {
    super('Invalid checksum');
    this.name = 'InvalidChecksumError';
  }
}

/**
 * @category exception
 */
export class InvalidPasswordError extends CryptographyError {
  constructor() {
    super('Invalid password or nonce');
    this.name = 'InvalidPasswordError';
  }
}

/**
 * @category exception
 */
export class MerkleTreeHashMismatchError extends CryptographyError {
  constructor() {
    super('Node hash is not equal to provided one');
    this.name = 'MerkleTreeHashMismatchError';
  }
}

/**
 * @category exception
 */
export class MissingNodeInTreeError extends CryptographyError {
  constructor(message: string) {
    super(message);
    this.name = 'MissingNodeInTreeError';
  }
}

/**
 * @category exception
 */
export class UnknownNodeLengthError extends CryptographyError {
  constructor(nodeLength: number) {
    super(`Unknown node length: ${nodeLength}`);
    this.name = 'UnknownNodeLengthError';
  }
}

/**
 * @category exception
 */
export class UnknownPathNibbleError extends CryptographyError {
  constructor(nibble: number) {
    super(`Unknown path nibble: ${nibble}`);
    this.name = 'UnknownPathNibbleError';
  }
}

/**
 * @category exception
 */
export class DuplicateNodeError extends NodeError {
  constructor(name: string) {
    super(`Node with name ${name} already exist`);
    this.name = 'DuplicateNodeError';
  }
}

/**
 * @category exception
 */
export class NodeNotFoundError extends NodeError {
  constructor(message: string) {
    super(message);
    this.name = 'NodeNotFoundError';
  }
}

/**
 * @category exception
 */
export class DecodeError extends TransactionError {
  constructor(message: string) {
    super(message);
    this.name = 'DecodeError';
  }
}

/**
 * @category exception
 */
export class PayloadLengthError extends TransactionError {
  constructor(message: string) {
    super(message);
    this.name = 'PayloadLengthError';
  }
}

/**
 * @category exception
 */
export class DryRunError extends TransactionError {
  constructor(message: string) {
    super(message);
    this.name = 'DryRunError';
  }
}

/**
 * @category exception
 */
export class IllegalBidFeeError extends TransactionError {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalBidFeeError';
  }
}

/**
 * @category exception
 */
export class InvalidSignatureError extends TransactionError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSignatureError';
  }
}

/**
 * @category exception
 */
export class PrefixNotFoundError extends TransactionError {
  constructor(tag: number) {
    super(`Prefix for id-tag ${tag} not found.`);
    this.name = 'PrefixNotFoundError';
  }
}

/**
 * @category exception
 */
export class SchemaNotFoundError extends TransactionError {
  constructor(key: string, version: number) {
    super(`Transaction schema not implemented for tag ${key} version ${version}`);
    this.name = 'SchemaNotFoundError';
  }
}

/**
 * @category exception
 */
export class TagNotFoundError extends TransactionError {
  constructor(prefix: string) {
    super(`Id tag for prefix ${prefix} not found.`);
    this.name = 'DecodeError';
  }
}

/**
 * @category exception
 */
export class TxNotInChainError extends TransactionError {
  constructor(txHash: Encoded.TxHash) {
    super(`Transaction ${txHash} is removed from chain`);
    this.name = 'TxNotInChainError';
  }
}

/**
 * @category exception
 */
export class AlreadyConnectedError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'AlreadyConnectedError';
  }
}

/**
 * @category exception
 */
export class NoWalletConnectedError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'NoWalletConnectedError';
  }
}

/**
 * @category exception
 */
export class RpcConnectionError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'RpcConnectionError';
  }
}
