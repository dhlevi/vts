import Vue from 'vue'
import VueRouter from 'vue-router'

import Login from './components/Login.vue'
import Dashboard from './components/Dashboard.vue'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    { path: '/', component: Login, name: 'login' },
    { path: '/dashboard', component: Dashboard, name: 'dashboard' }
  ]
})
