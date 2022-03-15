<template>
  <h2>Simple æpp</h2>

  <Connect
    @aeSdk="aeSdk = $event"
    @address="address = $event"
    @networkId="networkId = $event"
  />

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
    :aeSdk="aeSdk"
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
    aeSdk: null,
    address: '',
    networkId: '',
  })
}
</script>

<style lang="scss" src="./styles.scss" />
