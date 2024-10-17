import verifyTransaction, { ValidatorResult } from './tx/validator.js';
import { ensureError } from './utils/other.js';
import { TransactionError } from './utils/errors.js';
import Node from './Node.js';
import { SignedTx } from './apis/node/index.js';
import { Encoded } from './utils/encoder.js';
import AccountBase from './account/Base.js';
import { buildTxHash } from './tx/builder/index.js';
import { poll, waitForTxConfirm } from './chain.js';

/**
 * @category exception
 */
export class InvalidTxError extends TransactionError {
  validation: ValidatorResult[];

  transaction: Encoded.Transaction;

  constructor(message: string, validation: ValidatorResult[], transaction: Encoded.Transaction) {
    super(message);
    this.name = 'InvalidTxError';
    this.validation = validation;
    this.transaction = transaction;
  }
}

/**
 * Signs and submits transaction for mining
 * @category chain
 * @param txUnsigned - Transaction to sign and submit
 * @param options - Options
 * @returns Transaction details
 */
export async function sendTransaction(
  txUnsigned: Encoded.Transaction,
  {
    onNode,
    onAccount,
    verify = true,
    waitMined = true,
    confirm,
    innerTx,
    ...options
  }: SendTransactionOptions,
): Promise<SendTransactionReturnType> {
  const tx = await onAccount.signTransaction(txUnsigned, {
    ...options,
    onNode,
    innerTx,
    networkId: await onNode.getNetworkId(),
  });

  if (innerTx === true) return { hash: buildTxHash(tx), rawTx: tx };

  if (verify) {
    const validation = await verifyTransaction(tx, onNode);
    if (validation.length > 0) {
      const message = `Transaction verification errors: ${validation
        .map((v: { message: string }) => v.message)
        .join(', ')}`;
      throw new InvalidTxError(message, validation, tx);
    }
  }

  try {
    let __queue;
    try {
      __queue = onAccount != null ? `tx-${onAccount.address}` : null;
    } catch (error) {
      __queue = null;
    }
    const { txHash } = await onNode.postTransaction(
      { tx },
      {
        requestOptions: {
          customHeaders: {
            // TODO: remove __retry-code after fixing https://github.com/aeternity/aeternity/issues/3803
            '__retry-code': '400',
            ...(__queue != null ? { __queue } : {}),
          },
        },
      },
    );

    if (waitMined) {
      const pollResult = await poll(txHash, { onNode, ...options });
      const txData = {
        ...pollResult,
        hash: pollResult.hash as Encoded.TxHash,
        rawTx: tx,
      };
      // wait for transaction confirmation
      if (confirm != null && +confirm > 0) {
        const c = typeof confirm === 'boolean' ? undefined : confirm;
        return {
          ...txData,
          confirmationHeight: await waitForTxConfirm(txHash, { onNode, confirm: c, ...options }),
        };
      }
      return txData;
    }
    return { hash: txHash, rawTx: tx };
  } catch (error) {
    ensureError(error);
    throw Object.assign(error, {
      rawTx: tx,
      verifyTx: async () => verifyTransaction(tx, onNode),
    });
  }
}

type SendTransactionOptionsType = {
  /**
   * Node to use
   */
  onNode: Node;
  /**
   * Account to use
   */
  onAccount: AccountBase;
  /**
   * Verify transaction before broadcast, throw error if not
   */
  verify?: boolean;
  /**
   * Ensure that transaction get into block
   */
  waitMined?: boolean;
  /**
   * Number of micro blocks that should be mined after tx get included
   */
  confirm?: boolean | number;
} & Parameters<typeof poll>[1] &
  Omit<Parameters<typeof waitForTxConfirm>[1], 'confirm'> &
  Parameters<AccountBase['signTransaction']>[1];
export interface SendTransactionOptions extends SendTransactionOptionsType {}
interface SendTransactionReturnType extends Partial<SignedTx> {
  hash: Encoded.TxHash;
  // TODO: use `SignedTx.encodedTx` instead
  rawTx: Encoded.Transaction;
  confirmationHeight?: number;
}
