<template>
  <div class="group">
    <template v-if="!accountFactory">
      <button :disabled="!isUsbSupported" @click="() => connect(false)">Connect over USB</button>
      <button :disabled="!isBleSupported" @click="() => connect(true)">Connect over BLE</button>
    </template>
    <template v-else>
      <div>
        <div>Device</div>
        <div>{{ accountFactory.transport.deviceModel.productName }}</div>
      </div>
      <div v-if="accounts.length">
        <div>Accounts</div>
        <div>{{ accounts.map((account) => account.address.slice(0, 8)).join(', ') }}</div>
      </div>
    </template>
    <div v-if="status">
      <div>Connection status</div>
      <div>{{ status }}</div>
    </div>
    <template v-else-if="accountFactory">
      <button @click="disconnect">Disconnect</button>
      <button @click="() => addAccount(true)">Add Account</button>
      <button @click="() => addAccount(false)">Add Account no Confirm</button>
      <button v-if="accounts.length > 1" @click="switchAccount">Switch Account</button>
      <button @click="discoverAccounts">Discover Accounts</button>
      <button @click="switchNode">Switch Node</button>
    </template>
  </div>
</template>

<script>
import { AccountLedgerFactory } from '@aeternity/aepp-sdk';
import { mapState } from 'vuex';
import TransportWebUsb from '@ledgerhq/hw-transport-webusb';
import TransportWebBle from '@ledgerhq/hw-transport-web-ble';
import { listen } from '@ledgerhq/logs';

// TODO: remove after fixing https://github.com/LedgerHQ/ledgerjs/issues/352#issuecomment-615917351
class TransportWebBleAndroidFix extends TransportWebBle {
  static async open(device, ...args) {
    if (!navigator.userAgent.includes('Mobi')) return super.open(device, ...args);
    const getPrimaryServicesOrig = device.gatt?.getPrimaryServices;
    if (getPrimaryServicesOrig == null) return super.open(device, ...args);
    device.gatt.getPrimaryServices = async () => {
      const [service] = await getPrimaryServicesOrig.call(device.gatt);
      const getCharacteristicOrig = service.getCharacteristic;
      service.getCharacteristic = async (id) => {
        const characteristic = await getCharacteristicOrig.call(service, id);
        if (id === '13d63400-2c97-0004-0002-4c6564676572') {
          const writeValueOrig = characteristic.writeValue;
          let delayed = false;
          characteristic.writeValue = async (data) => {
            if (!delayed) {
              await new Promise((resolve) => setTimeout(resolve, 250));
              delayed = true;
            }
            return writeValueOrig.call(characteristic, data);
          };
        }
        return characteristic;
      };
      return [service];
    };
    return super.open(device, ...args);
  }
}

export default {
  created() {
    this.accountFactory = null;
  },
  data: () => ({
    status: '',
    accounts: [],
    isUsbSupported: false,
    isBleSupported: false,
  }),
  computed: mapState(['aeSdk']),
  methods: {
    async connect(isBle) {
      let transport;
      try {
        this.status = 'Waiting for Ledger response';
        transport = await (isBle ? TransportWebBleAndroidFix : TransportWebUsb).create();
        transport.on('disconnect', () => this.reset());
        const factory = new AccountLedgerFactory(transport);
        factory._enableExperimentalLedgerAppSupport = true;
        await factory.ensureReady();
        this.accountFactory = factory;
        this.status = '';
      } catch (error) {
        transport?.close();
        if (error.name === 'TransportOpenUserCancelled') {
          this.status = '';
          return;
        }
        if (error.name === 'LockedDeviceError') {
          this.status = 'Device is locked, please unlock it';
          return;
        }
        if (error.message.includes('UNKNOWN_APDU')) {
          this.status = 'Ensure that aeternity app is opened on Ledger HW';
          return;
        }
        if (error.name === 'UnsupportedVersionError') {
          this.status = error.message;
          return;
        }
        this.status = 'Unknown error';
        throw error;
      }
    },
    reset() {
      this.accountFactory = null;
      this.accounts = [];
      this.$store.commit('setAddress', undefined);
      if (Object.keys(this.aeSdk.accounts).length) this.aeSdk.removeAccount(this.aeSdk.address);
    },
    async disconnect() {
      await this.accountFactory.transport.close();
      this.reset();
    },
    async addAccount(confirm) {
      try {
        this.status = 'Waiting for Ledger response';
        const idx = this.accounts.length;
        const account = await this.accountFactory.initialize(idx);
        if (confirm) {
          this.status = `Ensure that ${account.address} is displayed on Ledger HW screen`;
          await this.accountFactory.getAddress(idx, true);
        }
        this.accounts.push(account);
        this.setAccount(this.accounts[0]);
      } catch (error) {
        if (error.statusCode === 0x6985) return;
        throw error;
      } finally {
        this.status = '';
      }
    },
    switchAccount() {
      this.accounts.push(this.accounts.shift());
      this.setAccount(this.accounts[0]);
    },
    async discoverAccounts() {
      this.status = 'Discovering accounts';
      this.accounts = await this.accountFactory.discover(this.aeSdk.api);
      this.setAccount(this.accounts[0]);
      this.status = '';
    },
    async switchNode() {
      const networkId = this.$store.state.networkId === 'ae_mainnet' ? 'ae_uat' : 'ae_mainnet';
      const [{ name }] = (await this.aeSdk.getNodesInPool()).filter(
        (node) => node.nodeNetworkId === networkId,
      );
      this.aeSdk.selectNode(name);
      this.$store.commit('setNetworkId', networkId);
    },
    setAccount(account) {
      if (Object.keys(this.aeSdk.accounts).length) this.aeSdk.removeAccount(this.aeSdk.address);
      this.aeSdk.addAccount(account, { select: true });
      this.$store.commit('setAddress', account.address);
    },
  },
  async mounted() {
    this.isUsbSupported = await TransportWebUsb.isSupported();
    this.isBleSupported = await TransportWebBle.isSupported();
    this.unsubscribeLedgerLog = listen(({ type, id, date, message }) => {
      console.log(type, id, date.toLocaleTimeString(), message);
    });
  },
  async beforeUnmount() {
    if (this.accountFactory) this.disconnect();
    this.unsubscribeLedgerLog();
  },
};
</script>
