<template>
  <h2>Simple æpp</h2>

  <Connect />

  <div
    v-if="aeSdk"
    class="nav"
  >
    <a
      href="#"
      :class="{ active: view === 'Basic' }"
      @click="view = 'Basic'"
    >
      Basic functionality
    </a>
    <a
      href="#"
      :class="{ active: view === 'Contracts' }"
      @click="view = 'Contracts'"
    >
      Smart contracts
    </a>
  </div>

  <Component
    v-if="aeSdk && view"
    :is="view"
  />
</template>

<script>
import { mapGetters } from 'vuex'
import Connect from '../../aepp/src/Connect'
import Basic from '../../aepp/src/Basic'
import Contracts from '../../aepp/src/Contracts'

export default {
  components: { Connect, Basic, Contracts },
  data: () => ({ view: '' }),
  computed: mapGetters('aeSdk', ['aeSdk'])
}
</script>

<style lang="scss" src="./styles.scss" />
