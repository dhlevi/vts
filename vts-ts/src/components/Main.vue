<template>
  <v-layout row wrap align-content-center>
    <AppBar :user="user"/>
    <router-view :user="user"></router-view>
  </v-layout>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import router from '../router'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import AppBar from './AppBar.vue'

@Component({
  components: {
    AppBar: AppBar
  }
})
export default class Dashboard extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  public tasks: Array<unknown> = []
  mounted () {
    if (this.user.name === 'noAuth') {
      // verify token is valid, if not, fetch new token, if still bad, then just load login screen
      router.push('/')
    }
  }
}
</script>
<style>
</style>
