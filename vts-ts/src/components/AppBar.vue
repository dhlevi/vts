<template>
    <v-app-bar
      absolute
      color="#6A76AB"
      dark
      src="https://picsum.photos/1920/1080?random"
      fade-img-on-scroll
    >
      <template v-slot:img="{ props }">
        <v-img
          v-bind="props"
          gradient="to top right, rgba(100,115,201,.7), rgba(25,32,72,.7)"
        ></v-img>
      </template>

      <v-app-bar-nav-icon></v-app-bar-nav-icon>

      <v-toolbar-title>Vivid Topology Service</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-heart</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>

      <template v-slot:extension>
        <v-tabs align-with-title>
          <v-tab @click="showTab('dashboard')">Dashboard</v-tab>
          <v-tab @click="showTab('users')">User Management</v-tab>
          <v-tab @click="showTab('engines')">Engines</v-tab>
          <v-tab @click="showTab('requests')">Requests</v-tab>
          <v-tab @click="showTab('tasks')">Scheduled Tasks</v-tab>
          <v-tab @click="showTab('projects')">Projects</v-tab>
          <v-tab @click="showTab('designer')">Designer</v-tab>
        </v-tabs>
      </template>
    </v-app-bar>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import router from '../router'

@Component
export default class AppBar extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  showTab (tab: string) {
    console.log(`showing tab ${tab}`)
    router.push(tab)
  }
}
</script>
<style>
</style>
