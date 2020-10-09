import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
require('leaflet/dist/leaflet.css')
Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
