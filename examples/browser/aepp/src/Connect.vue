<template>
  <div class="nav">
    <a href="#" :class="{ active: view === 'Frame' }" @click="view = 'Frame'">Frame</a>
    <a href="#" :class="{ active: view === 'Ledger' }" @click="view = 'Ledger'">Ledger HW</a>
    <a href="#" :class="{ active: view === 'Metamask' }" @click="view = 'Metamask'">MetaMask</a>
    <a href="#" :class="{ active: view === 'Mnemonic' }" @click="view = 'Mnemonic'">Mnemonic</a>
  </div>

  <Component v-if="view" :is="view" />
</template>

<script>
import Frame from './components/ConnectFrame.vue';
import Ledger from './components/ConnectLedger.vue';
import Metamask from './components/ConnectMetamask.vue';
import Mnemonic from './components/ConnectMnemonic.vue';

export default {
  components: { Frame, Ledger, Metamask, Mnemonic },
  data: () => ({ view: 'Frame' }),
};
</script>
