import { Encoded } from '../utils/encoder';
import Node from '../Node';
import CompilerBase from '../contract/compiler/Base';
import { AensName, Int } from '../tx/builder/constants';
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
   * @param type - Type of data to sign
   * @param data - Encoded data to sign
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
   * Sign delegation of AENS, oracle operations to a contract
   * @param contractAddress - Address of a contract to delegate permissions to
   * @param options - Options
   * @returns Signature
   */
  // TODO: make abstract in the next major release
  // eslint-disable-next-line class-methods-use-this
  async signDelegationToContract(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    contractAddress: Encoded.ContractAddress,
    options?: {
      networkId?: string;
      aeppOrigin?: string;
      aeppRpcClientId?: string;
    },
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Promise<Encoded.Signature> {
    throw new NotImplementedError('signDelegationToContract method');
  }

  /**
   * Sign delegation of an AENS name to a contract
   * @param contractAddress - Address of a contract to delegate permissions to
   * @param name - AENS name to manage by a contract
   * @param options - Options
   * @returns Signature
   */
  // TODO: make abstract in the next major release
  // eslint-disable-next-line class-methods-use-this
  async signNameDelegationToContract(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    contractAddress: Encoded.ContractAddress,
    name: AensName,
    options?: {
      networkId?: string;
      aeppOrigin?: string;
      aeppRpcClientId?: string;
    },
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Promise<Encoded.Signature> {
    throw new NotImplementedError('signNameDelegationToContract method');
  }

  /**
   * Sign delegation of oracle query to a contract
   *
   * Warning! Implementations needs to ensure that decoded oracle query id is not equal to decoded
   * current account address unless https://github.com/aeternity/aesophia/issues/475 is fixed.
   *
   * Warning! Implementations needs to ensure that oracle query and contract exists unless
   * https://github.com/aeternity/aesophia/issues/474 is fixed.
   *
   * @param contractAddress - Address of a contract to delegate permissions to
   * @param oracleQueryId - Oracle query ID to reply by a contract
   * @param options - Options
   * @returns Signature
   */
  // TODO: make abstract in the next major release
  // eslint-disable-next-line class-methods-use-this
  async signOracleQueryDelegationToContract(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    contractAddress: Encoded.ContractAddress,
    oracleQueryId: Encoded.OracleQueryId,
    options?: {
      networkId?: string;
      aeppOrigin?: string;
      aeppRpcClientId?: string;
    },
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Promise<Encoded.Signature> {
    throw new NotImplementedError('signOracleQueryDelegationToContract method');
  }

  /**
   * Sign data blob
   * @param data - Data blob to sign
   * @param options - Options
   * @returns Signature
   */
  abstract sign(data: string | Uint8Array, options?: any): Promise<Uint8Array>;

  /**
   * Account address
   */
  readonly address!: Encoded.AccountAddress;
}
