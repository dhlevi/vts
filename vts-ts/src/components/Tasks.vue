<template>
  <div style="width: 100%; margin-top: 115px;">
    <v-row>
      <v-col cols="12">
        <v-card elevation="1" class="dashboard-card primary-color-dark">
          <v-card-title>Scheduled Task Status</v-card-title>
          <v-divider></v-divider>
          <v-row no-gutters style="padding: 10px;">
            <v-col cols="10">
              <v-text-field v-model="searchText" label="Search"></v-text-field>
            </v-col>
            <v-col cols="2">
              <v-btn color="blue darken-1" text @click="search()">Search</v-btn>
            </v-col>
          </v-row>
          <v-divider></v-divider>
          <v-list dense flat>
            <v-list-item-group color="blue">
              <v-list-item v-for="(request, i) in requests" :key="i" @click="viewRequest(request)">
                <v-list-item-icon>
                  <v-icon v-if="request.status === 'Created'" color="blue">mdi-checkbox-marked-circle-outline</v-icon>
                  <v-icon v-else-if="request.status === 'Submitted'" color="blue">mdi-forward</v-icon>
                  <v-icon v-else-if="request.status === 'Queued'" color="yellow">mdi-tray-full</v-icon>
                  <v-icon v-else-if="request.status === 'In Progress'" color="orange">mdi-cog</v-icon>
                  <v-icon v-else-if="request.status === 'Completed'" color="green">mdi-emoticon</v-icon>
                  <v-icon v-else color="red">mdi-message-alert</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title v-text="request.name"></v-list-item-title>
                  <v-list-item-subtitle v-text="`Running on ${request.engine} | Status: ${request.status} | Messages: ${request.messages.length}`"></v-list-item-subtitle>
                  <v-list-item-subtitle v-text="request.description"></v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-if="selectedRequest != null" v-model="viewRequestDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card class="primary-color-dark">
        <v-card-title>
          <span class="headline">Request: {{selectedRequest.name}}</span>
        </v-card-title>
          <v-list dense flat disabled style="max-height: 500px;">
            <v-list-item-group color="blue">
              <v-list-item v-for="(message, i) in selectedRequest.messages" :key="i">
                <v-list-item-content>
                  <v-list-item-title v-text="message.message"></v-list-item-title>
                  <v-list-item-subtitle v-text="`From ${message.sender} on ${message.timestamp}`"></v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog()">
            Close
          </v-btn>
          <v-btn color="blue darken-1" text @click="deleteRequest()">
            Delete
          </v-btn>
          <v-btn color="blue darken-1" text @click="editRequest()">
            View/Edit
          </v-btn>
          <v-btn color="blue darken-1" text @click="viewRequestMap()">
            View on Map
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import VtsRequest from '@/model/request'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import API from '@/service/api-service'

@Component
export default class Tasks extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  public searchText = ''
  public requests: Array<VtsRequest> = []

  public selectedRequest: VtsRequest|null = null

  public viewRequestDialog = false
  private requestTimeout: NodeJS.Timeout|null = null

  beforeMount () {
    this.fetchRequests()
  }

  mounted () {
    // mount
  }

  async fetchRequests () {
    this.requests = await API.fetchScheduledTasks(this.user, this.searchText)
    if (!this.requestTimeout) {
      this.requestTimeout = setTimeout(() => this.fetchRequests(), 1000)
    }
  }

  search () {
    this.fetchRequests()
  }

  viewRequest (request: VtsRequest) {
    this.selectedRequest = request
    this.viewRequestDialog = true
  }

  viewRequestMap () {
    // view request in map page
  }

  editRequest () {
    // view request in designer
  }

  async deleteRequest () {
    if (this.selectedRequest) {
      await API.deleteVtsRequest(this.user, this.selectedRequest._id)
      this.fetchRequests()
      this.closeDialog()
    }
  }

  closeDialog () {
    this.selectedRequest = null
    this.viewRequestDialog = false
  }

  destroyed () {
    if (this.requestTimeout) {
      clearTimeout(this.requestTimeout)
      this.requestTimeout = null
    }
  }
}
</script>
<style>
.v-label {
  color: white !important
}
</style>
