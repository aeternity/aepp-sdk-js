<template>
  <div id="app">
    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app',
  data () {
    return {
      goToRoute: '',
      amount: 0
    }
  },
  computed: { },
  mounted () { }
}
</script>
