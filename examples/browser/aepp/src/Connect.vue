<template>
  <div class="nav">
    <a href="#" :class="{ active: view === 'Frame' }" @click="view = 'Frame'">Frame</a>
    <a href="#" :class="{ active: view === 'Ledger' }" @click="view = 'Ledger'">Ledger HW</a>
  </div>

  <Component v-if="view" :is="view" />
</template>

<script>
import Frame from './components/ConnectFrame.vue';
import Ledger from './components/ConnectLedger.vue';

export default {
  components: { Frame, Ledger },
  data: () => ({ view: 'Frame' }),
};
</script>
