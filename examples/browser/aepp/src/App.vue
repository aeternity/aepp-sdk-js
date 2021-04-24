<template>
  <h2>Simple æpp</h2>

  <Connect
    @sdk="sdk = $event"
    @address="address = $event"
    @networkId="networkId = $event"
  />

  <div
    v-if="sdk"
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
    v-if="sdk && view"
    :is="view"
    :sdk="sdk"
    :address="address"
    :networkId="networkId"
  />
</template>

<script>
import Connect from '../../aepp/src/Connect'
import Basic from '../../aepp/src/Basic'
import Contracts from '../../aepp/src/Contracts'

export default {
  components: { Connect, Basic, Contracts },
  data: () => ({
    view: '',
    sdk: null,
    address: '',
    networkId: '',
  })
}
</script>

<style lang="scss" src="./styles.scss" />
