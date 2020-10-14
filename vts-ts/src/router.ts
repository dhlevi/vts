import Vue from 'vue'
import VueRouter from 'vue-router'

import Login from './components/Login.vue'
import Main from './components/Main.vue'
import Dashboard from './components/Dashboard.vue'
import Users from './components/Users.vue'
import Engines from './components/Engines.vue'
import Requests from './components/Requests.vue'
import Tasks from './components/Tasks.vue'
import Projects from './components/Projects.vue'
import Designer from './components/Designer.vue'
import MapView from './components/MapView.vue'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    { path: '/', component: Login, name: 'login' },
    {
      path: '/main',
      component: Main,
      name: 'main',
      children: [
        { path: '/dashboard', component: Dashboard, name: 'dashboard' },
        { path: '/users', component: Users, name: 'users' },
        { path: '/engines', component: Engines, name: 'engines' },
        { path: '/requests', component: Requests, name: 'requests' },
        { path: '/tasks', component: Tasks, name: 'tasks' },
        { path: '/projects', component: Projects, name: 'projects' },
        { path: '/designer/', component: Designer, name: 'designer' },
        { path: '/designer/:id', component: Designer, name: 'designerEdit' },
        { path: '/map/:id', component: MapView, name: 'map' }
      ]
    }
  ]
})
