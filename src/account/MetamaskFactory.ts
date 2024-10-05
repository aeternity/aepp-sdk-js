import type { BaseProvider } from '@metamask/providers';
import { InternalError, UnsupportedPlatformError, UnsupportedVersionError } from '../utils/errors';
import { Encoded } from '../utils/encoder';
import semverSatisfies from '../utils/semver-satisfies';
import AccountBaseFactory from './BaseFactory';
import AccountMetamask, { invokeSnap, snapId } from './Metamask';

const snapMinVersion = '0.0.9';
const snapMaxVersion = '0.1.0';

interface SnapDetails {
  blocked: boolean;
  enabled: boolean;
  id: typeof snapId;
  version: string;
  initialPermissions: Record<string, unknown>;
}

/**
 * A factory class that generates instances of AccountMetamask.
 */
export default class AccountMetamaskFactory extends AccountBaseFactory {
  readonly provider: BaseProvider;

  /**
   * @param provider - Connection to MetaMask to use
   */
  constructor(provider?: BaseProvider) {
    super();
    if (provider != null) {
      this.provider = provider;
      return;
    }
    if (window == null) {
      throw new UnsupportedPlatformError(
        'Window object not found, you can run AccountMetamaskFactory only in browser or setup a provider',
      );
    }
    if (!('ethereum' in window) || window.ethereum == null) {
      throw new UnsupportedPlatformError(
        '`ethereum` object not found, you can run AccountMetamaskFactory only with Metamask enabled or setup a provider',
      );
    }
    this.provider = window.ethereum as BaseProvider;
  }

  /**
   * It throws an exception if MetaMask has an incompatible version.
   */
  async #ensureMetamaskSupported(): Promise<void> {
    const version = await this.provider.request<string>({ method: 'web3_clientVersion' });
    if (version == null) throw new InternalError("Can't get Ethereum Provider version");
    const metamaskPrefix = 'MetaMask/v';
    if (!version.startsWith(metamaskPrefix)) {
      throw new UnsupportedPlatformError(`Expected Metamask, got ${version} instead`);
    }
    const args = [version.slice(metamaskPrefix.length), '12.2.4'] as const;
    if (!semverSatisfies(...args)) throw new UnsupportedVersionError('Metamask', ...args);
  }

  #ensureReadyPromise?: Promise<void>;

  /**
   * Request MetaMask to install Aeternity snap.
   */
  async installSnap(): Promise<SnapDetails> {
    await this.#ensureMetamaskSupported();
    const details = (await this.provider.request({
      method: 'wallet_requestSnaps',
      params: { [snapId]: { version: snapMinVersion } },
    })) as { [key in typeof snapId]: SnapDetails };
    this.#ensureReadyPromise = Promise.resolve();
    return details[snapId];
  }

  /**
   * It throws an exception if MetaMask or Aeternity snap has an incompatible version or is not
   * installed.
   */
  async ensureReady(): Promise<void> {
    const snapVersion = await this.getSnapVersion();
    const args = [snapVersion, snapMinVersion, snapMaxVersion] as const;
    if (!semverSatisfies(...args))
      throw new UnsupportedVersionError('Aeternity snap in MetaMask', ...args);
    this.#ensureReadyPromise = Promise.resolve();
  }

  async #ensureReady(): Promise<void> {
    this.#ensureReadyPromise ??= this.ensureReady();
    return this.#ensureReadyPromise;
  }

  /**
   * @returns the version of snap installed in MetaMask
   */
  async getSnapVersion(): Promise<string> {
    await this.#ensureMetamaskSupported();
    const snaps = (await this.provider.request({ method: 'wallet_getSnaps' })) as Record<
      string,
      { version: string }
    >;
    const version = snaps[snapId]?.version;
    if (version == null)
      throw new UnsupportedPlatformError('Aeternity snap is not installed to MetaMask');
    return version;
  }

  /**
   * Get an instance of AccountMetaMask for a given account index.
   * @param accountIndex - Index of account
   */
  async initialize(accountIndex: number): Promise<AccountMetamask> {
    await this.#ensureReady();
    const address = await invokeSnap<Encoded.AccountAddress>(
      this.provider,
      'getPublicKey',
      { derivationPath: [`${accountIndex}'`, "0'", "0'"] },
      'publicKey',
    );
    return new AccountMetamask(this.provider, accountIndex, address);
  }
}
