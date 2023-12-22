import { after } from 'mocha';
import {
  AeSdk, CompilerHttpNode, MemoryAccount, Node, Encoded, ConsensusProtocolVersion,
} from '../../src';
import '..';

const network = process.env.NETWORK;

const configuration = {
  mainnet: {
    networkId: 'ae_mainnet',
    url: 'https://mainnet.aeternity.io',
    channelUrl: 'wss://mainnet.aeternity.io/channel',
    // TODO: deploy v8 compiler and v7.4.1
    compilerUrl: 'http://localhost:3080',
    compilerUrl7: 'http://localhost:3081',
    getGenesisAccount: () => {
      if (process.env.MAINNET_SECRET_KEY == null) throw new Error('MAINNET_SECRET_KEY is not set');
      return new MemoryAccount(process.env.MAINNET_SECRET_KEY);
    },
    sdkOptions: {
      blocks: 2,
    },
  },
  testnet: {
    networkId: 'ae_uat',
    url: 'https://testnet.aeternity.io',
    channelUrl: 'wss://testnet.aeternity.io/channel',
    // TODO: deploy v8 compiler and v7.4.1
    compilerUrl: 'http://localhost:3080',
    compilerUrl7: 'http://localhost:3081',
    getGenesisAccount: async () => {
      const account = MemoryAccount.generate();
      const { status } = await fetch(
        `https://faucet.aepps.com/account/${account.address}`,
        { method: 'POST' },
      );
      console.assert([200, 425].includes(status), 'Invalid faucet response code', status);
      return account;
    },
    sdkOptions: {
      blocks: 2,
    },
  },
  '': {
    networkId: 'ae_devnet',
    url: 'http://localhost:3013',
    channelUrl: 'ws://localhost:3014/channel',
    compilerUrl: 'http://localhost:3080',
    compilerUrl7: 'http://localhost:3081',
    getGenesisAccount: () => new MemoryAccount(
      '9ebd7beda0c79af72a42ece3821a56eff16359b6df376cf049aee995565f022f840c974b97164776454ba119d84edc4d6058a8dec92b6edc578ab2d30b4c4200',
    ),
    sdkOptions: {
      _expectedMineRate: 1000,
      _microBlockCycle: 300,
    },
  },
}[network ?? ''];
if (configuration == null) throw new Error(`Unknown network: ${network}`);
export const {
  networkId, url, channelUrl, compilerUrl, compilerUrl7,
} = configuration;
const { sdkOptions } = configuration;

type TransactionHandler = (tx: Encoded.Transaction) => unknown;
const transactionHandlers: TransactionHandler[] = [];

export function addTransactionHandler(cb: TransactionHandler): void {
  transactionHandlers.push(cb);
}

class NodeHandleTx extends Node {
  // @ts-expect-error use code generation to create node class?
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
  const accounts = new Array(accountCount).fill(null).map(() => MemoryAccount.generate());
  const sdk = new AeSdk({
    onCompiler: new CompilerHttpNode(compilerUrl),
    nodes: [{ name: 'test', instance: new NodeHandleTx(url) }],
    accounts,
    ...sdkOptions,
  });

  // TODO: remove after dropping aesophia@7
  if ((await sdk.api.getNodeInfo()).consensusProtocolVersion === ConsensusProtocolVersion.Iris) {
    sdk._options.onCompiler = new CompilerHttpNode(compilerUrl7);
  }

  const genesisAccount = await genesisAccountPromise;
  for (let i = 0; i < accounts.length; i += 1) {
    await sdk.spend(
      isLimitedCoins ? 1e16 : 5e18,
      accounts[i].address,
      { onAccount: genesisAccount },
    );
  }

  if (networkId === 'ae_mainnet') {
    after(async () => {
      const promises = accounts
        .map(async (onAccount) => sdk.transferFunds(1, genesisAccount.address, { onAccount }));
      await Promise.allSettled(promises);
    });
  }

  return sdk;
}
