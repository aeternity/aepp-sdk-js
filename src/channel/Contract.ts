import BigNumber from 'bignumber.js';
import { snakeToPascal } from '../utils/string';
import {
  MIN_GAS_PRICE, Tag, AbiVersion, VmVersion,
} from '../tx/builder/constants';
import {
  signAndNotify,
  awaitingCompletion,
  channelClosed,
  channelOpen,
  handleUnexpectedMessage,
} from './handlers';
import {
  notify, call, SignTx, ChannelState, ChannelOptions, ChannelMessage, ChannelFsm, changeState, emit,
} from './internal';
import { Encoded } from '../utils/encoder';
import { ContractCallReturnType } from '../apis/node';
import { ContractCallObject } from '../contract/Contract';
import Channel from './Base';
import ChannelSpend from './Spend';
import { ChannelError, UnexpectedChannelMessageError } from '../utils/errors';
import { unpackTx } from '../tx/builder';
import { encodeContractAddress } from '../utils/crypto';

function snakeToPascalObjKeys<Type>(obj: object): Type {
  return Object.entries(obj).reduce((result, [key, val]) => ({
    ...result,
    [snakeToPascal(key)]: val,
  }), {}) as Type;
}

interface CallContractOptions {
  amount?: number | BigNumber;
  callData?: Encoded.ContractBytearray;
  abiVersion?: AbiVersion;
  contract?: Encoded.ContractAddress;
  returnValue?: any;
  gasUsed?: number | BigNumber;
  gasPrice?: number | BigNumber;
  height?: number;
  callerNonce?: number;
  log?: any;
  returnType?: ContractCallReturnType;
}

interface Contract {
  abiVersion: AbiVersion;
  active: boolean;
  deposit: number | BigNumber;
  id: string;
  ownerId: string;
  referrerIds: string[];
  vmVersion: VmVersion;
}

export default class ChannelContract extends ChannelSpend {
  static override async initialize(options: ChannelOptions): Promise<ChannelContract> {
    return Channel._initialize(new ChannelContract(), options);
  }

  /**
   * Trigger create contract update
   *
   * The create contract update is creating a contract inside the channel's internal state tree.
   * The update is a change to be applied on top of the latest state.
   *
   * That would create a contract with the poster being the owner of it. Poster commits initially
   * a deposit amount of coins to the new contract.
   *
   * @param options - Options
   * @param options.code - Api encoded compiled AEVM byte code
   * @param options.callData - Api encoded compiled AEVM call data for the code
   * @param options.deposit - Initial amount the owner of the contract commits to it
   * @param options.vmVersion - Version of the Virtual Machine
   * @param options.abiVersion - Version of the Application Binary Interface
   * @param sign - Function which verifies and signs create contract transaction
   * @example
   * ```js
   * channel.createContract({
   *   code: 'cb_HKtpipK4aCgYb17wZ...',
   *   callData: 'cb_1111111111111111...',
   *   deposit: 10,
   *   vmVersion: 3,
   *   abiVersion: 1
   * }).then(({ accepted, signedTx, address }) => {
   *   if (accepted) {
   *     console.log('New contract has been created')
   *     console.log('Contract address:', address)
   *   } else {
   *     console.log('New contract has been rejected')
   *   }
   * })
   * ```
   */
  async createContract(
    {
      code, callData, deposit, vmVersion, abiVersion,
    }: {
      code: Encoded.ContractBytearray;
      callData: Encoded.ContractBytearray;
      deposit: number | BigNumber;
      vmVersion: VmVersion;
      abiVersion: AbiVersion;
    },
    sign: SignTx,
  ): Promise<{
      accepted: boolean; signedTx: Encoded.Transaction; address: Encoded.ContractAddress;
    }> {
    return this.enqueueAction(() => {
      notify(this, 'channels.update.new_contract', {
        code,
        call_data: callData,
        deposit,
        vm_version: vmVersion,
        abi_version: abiVersion,
      });
      return {
        handler: async (
          _: Channel,
          message: ChannelMessage,
          state: ChannelState,
        ): Promise<ChannelFsm> => {
          if (message.method !== 'channels.sign.update') {
            return handleUnexpectedMessage(this, message, state);
          }
          await signAndNotify(
            this,
            'channels.update',
            message.params.data,
            async (tx) => state.sign(tx),
          );
          return {
            handler: (
              _2: Channel,
              message2: ChannelMessage,
              state2: ChannelState,
            ): ChannelFsm => (
              awaitingCompletion(this, message2, state2, () => {
                const params = unpackTx(message2.params.data.state, Tag.SignedTx).encodedTx;
                if (params.tag !== Tag.ChannelOffChainTx) {
                  throw new ChannelError(`Tag should be ${Tag[Tag.ChannelOffChainTx]}, got ${Tag[params.tag]} instead`);
                }
                const addressKey = this._options.role === 'initiator'
                  ? 'initiatorId' : 'responderId';
                const owner = this._options[addressKey];
                changeState(this, message2.params.data.state);
                const address = encodeContractAddress(owner, params.round);
                emit(this, 'newContract', address);
                state2.resolve({ accepted: true, address, signedTx: message2.params.data.state });
                return { handler: channelOpen };
              })
            ),
            state,
          };
        },
        state: { sign },
      };
    });
  }

  /**
   * Trigger call a contract update
   *
   * The call contract update is calling a preexisting contract inside the channel's
   * internal state tree. The update is a change to be applied on top of the latest state.
   *
   * That would call a contract with the poster being the caller of it. Poster commits
   * an amount of coins to the contract.
   *
   * The call would also create a call object inside the channel state tree. It contains
   * the result of the contract call.
   *
   * It is worth mentioning that the gas is not consumed, because this is an off-chain
   * contract call. It would be consumed if it were an on-chain one. This could happen
   * if a call with a similar computation amount is to be forced on-chain.
   *
   * @param options - Options
   * @param options.amount - Amount the caller of the contract commits to it
   * @param options.callData - ABI encoded compiled AEVM call data for the code
   * @param options.contract - Address of the contract to call
   * @param options.abiVersion - Version of the ABI
   * @param sign - Function which verifies and signs contract call transaction
   * @example
   * ```js
   * channel.callContract({
   *   contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
   *   callData: 'cb_1111111111111111...',
   *   amount: 0,
   *   abiVersion: 1
   * }).then(({ accepted, signedTx }) => {
   *   if (accepted) {
   *     console.log('Contract called succesfully')
   *   } else {
   *     console.log('Contract call has been rejected')
   *   }
   * })
   * ```
   */
  async callContract(
    {
      amount, callData, contract, abiVersion,
    }: CallContractOptions,
    sign: SignTx,
  ): Promise<{ accepted: boolean; signedTx: Encoded.Transaction }> {
    return this.enqueueAction(() => {
      notify(this, 'channels.update.call_contract', {
        amount,
        call_data: callData,
        contract_id: contract,
        abi_version: abiVersion,
      });
      return {
        handler: async (
          _: Channel,
          message: ChannelMessage,
          state: ChannelState,
        ): Promise<ChannelFsm> => {
          if (message.method !== 'channels.sign.update') {
            return handleUnexpectedMessage(this, message, state);
          }
          await signAndNotify(
            this,
            'channels.update',
            message.params.data,
            async (tx) => state.sign(tx, { updates: message.params.data.updates }),
          );
          return {
            handler: (
              _2: Channel,
              message2: ChannelMessage,
              state2: ChannelState,
            ): ChannelFsm => (
              awaitingCompletion(this, message2, state2, () => {
                changeState(this, message2.params.data.state);
                state2.resolve({ accepted: true, signedTx: message2.params.data.state });
                return { handler: channelOpen };
              })
            ),
            state,
          };
        },
        state: { sign },
      };
    });
  }

  /**
   * Trigger a force progress contract call
   * This call is going on-chain
   * @param options - Options
   * @param options.amount - Amount the caller of the contract commits to it
   * @param options.callData - ABI encoded compiled AEVM call data for the code
   * @param options.contract - Address of the contract to call
   * @param options.abiVersion - Version of the ABI
   * @param options.gasPrice=1000000000]
   * @param options.gasLimit=1000000]
   * @param sign - Function which verifies and signs contract force progress transaction
   * @param callbacks - Callbacks
   * @example
   * ```js
   * channel.forceProgress({
   *   contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
   *   callData: 'cb_1111111111111111...',
   *   amount: 0,
   *   abiVersion: 1,
   *   gasPrice: 1000005554
   * }).then(({ accepted, signedTx }) => {
   *   if (accepted) {
   *     console.log('Contract force progress call successful')
   *   } else {
   *     console.log('Contract force progress call has been rejected')
   *   }
   * })
   * ```
   */
  async forceProgress(
    {
      amount, callData, contract, abiVersion, gasLimit = 1000000, gasPrice = MIN_GAS_PRICE,
    }: {
      amount: number;
      callData: Encoded.ContractBytearray;
      contract: Encoded.ContractAddress;
      abiVersion: AbiVersion;
      gasLimit?: number;
      gasPrice?: number;
    },
    sign: SignTx,
    { onOnChainTx }: Pick<ChannelState, 'onOnChainTx'> = {},
  ): Promise<{
      accepted: boolean;
      signedTx: Encoded.Transaction;
      tx: Encoded.Transaction | Uint8Array;
    }> {
    return this.enqueueAction(() => {
      notify(this, 'channels.force_progress', {
        amount,
        call_data: callData,
        contract_id: contract,
        abi_version: abiVersion,
        gas_price: gasPrice,
        gas: gasLimit,
      });
      return {
        handler: async (
          _: Channel,
          message: ChannelMessage,
          state: ChannelState,
        ): Promise<ChannelFsm> => {
          if (message.method !== 'channels.sign.force_progress_tx') {
            return handleUnexpectedMessage(this, message, state);
          }
          await signAndNotify(
            this,
            'channels.force_progress_sign',
            message.params.data,
            async (tx) => state.sign(tx, { updates: message.params.data.updates }),
          );
          return {
            handler: (
              _2: Channel,
              message2: ChannelMessage,
              state2: ChannelState,
            ): ChannelFsm => {
              if (message2.method === 'channels.on_chain_tx') {
                state2.onOnChainTx?.(message2.params.data.tx);
                emit(this, 'onChainTx', message2.params.data.tx, {
                  info: message2.params.data.info,
                  type: message2.params.data.type,
                });
                state2.resolve({ accepted: true, tx: message2.params.data.tx });
                // TODO: shouldn't be unexpected message in this case
              }
              return handleUnexpectedMessage(this, message2, state2);
            },
            state,
          };
        },
        state: { sign, onOnChainTx },
      };
    });
  }

  /**
   * Call contract using dry-run
   *
   * In order to get the result of a potential contract call, one might need to
   * dry-run a contract call. It takes the exact same arguments as a call would
   * and returns the call object.
   *
   * The call is executed in the channel's state, but it does not impact the state
   * whatsoever. It uses as an environment the latest channel's state and the current
   * top of the blockchain as seen by the node.
   *
   * @param options - Options
   * @param options.amount - Amount the caller of the contract commits to it
   * @param options.callData - ABI encoded compiled AEVM call data for the code
   * @param options.contract - Address of the contract to call
   * @param options.abiVersion - Version of the ABI
   * @example
   * ```js
   * channel.callContractStatic({
   *   contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
   *   callData: 'cb_1111111111111111...',
   *   amount: 0,
   *   abiVersion: 1
   * }).then(({ returnValue, gasUsed }) => {
   *   console.log('Returned value:', returnValue)
   *   console.log('Gas used:', gasUsed)
   * })
   * ```
   */
  async callContractStatic(
    {
      amount, callData, contract, abiVersion,
    }: {
      amount: number;
      callData: Encoded.ContractBytearray;
      contract: Encoded.ContractAddress;
      abiVersion: AbiVersion;
    },
  ): Promise<CallContractOptions> {
    return snakeToPascalObjKeys(await call(this, 'channels.dry_run.call_contract', {
      amount,
      call_data: callData,
      contract_id: contract,
      abi_version: abiVersion,
    }));
  }

  /**
   * Get contract call result
   *
   * The combination of a caller, contract and a round of execution determines the
   * contract call. Providing an incorrect set of those results in an error response.
   *
   * @param options - Options
   * @param options.caller - Address of contract caller
   * @param options.contract - Address of the contract
   * @param options.round - Round when contract was called
   * @example
   * ```js
   * channel.getContractCall({
   *   caller: 'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
   *   contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
   *   round: 3
   * }).then(({ returnType, returnValue }) => {
   *   if (returnType === 'ok') console.log(returnValue)
   * })
   * ```
   */
  async getContractCall(
    { caller, contract, round }: {
      caller: Encoded.AccountAddress;
      contract: Encoded.ContractAddress;
      round: number;
    },
  ): Promise<ContractCallObject> {
    return snakeToPascalObjKeys(
      await call(this, 'channels.get.contract_call', {
        caller_id: caller,
        contract_id: contract,
        round,
      }),
    );
  }

  /**
   * Get the latest contract state
   *
   * @param contract - Address of the contract
   * @example
   * ```js
   * channel.getContractState(
   *   'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa'
   * ).then(({ contract }) => {
   *   console.log('deposit:', contract.deposit)
   * })
   * ```
   */
  async getContractState(
    contract: Encoded.ContractAddress,
  ): Promise<{ contract: Contract; contractState: object }> {
    const result = await call(this, 'channels.get.contract', { pubkey: contract });
    return snakeToPascalObjKeys({
      ...result,
      contract: snakeToPascalObjKeys(result.contract),
    });
  }

  /**
   * Clean up all locally stored contract calls
   *
   * Contract calls are kept locally in order for the participant to be able to look them up.
   * They consume memory and in order for the participant to free it - one can prune all messages.
   * This cleans up all locally stored contract calls and those will no longer be available for
   * fetching and inspection.
   */
  async cleanContractCalls(): Promise<void> {
    return this.enqueueAction(() => {
      notify(this, 'channels.clean_contract_calls');
      return {
        handler(_: Channel, message: ChannelMessage, state: ChannelState): ChannelFsm {
          if (message.method === 'channels.calls_pruned.reply') {
            state.resolve();
            return { handler: channelOpen };
          }
          state.reject(new UnexpectedChannelMessageError('Unexpected message received'));
          return { handler: channelClosed };
        },
      };
    });
  }
}
