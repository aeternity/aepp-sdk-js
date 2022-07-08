import { EncodedData } from '../utils/encoder';
import { createMetaTx } from '../contract/ga';

/**
 * @deprecated Use createMetaTx instead
 * @hidden
 */
// eslint-disable-next-line import/prefer-default-export
export async function signUsingGA(
  tx: EncodedData<'tx'>,
  { authData, authFun, ...options }: {
    authData: Parameters<typeof createMetaTx>[1];
    authFun: Parameters<typeof createMetaTx>[2];
  } & Parameters<typeof createMetaTx>[3],
): Promise<EncodedData<'tx'>> {
  return createMetaTx(tx, authData, authFun, options);
}
