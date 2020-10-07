<template>
  <v-row style="margin-top: 115px;">
    <div>This is the Tasks panel</div>
  </v-row>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component
export default class Tasks extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser
}
</script>
<style>
</style>
