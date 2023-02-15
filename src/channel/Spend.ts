import BigNumber from 'bignumber.js';
import {
  notify, call, SignTx, ChannelState, ChannelMessage, ChannelFsm, changeState,
} from './internal';
import { Encoded } from '../utils/encoder';
import { pause } from '../utils/other';
import Channel from './Base';
import { ChannelConnectionError } from '../utils/errors';
import {
  awaitingCompletion, channelOpen, handleUnexpectedMessage, signAndNotify,
} from './handlers';
import { unpackTx } from '../tx/builder';
import { Tag } from '../tx/builder/constants';
import { TxUnpacked } from '../tx/builder/schema.generated';

export default class ChannelSpend extends Channel {
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
    return this.enqueueAction(() => {
      notify(this, 'channels.update.new', {
        from, to, amount, meta: metadata,
      });

      const awaitingOffChainTx = async (
        _: Channel,
        message: ChannelMessage,
        state: ChannelState,
      ): Promise<ChannelFsm> => {
        if (message.method === 'channels.sign.update') {
          const isError = await signAndNotify(
            this,
            'channels.update',
            message.params.data,
            async (tx) => sign(tx, { updates: message.params.data.updates }),
          );
          if (isError) return { handler: awaitingOffChainTx, state };
          return {
            handler: (_2: Channel, message2: ChannelMessage): ChannelFsm => (
              awaitingCompletion(this, message2, state, () => {
                changeState(this, message2.params.data.state);
                state.resolve({ accepted: true, signedTx: message2.params.data.state });
                return { handler: channelOpen };
              })
            ),
            state,
          };
        }
        if (message.method === 'channels.error') {
          state.reject(new ChannelConnectionError(message.data.message));
          return { handler: channelOpen };
        }
        return awaitingCompletion(this, message, state);
      };

      return { handler: awaitingOffChainTx };
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
  ): Promise<TxUnpacked & { tag: Tag.TreesPoi }> {
    return unpackTx(
      (await call(this, 'channels.get.poi', { accounts, contracts })).poi,
      Tag.TreesPoi,
    );
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

  private async awaitingActionTx(
    action: 'deposit' | 'withdraw',
    message: ChannelMessage,
    state: ChannelState,
  ): Promise<ChannelFsm> {
    if (message.method !== `channels.sign.${action}_tx`) {
      return handleUnexpectedMessage(this, message, state);
    }

    const awaitingActionCompletion = (_: Channel, message2: ChannelMessage): ChannelFsm => {
      if (message2.method === 'channels.on_chain_tx') {
        state.onOnChainTx?.(message2.params.data.tx);
        return { handler: awaitingActionCompletion, state };
      }
      if (
        message2.method === 'channels.info'
        && [`own_${action}_locked`, `${action}_locked`].includes(message2.params.data.event)
      ) {
        const Action = action === 'deposit' ? 'Deposit' : 'Withdraw';
        const isOwn: boolean = message2.params.data.event.startsWith('own_');
        state[`on${isOwn ? 'Own' : ''}${Action}Locked`]?.();
        return { handler: awaitingActionCompletion, state };
      }
      return awaitingCompletion(this, message2, state, () => {
        changeState(this, message2.params.data.state);
        state.resolve({ accepted: true, signedTx: message2.params.data.state });
        return { handler: channelOpen };
      });
    };

    const { sign } = state;
    await signAndNotify(
      this,
      `channels.${action}_tx`,
      message.params.data,
      async (tx) => sign(tx, { updates: message.params.data.updates }),
    );
    return { handler: awaitingActionCompletion, state };
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
    return this.enqueueAction(() => {
      notify(this, 'channels.withdraw', { amount });
      return {
        handler: async (
          _: Channel,
          message: ChannelMessage,
          state: ChannelState,
        ): Promise<ChannelFsm> => (
          this.awaitingActionTx('withdraw', message, state)
        ),
        state: {
          sign,
          onOnChainTx,
          onOwnWithdrawLocked,
          onWithdrawLocked,
        },
      };
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
    return this.enqueueAction(() => {
      notify(this, 'channels.deposit', { amount });
      return {
        handler: async (
          _: Channel,
          message: ChannelMessage,
          state: ChannelState,
        ): Promise<ChannelFsm> => (
          this.awaitingActionTx('deposit', message, state)
        ),
        state: {
          sign,
          onOnChainTx,
          onOwnDepositLocked,
          onDepositLocked,
        },
      };
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
    notify(this, 'channels.message', { info, to: recipient });
  }
}
