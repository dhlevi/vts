<template>
  <v-layout row wrap align-content-center>
    <v-flex class="text-xs-center">
      <v-card elevation="1" :loading="loggingIn" shaped style="width: 460px; position: fixed; top: calc(50vh - 135px); left: calc(50vw - 230px);">
        <v-card-title>Login to VTS</v-card-title>
        <v-card-text>
          <v-row align="center" class="mx-0">
            <v-text-field v-model="name" label="Name" type="text" outlined @keyup="login($event)"></v-text-field>
          </v-row>
          <v-row align="center" class="mx-0">
            <v-text-field v-model="password" label="Password" type="password" outlined @keyup="login($event)"></v-text-field>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn type="submit" color="blue-grey" text @click="login(null)">
            Login
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import API from '../service/api-service'

@Component
export default class Login extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  public loggingIn = false
  public name: string|null = null
  public password: string|null = null

  mounted () {
    if (this.user.name !== 'noAuth') {
      // verify token is valid, if not, fetch new token, if still bad, then just load login screen
      this.$router.push('/dashboard')
    }
  }

  async login (event: KeyboardEvent) {
    if (event && event.key !== 'Enter') {
      return
    }

    this.loggingIn = true
    const newUser = await API.login(this.name || '', this.password || '')

    if (newUser) {
      this.updateUser(newUser)
      this.$router.push('/dashboard')
    } else {
      this.loggingIn = false
    }
  }

  updateUser (newUser: AuthenticatedUser) {
    this.$emit('updateUser', newUser)
  }
}
</script>
<style>
</style>
