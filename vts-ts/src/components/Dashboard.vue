<template>
  <v-layout row wrap align-content-center>
    <v-flex class="text-xs-center">
      <v-row>
        <v-col lg="6" sm="12">
          <v-card elevation="1" shaped class="dashboard-card primary-color-dark">
            <v-card-title>VTS Engines</v-card-title>
            <v-card-text style="color: white;">
              <div id="enginesChart"></div>
              <p id="runningEnginesMessage">{{engineMessage}}</p>
            </v-card-text>
            <v-card-actions>
              <v-btn submit color="amber darken-4" text>
                Login
              </v-btn>
            </v-card-actions>
          </v-card>
          <v-card elevation="1" shaped class="dashboard-card primary-color-dark">
            <v-card-title>Projects</v-card-title>
            <v-card-text style="color: white;">
              Projects
            </v-card-text>
            <v-card-actions>
              <v-btn submit color="amber darken-4" text>Manage</v-btn>
              <v-btn submit color="amber darken-4" text>Start All</v-btn>
              <v-btn submit color="amber darken-4" text>Stop All</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col lg="6" sm="12">
          <v-card elevation="1" shaped class="dashboard-card primary-color-dark">
            <v-card-title>Requests</v-card-title>
            <v-card-text style="color: white;">
              Requests
            </v-card-text>
            <v-card-actions>
              <v-btn submit color="amber darken-4" text>
                Login
              </v-btn>
            </v-card-actions>
          </v-card>
          <v-card elevation="1" shaped class="dashboard-card primary-color-dark">
            <v-card-title>Scheduled Tasks</v-card-title>
            <v-card-text style="color: white;">
              Scheduled Tasks
            </v-card-text>
            <v-card-actions>
              <v-btn submit color="amber darken-4" text>
                Login
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-flex>
  </v-layout>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import Chartist from 'chartist'
import router from '../router'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import API from '@/service/api-service'

@Component
export default class Dashboard extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public engineData: Array<any> = []
  public engineMessage = 'There are no engines running'
  private engineChart: Chartist.IChartistLineChart|null = null

  mounted () {
    if (this.user.name === 'noAuth') {
      // verify token is valid, if not, fetch new token, if still bad, then just load login screen
      router.push('/')
    } else {
      this.createEngineChart()
      this.createRequestChart()
    }
  }

  async createEngineChart () {
    this.engineData = await API.fetchEngines(this.user)
    console.log(this.engineData)
    for (const engine of this.engineData) {
      if (engine.route && engine.route.startsWith('http')) {
        const engineStatus = await API.fetchEngine(this.user, engine.route)

        engine.alive = false

        if (engineStatus) {
          engine.runningRequests = engineStatus.runningRequests
          engine.queuedRequests = engineStatus.queuedRequests
          engine.uptime = engineStatus.uptime
          engine.totalRequests = engineStatus.totalRequests
          engine.maxMemory = engineStatus.maxMemory
          engine.usedMemory = engineStatus.usedMemory
          engine.alive = true
        }
      }
    }

    const data = {
      labels: new Array<number>(),
      series: new Array<number>()
    }

    // update this to use the variable, not rebuild the whole chart object each time it loops
    for (const engine of this.engineData) {
      data.labels.push(engine.id)
      const requestData = engine.queuedRequests ? engine.queuedRequests : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      data.series.push(requestData)
    }

    const options = {
      showPoint: false,
      lineSmooth: true,
      axisX:
      {
        showGrid: true,
        showLabel: false
      },
      axisY:
      {
        offset: 60,
        labelInterpolationFnc: function (value: string) {
          return `${value} reqs`
        }
      }
    }

    this.engineChart = new Chartist.Line('#enginesChart', data, options)

    if (this.engineData && this.engineData.length === 1) {
      this.engineMessage = 'There is 1 engine running.'
    } else if (this.engineData && this.engineData.length > 1) {
      this.engineMessage = 'There are ' + this.engineData.length + ' engines running'
    } else {
      this.engineMessage = 'There are no engines running. Fire some up!'
    }

    // update the chart every few seconds
    setTimeout(() => this.createEngineChart(), 1000)
  }

  async createRequestChart () {
    // create request chart
  }
}
</script>
<style>
.dashboard-card {
    height: calc(50vh - 158px);
    overflow-y: auto;
}

.dashboard-card::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    background-color: #232f34;
}

.dashboard-card::-webkit-scrollbar {
    width: 10px;
    background-color: #232f34;
}

.dashboard-card::-webkit-scrollbar-thumb {
    background-color: #4A6572;
    border: 2px solid #232f34;
}

.primary-color {
    background: #344955 !important;
    color: white !important;
}

.primary-color-dark {
    background: #232f34 !important;
    color: white !important;
}

.primary-color-light {
    background: #4A6572 !important;
    color: white !important;
}

#enginesChart .ct-label {
    color: white;
}

#enginesChart .ct-grid {
    stroke: #ffffff94;
}

#enginesChart .ct-series-a .ct-line, .ct-series-a .ct-point {
    stroke: orange;
    stroke-width: 2px;
}

#enginesChart .ct-series-b .ct-line, .ct-series-b .ct-point {
    stroke: green;
    stroke-width: 2px;
}

#enginesChart .ct-series-c .ct-line, .ct-series-c .ct-point {
    stroke: red;
    stroke-width: 2px;
}

.engine .ct-label {
    color: white;
}

.engine .ct-grid {
    stroke: #ffffff94;
}

.engine .ct-series-a .ct-line, .ct-series-a .ct-point {
    stroke: orange;
    stroke-width: 2px;
}

.engine .ct-series-b .ct-line, .ct-series-b .ct-point {
    stroke: rgb(1, 180, 31);
    stroke-width: 2px;
}
</style>
