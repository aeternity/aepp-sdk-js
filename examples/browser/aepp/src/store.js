import { shallowRef } from 'vue';
import { createStore } from 'vuex';
import { AeSdk, Node, CompilerHttp } from '@aeternity/aepp-sdk';

const store = createStore({
  state: {
    address: undefined,
    networkId: undefined,
    // AeSdk instance can't be in deep reactive https://github.com/aeternity/aepp-sdk-js/blob/568c291b92c030011ca9e68169f328be6ff79488/docs/README.md#vue3
    aeSdk: shallowRef(
      new AeSdk({
        nodes: [
          { name: 'testnet', instance: new Node('https://testnet.aeternity.io') },
          { name: 'mainnet', instance: new Node('https://mainnet.aeternity.io') },
        ],
        onCompiler: new CompilerHttp('https://v8.compiler.aepps.com'),
      }),
    ),
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
