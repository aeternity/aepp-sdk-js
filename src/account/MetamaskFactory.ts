import type { BaseProvider } from '@metamask/providers';
import {
  InternalError,
  UnsupportedPlatformError,
  UnsupportedVersionError,
} from '../utils/errors.js';
import { Encoded } from '../utils/encoder.js';
import semverSatisfies from '../utils/semver-satisfies.js';
import AccountBaseFactory from './BaseFactory.js';
import AccountMetamask, { invokeSnap, snapId } from './Metamask.js';

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
 * @see {@link https://www.npmjs.com/package/@aeternity-snap/plugin | Aeternity snap}
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

  /**
   * Request MetaMask to install Aeternity snap.
   * @deprecated use `requestSnap` instead
   */
  async installSnap(): Promise<SnapDetails> {
    await this.#ensureMetamaskSupported();
    const details = (await this.provider.request({
      method: 'wallet_requestSnaps',
      params: { [snapId]: { version: snapMinVersion } },
    })) as { [key in typeof snapId]: SnapDetails };
    return details[snapId];
  }

  /**
   * Request MetaMask to install Aeternity snap or connect it to the current aepp.
   * MetaMask can have only one Aeternity snap version installed at a time.
   * This method is intended to upgrade the snap to a specified version if needed by the aepp.
   * If Aeternity snap is installed but wasn't used by the aepp, then the user still needs to approve the connection.
   * If the currently installed version corresponds to the version range, then the snap won't be upgraded.
   * To downgrade the snap, the user must manually uninstall the current version.
   * @param version - Snap version range (e.g. `1`, `0.1.*`, `^0.0.9`, `~0.0.9`; `>=0.0.9 <0.1.0`)
   * (default: a version range supported by sdk)
   */
  async requestSnap(version = `>=${snapMinVersion} <${snapMaxVersion}`): Promise<SnapDetails> {
    await this.#ensureMetamaskSupported();
    const details = (await this.provider.request({
      method: 'wallet_requestSnaps',
      params: { [snapId]: { version } },
    })) as { [key in typeof snapId]: SnapDetails };
    return details[snapId];
  }

  /**
   * It throws an exception if MetaMask or Aeternity snap has an incompatible version or is not
   * installed or is not connected to the aepp.
   * @deprecated use `requestSnap` instead
   */
  async ensureReady(): Promise<void> {
    const snapVersion = await this.getSnapVersion();
    const args = [snapVersion, snapMinVersion, snapMaxVersion] as const;
    if (!semverSatisfies(...args))
      throw new UnsupportedVersionError('Aeternity snap in MetaMask', ...args);
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
      throw new UnsupportedPlatformError(
        'Aeternity snap is not installed to MetaMask or not connected to this aepp',
      );
    return version;
  }

  /**
   * Get an instance of AccountMetaMask for a given account index.
   * @param accountIndex - Index of account
   */
  async initialize(accountIndex: number): Promise<AccountMetamask> {
    await this.requestSnap();
    const address = await invokeSnap<Encoded.AccountAddress>(
      this.provider,
      'getPublicKey',
      { derivationPath: [`${accountIndex}'`, "0'", "0'"] },
      'publicKey',
    );
    return new AccountMetamask(this.provider, accountIndex, address);
  }
}
