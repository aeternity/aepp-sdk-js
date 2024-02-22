import { shallowReactive } from 'vue';
import { createStore } from 'vuex';
import { AeSdk, Node, CompilerHttp } from '@aeternity/aepp-sdk';

const TESTNET_NODE_URL = 'https://testnet.aeternity.io';
const MAINNET_NODE_URL = 'https://mainnet.aeternity.io';
const COMPILER_URL = 'https://v7.compiler.aepps.com';

const store = createStore({
  state: {
    address: undefined,
    networkId: undefined,
    // AeSdk instance can't be in deep reactive https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/README.md#vue3
    aeSdk: shallowReactive(new AeSdk({
      nodes: [
        { name: 'testnet', instance: new Node(TESTNET_NODE_URL) },
        { name: 'mainnet', instance: new Node(MAINNET_NODE_URL) },
      ],
      onCompiler: new CompilerHttp(COMPILER_URL),
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
