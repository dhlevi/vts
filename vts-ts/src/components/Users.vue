<template>
  <div style="width: 100%; margin-top: 115px;">
    <v-row v-if="user.role === 'admin'">
      <v-col cols="12">
        <v-card elevation="1" class="dashboard-card primary-color-dark">
          <v-card-title>Users</v-card-title>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn submit color="amber darken-4" text @click.stop="addUserDialog = true">Add User</v-btn>
          </v-card-actions>
          <v-divider></v-divider>
          <v-list dense flat>
            <v-list-item-group color="blue">
              <v-list-item v-for="(user, i) in users" :key="i" @click="viewUser(user)">
                <v-list-item-icon>
                  <v-icon v-if="user.role === 'admin'" color="red">mdi-account</v-icon>
                  <v-icon v-if="user.role === 'public'" color="blue">mdi-account</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title v-text="user.name"></v-list-item-title>
                  <v-list-item-subtitle v-text="user.role + ' | ' + user.email"></v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="addUserDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card class="primary-color-dark">
        <v-card-title>
          <span class="headline">User Profile</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="selectedUser.name" label="User Name*" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="selectedUser.email" label="Email*" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="selectedUser.password" label="Password*" type="password" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  :items="['public', 'admin']"
                  label="Role"
                  v-model="selectedUser.role"
                ></v-autocomplete>
              </v-col>
            </v-row>
          </v-container>
          <small>*indicates required field</small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeUserDialog()">
            Close
          </v-btn>
          <v-btn v-if="selectedUser._id !== null" color="blue darken-1" text @click="deleteUser()">
            Delete
          </v-btn>
          <v-btn color="blue darken-1" text @click="saveUser()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" :timeout="timeout" absolute right rounded="pill" top>
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn color="blue" text v-bind="attrs" @click="snackbar = false" >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import API from '@/service/api-service'

@Component
export default class Users extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  public addUserDialog = false
  public users: Array<AuthenticatedUser> = []
  public selectedUser: AuthenticatedUser = new AuthenticatedUser({})

  private snackbar = false
  private timeout = 2000
  private snackbarText = ''

  mounted () {
    this.fetchUsers()
  }

  async fetchUsers () {
    this.users = await API.fetchUsers(this.user)
  }

  viewUser (clickedUser: AuthenticatedUser) {
    if (clickedUser) {
      this.selectedUser = clickedUser
      this.addUserDialog = true
    }
  }

  closeUserDialog () {
    this.selectedUser = new AuthenticatedUser({})
    this.addUserDialog = false
    this.fetchUsers()
  }

  async saveUser () {
    let response = null

    if (!this.selectedUser._id) {
      response = await API.createUser(this.user, this.selectedUser)
    } else {
      response = await API.updateUser(this.user, this.selectedUser)
    }

    if (response) {
      this.snackbarText = `${this.selectedUser.name} has been saved...`
      this.snackbar = true
    }

    this.closeUserDialog()
  }

  async deleteUser () {
    const response = await API.deleteUser(this.user, this.selectedUser)

    if (response) {
      this.snackbarText = `${this.selectedUser.name} has been deleted...`
      this.snackbar = true
    }

    this.closeUserDialog()
  }
}
</script>
<style>
</style>
