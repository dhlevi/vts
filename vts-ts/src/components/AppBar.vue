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

      <v-img
        lazy-src="https://picsum.photos/id/11/10/6"
        max-height="50"
        max-width="150"
        src="https://picsum.photos/id/11/500/300"
        style="margin-right: 15px;"
      ></v-img>

      <v-toolbar-title>Vivid Topology Service</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-file-document-outline</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-information</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-account</v-icon>
      </v-btn>

      <template v-slot:extension>
        <v-tabs center-active show-arrows id="tabs" align-with-title>
          <v-tab key="dashboard" @click="showTab('dashboard')">Dashboard</v-tab>
          <v-tab v-if="user.role === 'admin'" key="users" @click="showTab('users')">User Management</v-tab>
          <v-tab v-if="user.role === 'admin'" key="engines" @click="showTab('engines')">Engines</v-tab>
          <v-tab key="requests" @click="showTab('requests')">Requests</v-tab>
          <v-tab v-if="user.role === 'admin'" key="tasks" @click="showTab('tasks')">Scheduled Tasks</v-tab>
          <v-tab key="projects" @click="showTab('projects')">Projects</v-tab>
          <v-tab key="designer" @click="showTab('designer')">Designer</v-tab>
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
    if (router.currentRoute.name !== tab) {
      router.push(tab)
    }
  }
}
</script>
<style>
</style>
