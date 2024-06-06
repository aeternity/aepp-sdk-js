import { Encoded } from '../utils/encoder';
import Node from '../Node';
import CompilerBase from '../contract/compiler/Base';
import { Int } from '../tx/builder/constants';
import { AciValue, Domain } from '../utils/typed-data';
import { NotImplementedError } from '../utils/errors';

interface AuthData {
  fee?: Int;
  gasLimit?: number;
  gasPrice?: Int;
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
   * @returns Signature
   */
  abstract signMessage(
    message: string,
    options?: {
      aeppOrigin?: string;
      aeppRpcClientId?: string;
    },
  ): Promise<Uint8Array>;

  /**
   * Sign typed data
   * @param data - Encoded data to sign
   * @param aci - Type of data to sign
   * @param options - Options
   * @returns Signature
   */
  // TODO: make abstract in the next major release
  // eslint-disable-next-line class-methods-use-this
  async signTypedData(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    data: Encoded.ContractBytearray,
    aci: AciValue,
    options?: Domain & {
      aeppOrigin?: string;
      aeppRpcClientId?: string;
    },
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Promise<Encoded.Signature> {
    throw new NotImplementedError('signTypedData method');
  }

  /**
   * Sign data blob
   * @param data - Data blob to sign
   * @param options - Options
   * @returns Signature
   */
  abstract sign(
    data: string | Uint8Array,
    options?: {
      aeppOrigin?: string;
      aeppRpcClientId?: string;
    },
  ): Promise<Uint8Array>;

  /**
   * Account address
   */
  readonly address!: Encoded.AccountAddress;

  /**
   * Sign delegation, works only in Ceres
   * @param delegation - Delegation to sign
   * @param options - Options
   * @returns Signature
   */
  // TODO: make abstract in the next major release
  // eslint-disable-next-line class-methods-use-this
  async signDelegation(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    delegation: Encoded.Bytearray,
    options?: {
      networkId?: string;
      aeppOrigin?: string;
      aeppRpcClientId?: string;
    },
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Promise<Encoded.Signature> {
    throw new NotImplementedError('signDelegation method');
  }
}
