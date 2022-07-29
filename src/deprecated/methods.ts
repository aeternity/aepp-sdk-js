import { Encoded } from '../utils/encoder';
import { createMetaTx } from '../contract/ga';
import Node from '../Node';

/**
 * @deprecated Use createMetaTx instead
 * @hidden
 */
export async function signUsingGA(
  tx: Encoded.Transaction,
  { authData, authFun, ...options }: {
    authData: Parameters<typeof createMetaTx>[1];
    authFun: Parameters<typeof createMetaTx>[2];
  } & Parameters<typeof createMetaTx>[3],
): Promise<Encoded.Transaction> {
  return createMetaTx(tx, authData, authFun, options);
}

/**
 * @deprecated Use getHeight instead
 * @hidden
 */
export async function height({ onNode }: { onNode: Node }): Promise<number> {
  return (await onNode.getCurrentKeyBlockHeight()).height;
}
