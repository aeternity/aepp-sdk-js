import type Transport from '@ledgerhq/hw-transport';
import AccountLedger, { CLA, GET_ADDRESS, GET_APP_CONFIGURATION } from './Ledger';
import { UnsupportedVersionError } from '../utils/errors';
import { Encoded } from '../utils/encoder';
import semverSatisfies from '../utils/semver-satisfies';
import AccountBaseFactory from './BaseFactory';

interface AppConfiguration {
  version: string;
}

/**
 * A factory class that generates instances of AccountLedger based on provided transport.
 */
export default class AccountLedgerFactory extends AccountBaseFactory {
  /**
   * @param transport - Connection to Ledger to use
   */
  constructor(readonly transport: Transport) {
    super();
    transport.decorateAppAPIMethods(this, ['getAddress', 'getAppConfiguration'], 'w0w');
  }

  #ensureReadyPromise?: Promise<void>;

  /**
   * It throws an exception if Aeternity app on Ledger has an incompatible version, not opened or
   * not installed.
   */
  async ensureReady(): Promise<void> {
    const { version } = await this.#getAppConfiguration();
    const args = [version, '0.4.4', '0.5.0'] as const;
    if (!semverSatisfies(...args))
      throw new UnsupportedVersionError('Aeternity app on Ledger', ...args);
    this.#ensureReadyPromise = Promise.resolve();
  }

  async #ensureReady(): Promise<void> {
    this.#ensureReadyPromise ??= this.ensureReady();
    return this.#ensureReadyPromise;
  }

  async #getAppConfiguration(): Promise<AppConfiguration> {
    const response = await this.transport.send(CLA, GET_APP_CONFIGURATION, 0x00, 0x00);
    return {
      version: [response[1], response[2], response[3]].join('.'),
    };
  }

  /**
   * @returns the version of Aeternity app installed on Ledger wallet
   */
  async getAppConfiguration(): Promise<AppConfiguration> {
    return this.#getAppConfiguration();
  }

  /**
   * Get `ak_`-prefixed address for a given account index.
   * @param accountIndex - Index of account
   * @param verify - Ask user to confirm address by showing it on the device screen
   */
  async getAddress(accountIndex: number, verify = false): Promise<Encoded.AccountAddress> {
    await this.#ensureReady();
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(accountIndex, 0);
    const response = await this.transport.send(
      CLA,
      GET_ADDRESS,
      verify ? 0x01 : 0x00,
      0x00,
      buffer,
    );
    const addressLength = response[0];
    return response.subarray(1, 1 + addressLength).toString('ascii') as Encoded.AccountAddress;
  }

  /**
   * Get an instance of AccountLedger for a given account index.
   * @param accountIndex - Index of account
   */
  async initialize(accountIndex: number): Promise<AccountLedger> {
    return new AccountLedger(this.transport, accountIndex, await this.getAddress(accountIndex));
  }
}
