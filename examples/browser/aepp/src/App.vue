<template>
  <h2>Simple æpp</h2>

  <Connect />

  <div class="nav">
    <a href="#" :class="{ active: view === 'Basic' }" @click="view = 'Basic'">
      Basic functionality
    </a>
    <a href="#" :class="{ active: view === 'Contracts' }" @click="view = 'Contracts'">
      Smart contracts
    </a>
    <a href="#" :class="{ active: view === 'PayForTx' }" @click="view = 'PayForTx'">
      Pay for transaction
    </a>
    <a href="#" :class="{ active: view === 'TypedData' }" @click="view = 'TypedData'">
      Typed data
    </a>
    <a
      href="#"
      :class="{ active: view === 'DelegationSignature' }"
      @click="view = 'DelegationSignature'"
    >
      Delegation signature
    </a>
    <a href="#" :class="{ active: view === 'Jwt' }" @click="view = 'Jwt'">JWT</a>
  </div>

  <Component v-if="view" :is="view" />
</template>

<script>
import Connect from './Connect.vue';
import Basic from './Basic.vue';
import Contracts from './Contracts.vue';
import PayForTx from './PayForTx.vue';
import TypedData from './TypedData.vue';
import DelegationSignature from './DelegationSignature.vue';
import Jwt from './Jwt.vue';

export default {
  components: {
    Connect,
    Basic,
    Contracts,
    PayForTx,
    TypedData,
    DelegationSignature,
    Jwt,
  },
  data: () => ({ view: '' }),
};
</script>

<style lang="scss" src="./styles.scss" />
