import { Encoded } from '../utils/encoder';
import Node from '../Node';
import CompilerBase from '../contract/compiler/Base';

interface AuthData {
  gasLimit?: number;
  callData?: Encoded.ContractBytearray;
  sourceCode?: string;
  args?: any[];
}

/**
 * Account is one of the three basic building blocks of an
 * {@link AeSdk} and provides access to a signing key pair.
 */
export default abstract class AccountBase {
  /**
   * Sign encoded transaction
   * @param tx - Transaction to sign
   * @param options - Options
   * @param options.innerTx - Sign as inner transaction for PayingFor
   * @param options.authData - Object with gaMeta params
   * @returns Signed transaction
   */
  abstract signTransaction(
    tx: Encoded.Transaction,
    options: {
      innerTx?: boolean;
      networkId?: string;
      authData?: AuthData | ((tx: Encoded.Transaction) => Promise<AuthData>);
      onNode?: Node;
      onCompiler?: CompilerBase;
      aeppOrigin?: string;
      aeppRpcClientId?: string;
    },
  ): Promise<Encoded.Transaction>;

  /**
   * Sign message
   * @param message - Message to sign
   * @param options - Options
   * @returns Signature as hex string of Uint8Array
   */
  abstract signMessage(
    message: string,
    options?: {
      aeppOrigin?: string;
      aeppRpcClientId?: string;
    },
  ): Promise<Uint8Array>;

  /**
   * Sign data blob
   * @param data - Data blob to sign
   * @param options - Options
   * @returns Signed data blob
   */
  abstract sign(data: string | Uint8Array, options?: any): Promise<Uint8Array>;

  /**
   * Account address
   */
  readonly address: Encoded.AccountAddress;
}
