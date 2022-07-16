import { EncodedData } from '../utils/encoder';
import { createMetaTx } from '../contract/ga';
import Node from '../Node';

/**
 * @deprecated Use createMetaTx instead
 * @hidden
 */
export async function signUsingGA(
  tx: EncodedData<'tx'>,
  { authData, authFun, ...options }: {
    authData: Parameters<typeof createMetaTx>[1];
    authFun: Parameters<typeof createMetaTx>[2];
  } & Parameters<typeof createMetaTx>[3],
): Promise<EncodedData<'tx'>> {
  return createMetaTx(tx, authData, authFun, options);
}

/**
 * @deprecated Use createMetaTx instead
 * @hidden
 */
export async function height({ onNode }: { onNode: Node }): Promise<number> {
  return (await onNode.getCurrentKeyBlockHeight()).height;
}
