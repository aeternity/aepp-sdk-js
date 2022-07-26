/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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
import BigNumber from 'bignumber.js';
import { snakeToPascal } from '../utils/string';
import { buildTx, unpackTx } from '../tx/builder';
import { MIN_GAS_PRICE, Tag } from '../tx/builder/constants';
import * as handlers from './handlers';
import {
  eventEmitters,
  status as channelStatus,
  state as channelState,
  initialize,
  enqueueAction,
  send,
  channelId,
  call,
  disconnect as channelDisconnect,
  fsmId as channelFsmId,
  SignTx,
  ChannelOptions,
  ChannelState,
} from './internal';
import { UnknownChannelStateError, ChannelError } from '../utils/errors';
import { Encoded } from '../utils/encoder';
import { ContractCallReturnType } from '../apis/node';
import { pause } from '../utils/other';

function snakeToPascalObjKeys<Type>(obj: object): Type {
  return Object.entries(obj).reduce((result, [key, val]) => ({
    ...result,
    [snakeToPascal(key)]: val,
  }), {}) as Type;
}

type EventCallback = (...args: any[]) => void;

interface CallContractOptions {
  amount?: number | BigNumber;
  callData?: Encoded.ContractBytearray;
  abiVersion?: number;
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
  abiVersion: number;
  active: boolean;
  deposit: number | BigNumber;
  id: string;
  ownerId: string;
  referrerIds: string[];
  vmVersion: number;
}

/**
 * Channel
 * @example
 * ```js
 * await Channel.initialize({
 *   url: 'ws://localhost:3001',
 *   role: 'initiator'
 *   initiatorId: 'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
 *   responderId: 'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E',
 *   initiatorAmount: 1e18,
 *   responderAmount: 1e18,
 *   pushAmount: 0,
 *   channelReserve: 0,
 *   ttl: 1000,
 *   host: 'localhost',
 *   port: 3002,
 *   lockPeriod: 10,
 *   async sign (tag, tx) => await account.signTransaction(tx)
 * })
 * ```
 */
export default class Channel {
  /**
   * @param options - Channel params
   * @param options.url - Channel url (for example: "ws://localhost:3001")
   * @param options.role - Participant role ("initiator" or "responder")
   * @param options.initiatorId - Initiator's public key
   * @param options.responderId - Responder's public key
   * @param options.pushAmount - Initial deposit in favour of the responder by the initiator
   * @param options.initiatorAmount - Amount of coins the initiator has committed to
   * the channel
   * @param options.responderAmount - Amount of coins the responder has committed to
   * the channel
   * @param options.channelReserve - The minimum amount both peers need to maintain
   * @param options.ttl - Minimum block height to include the channel_create_tx
   * @param options.host - Host of the responder's node
   * @param options.port - The port of the responders node
   * @param options.lockPeriod - Amount of blocks for disputing a solo close
   * @param options.existingChannelId - Existing channel id (required if reestablishing a
   * channel)
   * @param options.offchainTx - Offchain transaction (required if reestablishing
   * a channel)
   * @param options.timeoutIdle - The time waiting for a new event to be initiated
   * (default: 600000)
   * @param options.timeoutFundingCreate - The time waiting for the initiator to produce
   * the create channel transaction after the noise session had been established (default: 120000)
   * @param options.timeoutFundingSign - The time frame the other client has to sign an
   * off-chain update after our client had initiated and signed it. This applies only for double
   * signed on-chain intended updates: channel create transaction, deposit, withdrawal and etc.
   * (default: 120000)
   * @param options.timeoutFundingLock - The time frame the other client has to confirm an
   * on-chain transaction reaching maturity (passing minimum depth) after the local node has
   * detected this. This applies only for double signed on-chain intended updates: channel create
   * transaction, deposit, withdrawal and etc. (default: 360000)
   * @param options.timeoutSign - The time frame the client has to return a signed
   * off-chain update or to decline it. This applies for all off-chain updates (default: 500000)
   * @param options.timeoutAccept - The time frame the other client has to react to an
   * event. This applies for all off-chain updates that are not meant to land on-chain, as well as
   * some special cases: opening a noise connection, mutual closing acknowledgement and
   * reestablishing an existing channel (default: 120000)
   * @param options.timeoutInitialized - the time frame the responder has to accept an
   * incoming noise session. Applicable only for initiator (default: timeout_accept's value)
   * @param options.timeoutAwaitingOpen - The time frame the initiator has to start an
   * outgoing noise session to the responder's node. Applicable only for responder (default:
   * timeout_idle's value)
   * @param options.debug=false - Log websocket communication
   * @param options.sign - Function which verifies and signs transactions
   */
  static async initialize(options: ChannelOptions): Promise<Channel> {
    const channel = new Channel();
    await initialize(
      channel,
      options.existingFsmId != null ? handlers.awaitingReconnection : handlers.awaitingConnection,
      handlers.channelOpen,
      options,
    );
    return channel;
  }

  /**
   * Register event listener function
   *
   * Possible events:
   *
   *   - "error"
   *   - "onChainTx"
   *   - "ownWithdrawLocked"
   *   - "withdrawLocked"
   *   - "ownDepositLocked"
   *   - "depositLocked"
   *
   * TODO: the event list looks outdated
   *
   * @param eventName - Event name
   * @param callback - Callback function
   */
  // TODO define specific callback type depending on the event name
  on(eventName: string, callback: EventCallback): void {
    const eventEmitter = eventEmitters.get(this);
    if (eventEmitter == null) throw new UnknownChannelStateError();
    eventEmitter.on(eventName, callback);
  }

  /**
   * Remove event listener function
   * @param eventName - Event name
   * @param callback - Callback function
   */
  off(eventName: string, callback: EventCallback): void {
    const eventEmitter = eventEmitters.get(this);
    if (eventEmitter == null) throw new UnknownChannelStateError();
    eventEmitter.removeListener(eventName, callback);
  }

  /**
   * Close the connection
   */
  disconnect(): void {
    return channelDisconnect(this);
  }

  /**
   * Get current status
   *
   */
  status(): string {
    const status = channelStatus.get(this);
    if (status == null) throw new UnknownChannelStateError();
    return status;
  }

  /**
   * Get current state
   */
  async state(): Promise<ChannelState> {
    return snakeToPascalObjKeys(await call(this, 'channels.get.offchain_state', {}));
  }

  /**
   * Get current round
   *
   * If round cannot be determined (for example when channel has not been opened)
   * it will return `null`.
   *
   */
  round(): number | null {
    const state = channelState.get(this);
    if (state == null) {
      return null;
    }
    const { txType, tx } = unpackTx(state, Tag.SignedTx).tx.encodedTx;
    switch (txType) {
      case Tag.ChannelCreateTx:
        return 1;
      case Tag.ChannelOffChainTx:
      case Tag.ChannelWithdrawTx:
      case Tag.ChannelDepositTx:
        return tx.round;
      default:
        return null;
    }
  }

  /**
   * Get channel id
   *
   */
  id(): string {
    const id = channelId.get(this);
    if (id == null) throw new ChannelError('Channel is not initialized');
    return id;
  }

  /**
   * Get channel's fsm id
   *
   */
  fsmId(): string {
    const id = channelFsmId.get(this);
    if (id == null) throw new ChannelError('Channel is not initialized');
    return id;
  }

  /**
   * Trigger a transfer update
   *
   * The transfer update is moving coins from one channel account to another.
   * The update is a change to be applied on top of the latest state.
   *
   * Sender and receiver are the channel parties. Both the initiator and responder
   * can take those roles. Any public key outside the channel is considered invalid.
   *
   * @param from - Sender's public address
   * @param to - Receiver's public address
   * @param amount - Transaction amount
   * @param sign - Function which verifies and signs offchain transaction
   * @param metadata - Metadata

   * @example
   * ```js
   * channel.update(
   *   'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
   *   'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E',
   *   10,
   *   async (tx) => await account.signTransaction(tx)
   * ).then(({ accepted, signedTx }) =>
   *   if (accepted) {
   *     console.log('Update has been accepted')
   *   }
   * )
   * ```
   */
  async update(
    from: Encoded.AccountAddress,
    to: Encoded.AccountAddress,
    amount: number | BigNumber,
    sign: SignTx,
    metadata: string[] = [],
  ): Promise<{
      accepted: boolean;
      signedTx?: Encoded.Transaction;
      errorCode?: number;
      errorMessage?: string;
    }> {
    return new Promise((resolve, reject) => {
      enqueueAction(
        this,
        (_channel, state) => state?.handler === handlers.channelOpen,
        (channel) => {
          send(channel, {
            jsonrpc: '2.0',
            method: 'channels.update.new',
            params: {
              from, to, amount, meta: metadata,
            },
          });
          return {
            handler: handlers.awaitingOffChainTx,
            state: {
              resolve,
              reject,
              sign,
            },
          };
        },
      );
    });
  }

  /**
   * Get proof of inclusion
   *
   * If a certain address of an account or a contract is not found
   * in the state tree - the response is an error.
   *
   * @param addresses - Addresses
   * @param addresses.accounts - List of account addresses to include in poi
   * @param addresses.contracts - List of contract addresses to include in poi
   * @example
   * ```js
   * channel.poi({
   *   accounts: [
   *     'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
   *     'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E'
   *   ],
   *   contracts: ['ct_2dCUAWYZdrWfACz3a2faJeKVTVrfDYxCQHCqAt5zM15f3u2UfA']
   * }).then(poi => console.log(poi))
   * ```
   */
  async poi(
    { accounts, contracts }: {
      accounts: Encoded.AccountAddress[];
      contracts?: Encoded.ContractAddress[];
    },
  ): Promise<Encoded.Poi> {
    return (await call(this, 'channels.get.poi', { accounts, contracts })).poi;
  }

  /**
   * Get balances
   *
   * The accounts param contains a list of addresses to fetch balances of.
   * Those can be either account balances or a contract ones, encoded as an account addresses.
   *
   * If a certain account address had not being found in the state tree - it is simply
   * skipped in the response.
   *
   * @param accounts - List of addresses to fetch balances from
   * @example
   * ```js
   * channel.balances([
   *   'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
   *   'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E'
   *   'ct_2dCUAWYZdrWfACz3a2faJeKVTVrfDYxCQHCqAt5zM15f3u2UfA'
   * ]).then(balances =>
   *   console.log(balances['ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH'])
   * )
   * ```
   */
  async balances(
    accounts: Encoded.AccountAddress[],
  ): Promise<{ [key: Encoded.AccountAddress]: string }> {
    return Object.fromEntries(
      (await call(this, 'channels.get.balances', { accounts }))
        .map((item: {
          account: Encoded.AccountAddress;
          balance: string;
        }) => [item.account, item.balance]),
    );
  }

  /**
   * Leave channel
   *
   * It is possible to leave a channel and then later reestablish the channel
   * off-chain state and continue operation. When a leave method is called,
   * the channel fsm passes it on to the peer fsm, reports the current mutually
   * signed state and then terminates.
   *
   * The channel can be reestablished by instantiating another Channel instance
   * with two extra params: existingChannelId and offchainTx (returned from leave
   * method as channelId and signedTx respectively).
   *
   * @example
   * ```js
   * channel.leave().then(({ channelId, signedTx }) => {
   *   console.log(channelId)
   *   console.log(signedTx)
   * })
   * ```
   */
  async leave(): Promise<{ channelId: string; signedTx: Encoded.Transaction }> {
    return new Promise((resolve, reject) => {
      enqueueAction(
        this,
        (channel, state) => state?.handler === handlers.channelOpen,
        (channel) => {
          send(channel, { jsonrpc: '2.0', method: 'channels.leave', params: {} });
          return {
            handler: handlers.awaitingLeave,
            state: { resolve, reject },
          };
        },
      );
    });
  }

  /**
   * Trigger mutual close
   *
   * At any moment after the channel is opened, a closing procedure can be triggered.
   * This can be done by either of the parties. The process is similar to the off-chain updates.
   *
   * @param sign - Function which verifies and signs mutual close transaction
   * @example
   * ```js
   * channel.shutdown(
   *   async (tx) => await account.signTransaction(tx)
   * ).then(tx => console.log('on_chain_tx', tx))
   * ```
   */
  async shutdown(sign: Function): Promise<Encoded.Transaction> {
    return new Promise((resolve, reject) => {
      enqueueAction(
        this,
        (_channel, state) => state?.handler === handlers.channelOpen,
        (channel) => {
          send(channel, { jsonrpc: '2.0', method: 'channels.shutdown', params: {} });
          return {
            handler: handlers.awaitingShutdownTx,
            state: {
              sign,
              resolve,
              reject,
            },
          };
        },
      );
    });
  }

  /**
   * Withdraw coins from the channel
   *
   * After the channel had been opened any of the participants can initiate a withdrawal.
   * The process closely resembles the update. The most notable difference is that the
   * transaction has been co-signed: it is channel_withdraw_tx and after the procedure
   * is finished - it is being posted on-chain.
   *
   * Any of the participants can initiate a withdrawal. The only requirements are:
   *
   *   - Channel is already opened
   *   - No off-chain update/deposit/withdrawal is currently being performed
   *   - Channel is not being closed or in a solo closing state
   *   - The withdrawal amount must be equal to or greater than zero, and cannot exceed
   *     the available balance on the channel (minus the channel_reserve)
   *
   * After the other party had signed the withdraw transaction, the transaction is posted
   * on-chain and onOnChainTx callback is called with on-chain transaction as first argument.
   * After computing transaction hash it can be tracked on the chain: entering the mempool,
   * block inclusion and a number of confirmations.
   *
   * After the minimum_depth block confirmations onOwnWithdrawLocked callback is called
   * (without any arguments).
   *
   * When the other party had confirmed that the block height needed is reached
   * onWithdrawLocked callback is called (without any arguments).
   *
   * @param amount - Amount of coins to withdraw
   * @param sign - Function which verifies and signs withdraw transaction
   * @param callbacks - Callbacks
   * @param callbacks.onOnChainTx - Called when withdraw transaction has been posted
   * on chain
   * @param callbacks.onOwnWithdrawLocked
   * @param callbacks.onWithdrawLocked
   * @example
   * ```js
   * channel.withdraw(
   *   100,
   *   async (tx) => await account.signTransaction(tx),
   *   { onOnChainTx: (tx) => console.log('on_chain_tx', tx) }
   * ).then(({ accepted, signedTx }) => {
   *   if (accepted) {
   *     console.log('Withdrawal has been accepted')
   *   } else {
   *     console.log('Withdrawal has been rejected')
   *   }
   * })
   * ```
   */
  async withdraw(
    amount: number | BigNumber,
    sign: SignTx,
    { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked }:
    Pick<ChannelState, 'onOnChainTx' | 'onOwnWithdrawLocked' | 'onWithdrawLocked'> = {},
  ): Promise<{ accepted: boolean; signedTx: Encoded.Transaction }> {
    return new Promise((resolve, reject) => {
      enqueueAction(
        this,
        (_channel, state) => state?.handler === handlers.channelOpen,
        (channel) => {
          send(channel, { jsonrpc: '2.0', method: 'channels.withdraw', params: { amount } });
          return {
            handler: handlers.awaitingWithdrawTx,
            state: {
              sign,
              resolve,
              reject,
              onOnChainTx,
              onOwnWithdrawLocked,
              onWithdrawLocked,
            },
          };
        },
      );
    });
  }

  /**
   * Deposit coins into the channel
   *
   * After the channel had been opened any of the participants can initiate a deposit.
   * The process closely resembles the update. The most notable difference is that the
   * transaction has been co-signed: it is channel_deposit_tx and after the procedure
   * is finished - it is being posted on-chain.
   *
   * Any of the participants can initiate a deposit. The only requirements are:
   *
   *   - Channel is already opened
   *   - No off-chain update/deposit/withdrawal is currently being performed
   *   - Channel is not being closed or in a solo closing state
   *   - The deposit amount must be equal to or greater than zero, and cannot exceed
   *     the available balance on the channel (minus the channel_reserve)
   *
   * After the other party had signed the deposit transaction, the transaction is posted
   * on-chain and onOnChainTx callback is called with on-chain transaction as first argument.
   * After computing transaction hash it can be tracked on the chain: entering the mempool,
   * block inclusion and a number of confirmations.
   *
   * After the minimum_depth block confirmations onOwnDepositLocked callback is called
   * (without any arguments).
   *
   * When the other party had confirmed that the block height needed is reached
   * onDepositLocked callback is called (without any arguments).
   *
   * @param amount - Amount of coins to deposit
   * @param sign - Function which verifies and signs deposit transaction
   * @param callbacks - Callbacks
   * @param callbacks.onOnChainTx - Called when deposit transaction has been posted
   * on chain
   * @param callbacks.onOwnDepositLocked
   * @param callbacks.onDepositLocked
   * @example
   * ```js
   * channel.deposit(
   *   100,
   *   async (tx) => await account.signTransaction(tx),
   *   { onOnChainTx: (tx) => console.log('on_chain_tx', tx) }
   * ).then(({ accepted, state }) => {
   *   if (accepted) {
   *     console.log('Deposit has been accepted')
   *     console.log('The new state is:', state)
   *   } else {
   *     console.log('Deposit has been rejected')
   *   }
   * })
   * ```
   */
  async deposit(
    amount: number | BigNumber,
    sign: SignTx,
    { onOnChainTx, onOwnDepositLocked, onDepositLocked }:
    Pick<ChannelState, 'onOnChainTx' | 'onOwnDepositLocked' | 'onDepositLocked'> = {},
  ): Promise<{ accepted: boolean; state: ChannelState }> {
    return new Promise((resolve, reject) => {
      enqueueAction(
        this,
        (_channel, state) => state?.handler === handlers.channelOpen,
        (channel) => {
          send(channel, { jsonrpc: '2.0', method: 'channels.deposit', params: { amount } });
          return {
            handler: handlers.awaitingDepositTx,
            state: {
              sign,
              resolve,
              reject,
              onOnChainTx,
              onOwnDepositLocked,
              onDepositLocked,
            },
          };
        },
      );
    });
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
      vmVersion: number;
      abiVersion: number;
    },
    sign: SignTx,
  ): Promise<{
      accepted: boolean; signedTx: Encoded.Transaction; address: Encoded.ContractAddress;
    }> {
    return new Promise((resolve, reject) => {
      enqueueAction(
        this,
        (_channel, state) => state?.handler === handlers.channelOpen,
        (channel) => {
          send(channel, {
            jsonrpc: '2.0',
            method: 'channels.update.new_contract',
            params: {
              code,
              call_data: callData,
              deposit,
              vm_version: vmVersion,
              abi_version: abiVersion,
            },
          });
          return {
            handler: handlers.awaitingNewContractTx,
            state: {
              sign,
              resolve,
              reject,
            },
          };
        },
      );
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
    return new Promise((resolve, reject) => {
      enqueueAction(
        this,
        (_channel, state) => state?.handler === handlers.channelOpen,
        (channel) => {
          send(channel, {
            jsonrpc: '2.0',
            method: 'channels.update.call_contract',
            params: {
              amount,
              call_data: callData,
              contract_id: contract,
              abi_version: abiVersion,
            },
          });
          return {
            handler: handlers.awaitingCallContractUpdateTx,
            state: { resolve, reject, sign },
          };
        },
      );
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
      abiVersion: number;
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
    return new Promise((resolve, reject) => {
      enqueueAction(
        this,
        (_channel, state) => state?.handler === handlers.channelOpen,
        (channel) => {
          send(channel, {
            jsonrpc: '2.0',
            method: 'channels.force_progress',
            params: {
              amount,
              call_data: callData,
              contract_id: contract,
              abi_version: abiVersion,
              gas_price: gasPrice,
              gas: gasLimit,
            },
          });
          return {
            handler: handlers.awaitingCallContractForceProgressUpdate,
            state: {
              resolve, reject, sign, onOnChainTx,
            },
          };
        },
      );
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
      abiVersion: number;
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
  ): Promise<{
      returnType: ContractCallReturnType;
      returnValue: string;
      gasPrice: number | BigNumber;
      gasUsed: number | BigNumber;
      height: number;
      log: string;
    }> {
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
    return new Promise((resolve, reject) => {
      enqueueAction(
        this,
        (_channel, state) => state?.handler === handlers.channelOpen,
        (channel) => {
          send(channel, {
            jsonrpc: '2.0',
            method: 'channels.clean_contract_calls',
            params: {},
          });
          return {
            handler: handlers.awaitingCallsPruned,
            state: { resolve, reject },
          };
        },
      );
    });
  }

  /**
   * Send generic message
   *
   * If message is an object it will be serialized into JSON string
   * before sending.
   *
   * If there is ongoing update that has not yet been finished the message
   * will be sent after that update is finalized.
   *
   * @param message - Message
   * @param recipient - Address of the recipient
   * @example
   * ```js
   * channel.sendMessage(
   *   'hello world',
   *   'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH'
   * )
   * ```
   */
  async sendMessage(
    message: string | object,
    recipient: Encoded.AccountAddress,
  ): Promise<void> {
    const info = typeof message === 'object' ? JSON.stringify(message) : message;
    if (this.status() === 'connecting') {
      await new Promise<void>((resolve) => {
        const onStatusChanged = (status: string): void => {
          if (status === 'connecting') return;
          resolve();
          this.off('statusChanged', onStatusChanged);
        };
        this.on('statusChanged', onStatusChanged);
      });
      // For some reason we can't immediately send a message when connection is
      // established. Thus we wait 500ms which seems to work.
      await pause(500);
    }
    send(this, {
      jsonrpc: '2.0',
      method: 'channels.message',
      params: { info, to: recipient },
    });
  }

  static async reconnect(options: ChannelOptions, txParams: any): Promise<Channel> {
    const { sign } = options;

    return Channel.initialize({
      ...options,
      reconnectTx: await sign('reconnect', buildTx(txParams, Tag.ChannelClientReconnectTx).tx),
    });
  }
}
