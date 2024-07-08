import type Transport from '@ledgerhq/hw-transport';
import AccountLedger, { CLA, GET_ADDRESS, GET_APP_CONFIGURATION } from './Ledger';
import { UnsupportedVersionError } from '../utils/errors';
import { Encoded } from '../utils/encoder';
import semverSatisfies from '../utils/semver-satisfies';
import AccountBaseFactory from './BaseFactory';

/**
 * A factory class that generates instances of AccountLedger based on provided transport.
 */
export default class AccountLedgerFactory extends AccountBaseFactory {
  readonly transport: Transport;

  private readonly versionCheckPromise: Promise<void>;

  /**
   * @param transport - Connection to Ledger to use
   */
  constructor(transport: Transport) {
    super();
    this.transport = transport;
    this.versionCheckPromise = this.getAppConfiguration().then(({ version }) => {
      const args = [version, '0.4.4', '0.5.0'] as const;
      if (!semverSatisfies(...args)) throw new UnsupportedVersionError('app on ledger', ...args);
    });
    const scrambleKey = 'w0w';
    transport.decorateAppAPIMethods(this, ['getAddress', 'getAppConfiguration'], scrambleKey);
  }

  /**
   * @returns the version of app installed on Ledger wallet
   */
  async getAppConfiguration(): Promise<{ version: string }> {
    await this.versionCheckPromise;
    const response = await this.transport.send(CLA, GET_APP_CONFIGURATION, 0x00, 0x00);
    return {
      version: [response[1], response[2], response[3]].join('.'),
    };
  }

  /**
   * Get `ak_`-prefixed address for a given account index.
   * @param accountIndex - Index of account
   * @param verify - Ask user to confirm address by showing it on the device screen
   */
  async getAddress(accountIndex: number, verify = false): Promise<Encoded.AccountAddress> {
    await this.versionCheckPromise;
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
    await this.versionCheckPromise;
    return new AccountLedger(this.transport, accountIndex, await this.getAddress(accountIndex));
  }
}
