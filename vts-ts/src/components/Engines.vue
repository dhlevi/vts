<template>
  <div style="width: 100%; margin-top: 115px;" v-if="user.role === 'admin'">
    <v-row v-for="(engine, i) in engines" :key="i">
      <v-col cols="12">
        <v-card elevation="1" class="dashboard-card primary-color-dark">
          <v-card-title>{{engine.id}}&nbsp;|&nbsp;<span style="color: grey; font-size: 15px;">{{engine._id}}</span></v-card-title>
          <v-divider></v-divider>
          <v-expansion-panels color="green">
            <v-expansion-panel>
              <v-expansion-panel-header>
                <v-row no-gutters>
                  <v-col cols="12" class="text--secondary">
                    <v-row no-gutters style="width: 100%">
                      <v-chip v-if="engine.currentState === 'Running' && engine.requestedState === 'Running'" class="ma-2" color="green" text-color="white">Running</v-chip>
                      <v-chip v-if="engine.currentState === 'Stopped' && engine.requestedState === 'Stopped'" class="ma-2" color="red" text-color="white">Stopped</v-chip>
                      <v-chip v-if="engine.currentState === 'Running' && engine.requestedState === 'Stopped'" class="ma-2" color="yellow" text-color="white">Stopping</v-chip>
                      <v-chip v-if="engine.currentState === 'Stopped' && engine.requestedState === 'Running'" class="ma-2" color="yellow" text-color="white">Starting</v-chip>
                      <v-chip v-if="engine.currentState === 'Flushing'" class="ma-2" color="red" text-color="white">Flushing Queues</v-chip>
                      <v-chip outlined v-if="engine.acceptsRequests" class="ma-2">Ad-Hoc Requests supported</v-chip>
                      <v-chip outlined v-if="engine.acceptsScheduledTasks" class="ma-2">Scheduled Tasks Supported</v-chip>
                      <v-chip outlined class="ma-2">{{engine.totalRequests}} request over {{engine.uptime}} Mins</v-chip>
                    </v-row>
                  </v-col>
                </v-row>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                Content!
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn submit color="amber darken-4" text @click="scheduledTaskList()">Refresh</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import API from '@/service/api-service'

@Component
export default class Engines extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  public engines: Array<unknown> = []

  beforeMount () {
    this.fetchEngines()
  }

  mounted () {
    // mounted tasks?
  }

  async fetchEngines () {
    this.engines = await API.fetchEngines(this.user)
  }

  async stopEngine () {
    // stop
  }

  async startEngine () {
    // start
  }

  async flushEngine () {
    // flush
  }

  async editEngine () {
    // edit
  }

  async deleteEngine () {
    // delete
  }
}
</script>
<style>
</style>
