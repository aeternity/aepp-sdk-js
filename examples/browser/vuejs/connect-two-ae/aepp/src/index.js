// import socketio from 'socket.io'
import './main.css'
import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import getRouter from './router'
import store from './store'

Vue.config.productionTip = false
Vue.use(VueRouter)

new Vue({
  router: getRouter(store),
  store,
  render: h => h(App),
  beforeCreate () {}
}).$mount('#app')
