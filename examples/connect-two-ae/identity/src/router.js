import Router from 'vue-router'
import Home from './components/Home.vue'

export default (store) => {
  const routes = [
    {
      path: '/',
      name: 'home',
      component: Home,
      props: route => ({ query: route.query })
    }
  ]
  const router = new Router({mode: 'history', routes: routes})
  return router
}
