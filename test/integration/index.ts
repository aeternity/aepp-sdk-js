import { after, afterEach } from 'mocha';
import {
  AeSdk,
  CompilerHttpNode,
  AccountMemory,
  Node,
  Encoded,
  isEncoded,
  Encoding,
} from '../../src';
import '..';

const network = process.env.NETWORK;

const configuration = {
  mainnet: {
    networkId: 'ae_mainnet',
    url: 'https://mainnet.aeternity.io',
    channelUrl: 'wss://mainnet.aeternity.io/channel',
    compilerUrl: 'https://v8.compiler.aepps.com',
    getGenesisAccount: () => {
      if (process.env.MAINNET_SECRET_KEY == null) throw new Error('MAINNET_SECRET_KEY is not set');
      if (!isEncoded(process.env.MAINNET_SECRET_KEY, Encoding.AccountSecretKey)) {
        throw new Error(`MAINNET_SECRET_KEY is not valid: ${process.env.MAINNET_SECRET_KEY}`);
      }
      return new AccountMemory(process.env.MAINNET_SECRET_KEY);
    },
    sdkOptions: {
      blocks: 2,
    },
  },
  testnet: {
    networkId: 'ae_uat',
    url: 'https://testnet.aeternity.io',
    debugUrl: 'https://testnet.aeternity.io',
    channelUrl: 'wss://testnet.aeternity.io/channel',
    compilerUrl: 'https://v8.compiler.aepps.com',
    getGenesisAccount: async () => {
      const account = AccountMemory.generate();
      const { status } = await fetch(`https://faucet.aepps.com/account/${account.address}`, {
        method: 'POST',
      });
      console.assert([200, 425].includes(status), 'Invalid faucet response code', status);
      return account;
    },
    sdkOptions: {
      blocks: 2,
    },
  },
  '': {
    networkId: 'ae_dev',
    url: 'http://localhost:3013',
    debugUrl: 'http://localhost:3113',
    channelUrl: 'ws://localhost:3014/channel',
    compilerUrl: 'http://localhost:3080',
    getGenesisAccount: () =>
      new AccountMemory('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf'),
    sdkOptions: {
      _expectedMineRate: 1000,
      _microBlockCycle: 300,
    },
  },
}[network ?? ''];
if (configuration == null) throw new Error(`Unknown network: ${network}`);
export const { networkId, url, channelUrl, compilerUrl } = configuration;
const { sdkOptions } = configuration;

type TransactionHandler = (tx: Encoded.Transaction) => unknown;
const transactionHandlers: TransactionHandler[] = [];

export function addTransactionHandler(cb: TransactionHandler): void {
  transactionHandlers.push(cb);
}

class NodeHandleTx extends Node {
  override async postTransaction(
    ...args: Parameters<Node['postTransaction']>
  ): ReturnType<Node['postTransaction']> {
    transactionHandlers.forEach((cb) => cb(args[0].tx as Encoded.Transaction));
    return super.postTransaction(...args);
  }
}

const genesisAccountPromise = configuration.getGenesisAccount();
export const isLimitedCoins = network != null;

export async function getSdk(accountCount = 1): Promise<AeSdk> {
  const accounts = new Array(accountCount).fill(null).map(() => AccountMemory.generate());
  const sdk = new AeSdk({
    onCompiler: new CompilerHttpNode(compilerUrl),
    nodes: [{ name: 'test', instance: new NodeHandleTx(url) }],
    accounts,
    ...sdkOptions,
  });

  const genesisAccount = await genesisAccountPromise;
  for (let i = 0; i < accounts.length; i += 1) {
    await sdk.spend(isLimitedCoins ? 1e16 : 5e18, accounts[i].address, {
      onAccount: genesisAccount,
    });
  }

  if (networkId === 'ae_mainnet') {
    after(async () => {
      const promises = accounts.map(async (onAccount) =>
        sdk.transferFunds(1, genesisAccount.address, { onAccount }),
      );
      await Promise.allSettled(promises);
    });
  }

  return sdk;
}

afterEach(async function describeTxError() {
  const { err } = this.currentTest ?? {};
  if (configuration.debugUrl == null || err?.message == null) return;
  const match = err.message.match(/Giving up after \d+ blocks mined, transaction hash: (th_.+)/);
  if (match == null) return;
  const hash = match[1];
  const u = `${configuration.debugUrl}/v3/debug/check-tx/pool/${hash}`;
  const response = await fetch(u);
  if (response.status !== 200) throw new Error(`Invalid ${u} response: ${response.status}`);
  const { status } = await response.json();
  err.message += ` (node-provided transaction status: ${status})`;
});

export const timeoutBlock = networkId === 'ae_dev' ? 6_000 : 700_000;
