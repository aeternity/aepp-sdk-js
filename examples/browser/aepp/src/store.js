import { shallowRef } from 'vue';
import { createStore } from 'vuex';
import { AeSdkAepp, Node, CompilerHttp } from '@aeternity/aepp-sdk';

const store = createStore({
  state: {
    address: undefined,
    networkId: undefined,
    // AeSdkAepp instance can't be in deep reactive https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/README.md#vue3
    aeSdk: shallowRef(new AeSdkAepp({
      name: 'Simple æpp',
      nodes: [
        { name: 'testnet', instance: new Node('https://testnet.aeternity.io') },
        { name: 'mainnet', instance: new Node('https://mainnet.aeternity.io') },
        { name: 'next', instance: new Node('https://next.aeternity.io') },
      ],
      onCompiler: new CompilerHttp('https://v7.compiler.aepps.com'),
      async onNetworkChange({ networkId }) {
        const [{ name }] = (await this.getNodesInPool())
          .filter((node) => node.nodeNetworkId === networkId);
        this.selectNode(name);
        store.commit('setNetworkId', networkId);
      },
      onAddressChange: ({ current }) => store.commit('setAddress', Object.keys(current)[0]),
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
