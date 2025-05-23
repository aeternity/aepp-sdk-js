import { shallowRef } from 'vue';
import { createStore } from 'vuex';
import { AeSdk, Node, CompilerHttp } from '@aeternity/aepp-sdk';

const store = createStore({
  state: {
    address: undefined,
    networkId: undefined,
    // AeSdk instance can't be in deep reactive https://github.com/aeternity/aepp-sdk-js/blob/1cd128798018d98bdd41eff9104442b44b385d46/docs/README.md#vue3
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
