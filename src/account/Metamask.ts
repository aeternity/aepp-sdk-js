import type { BaseProvider } from '@metamask/providers';
import AccountBase from './Base.js';
import { Encoded } from '../utils/encoder.js';
import { ArgumentError, InternalError, NotImplementedError } from '../utils/errors.js';

export const snapId = 'npm:@aeternity-snap/plugin';

export async function invokeSnap<R>(
  provider: BaseProvider,
  method: string,
  params: unknown,
  key: string,
): Promise<R> {
  const response = await provider.request<{ [k in string]: unknown }>({
    method: 'wallet_invokeSnap',
    params: { snapId, request: { method, params } },
  });
  if (response == null) throw new InternalError('Empty MetaMask response');
  if (!(key in response)) {
    throw new InternalError(`Key ${key} missed in response ${JSON.stringify(response)}`);
  }
  return response[key] as R;
}

/**
 * Account connected to Aeternity Snap for MetaMask
 * https://www.npmjs.com/package/\@aeternity-snap/plugin
 */
export default class AccountMetamask extends AccountBase {
  readonly provider: BaseProvider;

  readonly index: number;

  override readonly address: Encoded.AccountAddress;

  /**
   * @param address - Address of account
   */
  constructor(provider: BaseProvider, index: number, address: Encoded.AccountAddress) {
    super();
    this.provider = provider;
    this.index = index;
    this.address = address;
  }

  // eslint-disable-next-line class-methods-use-this
  override async sign(): Promise<Uint8Array> {
    throw new NotImplementedError('RAW signing using MetaMask');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signTypedData(): Promise<Encoded.Signature> {
    throw new NotImplementedError('Typed data signing using MetaMask');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signDelegation(): Promise<Encoded.Signature> {
    throw new NotImplementedError('signing delegation using MetaMask');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signTransaction(
    tx: Encoded.Transaction,
    { innerTx, networkId }: { innerTx?: boolean; networkId?: string } = {},
  ): Promise<Encoded.Transaction> {
    if (innerTx != null) throw new NotImplementedError('innerTx option in AccountMetamask');
    if (networkId == null) throw new ArgumentError('networkId', 'provided', networkId);

    return invokeSnap<Encoded.Transaction>(
      this.provider,
      'signTransaction',
      { derivationPath: [`${this.index}'`, "0'", "0'"], tx, networkId },
      'signedTx',
    );
  }

  // eslint-disable-next-line class-methods-use-this
  override async signMessage(message: string): Promise<Uint8Array> {
    const signature = await invokeSnap<string>(
      this.provider,
      'signMessage',
      {
        derivationPath: [`${this.index}'`, "0'", "0'"],
        message: Buffer.from(message).toString('base64'),
      },
      'signature',
    );
    return Buffer.from(signature, 'base64');
  }
}
