import { shallowReactive } from 'vue';
import { createStore } from 'vuex';
import { AeSdkAepp, Node, CompilerHttp } from '@aeternity/aepp-sdk';

const TESTNET_NODE_URL = 'https://testnet.aeternity.io';
const MAINNET_NODE_URL = 'https://mainnet.aeternity.io';
const COMPILER_URL = 'https://v7.compiler.stg.aepps.com';

const store = createStore({
  state: {
    address: undefined,
    networkId: undefined,
    // AeSdkAepp instance can't be in deep reactive https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/README.md#vue-3
    aeSdk: shallowReactive(new AeSdkAepp({
      name: 'Simple æpp',
      nodes: [
        { name: 'testnet', instance: new Node(TESTNET_NODE_URL) },
        { name: 'mainnet', instance: new Node(MAINNET_NODE_URL) },
      ],
      onCompiler: new CompilerHttp(COMPILER_URL),
      async onNetworkChange({ networkId }) {
        const [{ name }] = (await this.getNodesInPool())
          .filter((node) => node.nodeNetworkId === networkId);
        this.selectNode(name);
        store.commit('setNetworkId', networkId);
      },
      onAddressChange: ({ current }) => store.commit('setAddress', Object.keys(current)[0]),
      onDisconnect: () => alert('Aepp is disconnected'),
    })),
  },
  mutations: {
    setAddress(state, address) {
      state.address = address;
    },
    setNetworkId(state, networkId) {
      state.networkId = networkId;
    },
  },
});

export default store;
