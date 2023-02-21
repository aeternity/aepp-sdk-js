import { AeSdkAepp, Node, CompilerHttp } from '@aeternity/aepp-sdk';

const TESTNET_NODE_URL = 'https://testnet.aeternity.io';
const MAINNET_NODE_URL = 'https://mainnet.aeternity.io';
const COMPILER_URL = 'https://v7.compiler.stg.aepps.com';

export default (store) => {
  let aeSdk;

  store.registerModule('aeSdk', {
    namespaced: true,
    getters: {
      aeSdk: ({ ready }) => (ready ? aeSdk : undefined),
    },
    state: {
      ready: false,
      address: undefined,
      networkId: undefined,
    },
    mutations: {
      markAsReady(state) {
        state.ready = true;
      },
      setAddress(state, address) {
        state.address = address;
      },
      setNetworkId(state, networkId) {
        state.networkId = networkId;
      },
    },
    actions: {
      async initialize({ commit }) {
        if (aeSdk) return;
        aeSdk = new AeSdkAepp({
          name: 'Simple æpp',
          nodes: [
            { name: 'testnet', instance: new Node(TESTNET_NODE_URL) },
            { name: 'mainnet', instance: new Node(MAINNET_NODE_URL) },
          ],
          onCompiler: new CompilerHttp(COMPILER_URL),
          onNetworkChange: async ({ networkId }) => {
            const [{ name }] = (await aeSdk.getNodesInPool())
              .filter((node) => node.nodeNetworkId === networkId);
            aeSdk.selectNode(name);
            commit('setNetworkId', networkId);
          },
          onAddressChange: ({ current }) => commit('setAddress', Object.keys(current)[0]),
          onDisconnect: () => alert('Aepp is disconnected'),
        });
        commit('markAsReady');
      },
    },
  });
};
