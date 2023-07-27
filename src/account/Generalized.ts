import AccountBase from './Base';
import {
  ArgumentError,
  InternalError,
  InvalidAuthDataError,
  NotImplementedError,
} from '../utils/errors';
import { decode, Encoded } from '../utils/encoder';
import { getAccount } from '../chain';
import Contract from '../contract/Contract';
import { buildTxAsync, buildTx } from '../tx/builder';
import { Tag } from '../tx/builder/constants';

/**
 * Generalized account class
 */
export default class AccountGeneralized extends AccountBase {
  override readonly address: Encoded.AccountAddress;

  #authFun?: string;

  /**
   * @param address - Address of generalized account
   */
  constructor(address: Encoded.AccountAddress) {
    super();
    decode(address);
    this.address = address;
  }

  // eslint-disable-next-line class-methods-use-this
  override async sign(): Promise<Uint8Array> {
    throw new NotImplementedError('Can\'t sign using generalized account');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signMessage(): Promise<Uint8Array> {
    throw new NotImplementedError('Can\'t sign using generalized account');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signTypedData(): Promise<Encoded.Signature> {
    throw new NotImplementedError('Can\'t sign using generalized account');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signDelegationToContract(): Promise<Encoded.Signature> {
    throw new NotImplementedError('signing delegation to contract using generalized account');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signNameDelegationToContract(): Promise<Encoded.Signature> {
    throw new NotImplementedError('signing delegation to contract using generalized account');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signOracleQueryDelegationToContract(): Promise<Encoded.Signature> {
    throw new NotImplementedError('signing delegation to contract using generalized account');
  }

  override async signTransaction(
    tx: Encoded.Transaction,
    { authData, onCompiler, onNode }: Parameters<AccountBase['signTransaction']>[1],
  ): Promise<Encoded.Transaction> {
    if (authData == null || onCompiler == null || onNode == null) {
      throw new ArgumentError('authData, onCompiler, onNode', 'provided', null);
    }
    const {
      callData, sourceCode, args, fee, gasLimit, gasPrice,
    } = typeof authData === 'function' ? await authData(tx) : authData;

    const authCallData = callData ?? await (async () => {
      if (this.#authFun == null) {
        const account = await getAccount(this.address, { onNode });
        if (account.kind !== 'generalized') {
          throw new ArgumentError('account kind', 'generalized', account.kind);
        }
        this.#authFun = account.authFun;
      }
      if (this.#authFun == null) {
        throw new InternalError('Account in generalised, but authFun not provided');
      }

      if (sourceCode == null || args == null) {
        throw new InvalidAuthDataError('Auth data must contain sourceCode and args or callData.');
      }
      const contract = await Contract.initialize({ onCompiler, onNode, sourceCode });
      return contract._calldata.encode(contract._name, this.#authFun, args);
    })();

    const gaMetaTx = await buildTxAsync({
      tag: Tag.GaMetaTx,
      tx: { tag: Tag.SignedTx, encodedTx: decode(tx), signatures: [] },
      gaId: this.address,
      authData: authCallData,
      fee,
      gasLimit,
      gasPrice,
      onNode,
    });
    return buildTx({ tag: Tag.SignedTx, encodedTx: decode(gaMetaTx), signatures: [] });
  }
}
