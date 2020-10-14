<template>
  <div style="width: 100%; margin-top: 115px;" v-if="user.role === 'admin'">
    <v-row v-for="(engine, i) in engines" :key="i">
      <v-col cols="12">
        <v-card elevation="1" class="dashboard-card primary-color-dark">
          <v-card-title>{{engine.id}}&nbsp;|&nbsp;<span style="color: grey; font-size: 15px; font-weight: 100;">{{engine._id}}</span></v-card-title>
          <v-divider></v-divider>
          <v-expansion-panels color="green" v-model="panelIndex">
            <v-expansion-panel>
              <v-expansion-panel-header>
                <v-row no-gutters>
                  <v-col cols="12" class="text--secondary">
                    <v-row no-gutters style="width: 100%">
                      <v-chip v-if="engine.currentState === 'Stopped' && engine.requestedState === 'Stopped'" class="ma-2" color="red" text-color="white">Stopped</v-chip>
                      <v-chip v-else-if="engine.currentState === 'Running' && engine.requestedState === 'Stopped'" class="ma-2" color="yellow" text-color="white">Stopping</v-chip>
                      <v-chip v-else-if="engine.currentState === 'Stopped' && engine.requestedState === 'Running'" class="ma-2" color="yellow" text-color="white">Starting</v-chip>
                      <v-chip v-else-if="engine.currentState === 'Flushing'" class="ma-2" color="red" text-color="white">Flushing Queues</v-chip>
                      <v-chip v-else-if="engine.currentState === 'Running' && engine.requestedState === 'Running'" class="ma-2" color="green" text-color="white">Running</v-chip>
                      <v-chip v-else class="ma-2" outlined>Unknown Engine Status</v-chip>
                      <v-chip color="white" text-color="black" v-if="engine.acceptsRequests" class="ma-2">Ad-Hoc Requests supported</v-chip>
                      <v-chip color="white" text-color="black" v-if="engine.acceptsScheduledTasks" class="ma-2">Scheduled Tasks Supported</v-chip>
                      <v-chip color="white" text-color="black" class="ma-2">{{engine.totalRequests}} request over {{engine.uptime}} Mins</v-chip>
                    </v-row>
                  </v-col>
                </v-row>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <p style="color: white;" v-if="engine.route && engine.route.startsWith('http')">Route to engine: <a v-bind:href="engine.route" target="_blank">{{engine.route}}</a></p>
                <v-row>
                  <v-col cols="8">
                    <p style="text-align: center; color: white;">Engine Request Status:</p>
                    <v-sparkline
                      :value="engine.queuedRequests"
                      smooth
                      :line-width="2"
                      stroke-linecap="round"
                      :fill="true"
                      color="orange">
                      <template v-slot:label="item">
                        {{ item.value }}
                      </template>
                    </v-sparkline>
                  </v-col>
                  <v-col cols="4">
                    <p style="text-align: center; color: white;">Memory Usage:</p>
                    <v-sparkline
                      :value="[engine.usedMemory, engine.maxMemory]"
                      :line-width="50"
                      color="red"
                      type="bar"
                      stroke-linecap="round"
                      smooth
                      height="150px">
                      <template v-slot:label="item">
                        {{ item.value }}mb
                      </template>
                    </v-sparkline>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="6" class="collection" style="max-height: 300px; overflow: auto;">
                    <p style="text-align: center; color: white;">Messages</p>
                    <v-list dense flat disabled>
                      <v-list-item-group color="primary">
                        <v-list-item v-for="(message, j) in engine.messages" :key="j">
                          <v-list-item-content>
                            <v-list-item-title v-html="message.message"></v-list-item-title>
                            <v-list-item-subtitle v-html="message.sender"></v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                      </v-list-item-group>
                    </v-list>
                  </v-col>
                  <v-col cols="6" class="collection" style="max-height: 300px; overflow: auto;">
                    <p style="text-align: center; color: white;">History</p>
                    <v-list dense flat disabled>
                      <v-list-item-group color="primary">
                        <v-list-item v-for="(history, j) in engine.metadata.history" :key="j">
                          <v-list-item-content>
                            <v-list-item-title v-html="history.event"></v-list-item-title>
                            <v-list-item-subtitle v-html="history.user"></v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                      </v-list-item-group>
                    </v-list>
                  </v-col>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn v-if="engine.currentState === 'Running'" icon color="red" @click="stopEngine(i)"><v-icon>mdi-power-off</v-icon></v-btn>
            <v-btn v-else icon color="green" @click="startEngine(i)"><v-icon>mdi-power</v-icon></v-btn>
            <v-btn icon color="orange" @click="flushEngine(i)"><v-icon>mdi-tray-full</v-icon></v-btn>
            <v-btn icon color="orange" @click="editEngine(i)"><v-icon>mdi-pencil</v-icon></v-btn>
            <v-btn icon color="orange" @click="deleteEngine(i)"><v-icon>mdi-delete</v-icon></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="editEngineDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card class="primary-color-dark">
        <v-card-title>
          <span class="headline">Edit Engine</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="selectedEngine.route" label="Route"></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-checkbox v-model="selectedEngine.acceptsRequests" label="Accepts Ad Hoc Requests"></v-checkbox>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-checkbox v-model="selectedEngine.acceptsScheduledTasks" label="Accepts Ad Hoc Requests"></v-checkbox>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeEngineDialog()">
            Close
          </v-btn>
          <v-btn color="blue darken-1" text @click="saveEngine()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import Vue from 'vue'
import { Component, Prop, Watch } from 'vue-property-decorator'
import API from '@/service/api-service'
import Engine from '@/model/engine'

class EngineChart {
  public engineId: string|null = null
  public chart: Chartist.IChartistLineChart|null = null
  private chartData = {
    labels: new Array<number>(),
    series: new Array<Array<number>>()
  }
}

@Component
export default class Engines extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  public panelIndex = -1

  public engines: Array<Engine> = []
  public engineCharts: Array<EngineChart> = []

  private engineTimeout: NodeJS.Timeout|null = null

  public editEngineDialog = false
  public selectedEngine: Engine = new Engine({})

  async mounted () {
    await this.fetchEngines()
  }

  @Watch('panelIndex')
  panelIndexChanged (panelIndex: number) {
    if (panelIndex === undefined || panelIndex === -1) {
      this.panelIndex = -1
      if (this.engineTimeout) {
        clearTimeout(this.engineTimeout)
      }
    } else {
      this.panelIndex = panelIndex
      // destroy the existing chart/engine timeout loop
      if (this.engineTimeout) {
        clearTimeout(this.engineTimeout)
      }
      // we know which panel is opened, so create a chart for that engine, start a new engine timeout loop
      this.updateEngine()
    }
  }

  async updateEngine () {
    // engine_' + i + '_Chart
    if (this.panelIndex > -1) {
      const engine = this.engines[this.panelIndex]
      const updatedEngine = await API.fetchEngine(this.user, engine._id)
      const engineStatus = await API.fetchEngineStatus(this.user, updatedEngine.route)
      engine.runningRequests = engineStatus.runningRequests
      engine.queuedRequests = engineStatus.queuedRequests || []
      engine.uptime = engineStatus.uptime || null
      engine.totalRequests = engineStatus.totalRequests || null
      engine.maxMemory = engineStatus.maxMemory || null
      engine.usedMemory = engineStatus.usedMemory || null
      engine.alive = engineStatus.alive || null
      this.engineTimeout = setTimeout(() => this.updateEngine(), 1000)
    }
  }

  async fetchEngines () {
    this.engines = await API.fetchEngines(this.user)
  }

  async stopEngine (index: number) {
    const engine = this.engines[index]
    API.shutdownEngine(this.user, engine._id)
    this.fetchEngines()
    setTimeout(() => this.fetchEngines(), 10000)
  }

  async startEngine (index: number) {
    const engine = this.engines[index]
    API.startupEngine(this.user, engine._id)
    this.fetchEngines()
    setTimeout(() => this.fetchEngines(), 10000)
  }

  async flushEngine (index: number) {
    const engine = this.engines[index]
    API.flushEngine(this.user, engine._id)
    this.fetchEngines()
    setTimeout(() => this.fetchEngines(), 10000)
  }

  async editEngine (index: number) {
    this.selectedEngine = this.engines[index]
    this.editEngineDialog = true
  }

  async deleteEngine (index: number) {
    const engine = this.engines[index]
    API.deleteEngine(this.user, engine._id)
    this.fetchEngines()
    setTimeout(() => this.fetchEngines(), 10000)
  }

  async saveEngine () {
    // save selectedEngine, refresh, close dialog
    const updatedEngine = await API.updateEngine(this.user, this.selectedEngine)

    if (updatedEngine) {
      // toast
      console.log(updatedEngine)
    }

    this.fetchEngines()
    this.editEngineDialog = false
  }

  closeEngineDialog () {
    this.editEngineDialog = false
    this.selectedEngine = new Engine({})
  }

  destroyed () {
    if (this.engineTimeout) {
      clearTimeout(this.engineTimeout)
      this.engineTimeout = null
    }
  }
}
</script>
<style>
.v-list {
  background: #5e7c8b !important;
  border: 1px solid #656565;
}

.v-list-item {
  border-bottom: 1px solid #656565;
}

.v-expansion-panel {
  background: #4A6572 !important;
}

.collection::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    background-color: #a7a7a7;
}

.collection::-webkit-scrollbar {
    width: 10px;
    background-color: #a7a7a7;
}

.collection::-webkit-scrollbar-thumb {
    background-color: #4A6572;
    border: 2px solid #a7a7a7;
}
</style>
