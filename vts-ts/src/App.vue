<template>
  <v-app class="login-background">
    <main>
      <v-container fill-height>
        <router-view :user="authentication.user" @updateUser="updateUser($event)"></router-view>
      </v-container>
    </main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import AuthenticatedUser from './model/authenticated-user'
import router from './router'

export default Vue.extend({
  name: 'App',
  components: {},
  router,
  data: () => ({
    authentication: {
      user: new AuthenticatedUser({ name: 'noAuth' })
    }
  }),
  methods: {
    updateUser (user: AuthenticatedUser) {
      this.authentication.user = user
    }
  }
})
</script>
<style scoped>
.login-background {
    background: radial-gradient(circle, #344955 0%, #000000 133%) !important;
}
</style>
