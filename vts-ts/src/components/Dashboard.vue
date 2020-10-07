<template>
  <v-row style="margin-top: 115px;">
    <v-col lg="6" sm="12">
      <div style="padding: 10px;">
        <v-card elevation="1" class="dashboard-card primary-color-dark">
          <v-card-title>VTS Engines</v-card-title>
          <div id="enginesChart"></div>
          <v-card-text style="color: white;">
            <p id="runningEnginesMessage">{{engineMessage}}</p>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn submit color="amber darken-4" text>Manage</v-btn>
            <v-btn submit color="amber darken-4" text>Start All</v-btn>
            <v-btn submit color="amber darken-4" text>Stop All</v-btn>
          </v-card-actions>
        </v-card>
      </div>
      <div style="padding: 10px;">
        <v-card elevation="1" class="dashboard-card primary-color-dark">
          <v-card-title>Projects</v-card-title>
          <v-card-text style="color: white;">
            A Project is a request that has been created, but not yet submitted. Projects will be persisted until manually deleted, and can be edited and re-run as a request, or saved as a scheduled task, at any time.
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn submit color="amber darken-4" text>Manage</v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </v-col>
    <v-col lg="6" sm="12">
      <div style="padding: 10px;">
        <v-card elevation="1" class="dashboard-card primary-color-dark">
          <v-card-title>Requests</v-card-title>
          <div id="requestCountChart"></div>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn submit color="amber darken-4" text>Create</v-btn>
            <v-btn submit color="amber darken-4" text>Manage</v-btn>
          </v-card-actions>
        </v-card>
      </div>
      <div style="padding: 10px;">
        <v-card elevation="1" class="dashboard-card primary-color-dark">
          <v-card-title>Scheduled Tasks</v-card-title>
          <v-list dense disabled>
            <v-list-item-group v-model="tasks" color="transparent">
            <v-list-item v-for="(task, i) in tasks" :key="i">
              <v-list-item-content>
                <v-list-item-title v-text="task.label"></v-list-item-title>
                <v-list-item-subtitle v-text="task.time"></v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
          </v-list>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn submit color="amber darken-4" text>Create</v-btn>
            <v-btn submit color="amber darken-4" text>Manage</v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </v-col>
  </v-row>
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
  private engineChartData = {
    labels: new Array<number>(),
    series: new Array<Array<number>>()
  }

  private requestsChart: Chartist.IChartistPieChart|null = null
  private requestChartData = {
    labels: new Array<number>(),
    series: new Array<Array<number>>()
  }

  public tasks: Array<unknown> = []
  mounted () {
    if (this.user.name === 'noAuth') {
      // verify token is valid, if not, fetch new token, if still bad, then just load login screen
      router.push('/')
    } else {
      this.engineChart = new Chartist.Line('#enginesChart', this.engineChartData, {
        showPoint: false,
        lineSmooth: true,
        axisX: {
          showGrid: true,
          showLabel: false
        },
        axisY: {
          offset: 60,
          labelInterpolationFnc: function (value: string) {
            return `${value} reqs`
          }
        }
      })

      this.requestsChart = new Chartist.Pie('#requestCountChart', this.requestChartData, {
        labelInterpolationFnc: function (value: unknown[]) {
          return value[0]
        }
      }, [
        ['screen and (min-width: 640px)', {
          chartPadding: 30,
          labelOffset: 100,
          labelDirection: 'explode',
          labelInterpolationFnc: function (value: unknown) {
            return value
          }
        }],
        ['screen and (min-width: 1024px)', {
          labelOffset: 80,
          chartPadding: 20
        }]
      ])

      this.createEngineChart()
      this.createRequestChart()
      this.scheduledTaskList()
    }
  }

  async createEngineChart () {
    this.engineData = await API.fetchEngines(this.user)

    this.engineChartData.labels = new Array<number>()
    this.engineChartData.series = new Array<Array<number>>()

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

      this.engineChartData.labels.push(engine.id)
      const requestData = engine.queuedRequests ? engine.queuedRequests : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      this.engineChartData.series.push(requestData)

      if (this.engineChart) {
        this.engineChart.update(this.engineChartData)
      }
    }

    if (this.engineData && this.engineData.length === 1) {
      this.engineMessage = 'There is 1 engine running.'
    } else if (this.engineData && this.engineData.length > 1) {
      this.engineMessage = `There are ${this.engineData.length} engines running`
    } else {
      this.engineMessage = 'There are no engines running. Fire some up!'
    }

    // update the chart every few seconds
    setTimeout(() => this.createEngineChart(), 1000)
  }

  async createRequestChart () {
    const results = await API.fetchRequestCounts(this.user)
    this.requestChartData.series = [results[1], results[2], results[3], results[4], results[5]]

    if (this.requestsChart) {
      this.requestsChart.update(this.requestChartData)
    }

    // update the chart every few seconds
    setTimeout(() => this.createRequestChart(), 1000)
  }

  async scheduledTaskList () {
    const results = await API.fetchScheduledTasks(this.user)
    this.tasks = []

    if (results && results.length > 0) {
      results.forEach((request: { nextRunTime: string|number|Date; name: string }) => {
        let timeRemainingMessage = ''
        // time remaining, in seconds
        const timeRemaining = (new Date(request.nextRunTime).getTime() - new Date().getTime()) / 1000

        // create a nice message
        if (timeRemaining > 86400) timeRemainingMessage = Math.floor(timeRemaining / 86400) + ' Days'
        else if (timeRemaining > 3600) timeRemainingMessage = Math.floor(timeRemaining / 3600) + ' hours'
        else if (timeRemaining > 60) timeRemainingMessage = Math.floor(timeRemaining / 60) + ' minutes'
        else timeRemainingMessage = Math.floor(timeRemaining) > 0 ? Math.floor(timeRemaining) + ' seconds' : 'now'

        this.tasks.push({ label: request.name, time: timeRemainingMessage })
      })
    } else {
      this.tasks.push({ label: 'No Scheduled Tasks!', time: '' })
    }

    setTimeout(() => this.scheduledTaskList(), 1000)
  }
}
</script>
<style>
.dashboard-card {
    /* height: calc(50vh - 158px); */
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

.mem-chart .ct-label {
    color: white;
}

.ct-series-a .ct-bar, .ct-series-a .ct-line, .ct-series-a .ct-point, .ct-series-a .ct-slice-donut {
    stroke: orange;
}

.ct-series-a .ct-bar, .ct-series-b .ct-line, .ct-series-b .ct-point, .ct-series-b .ct-slice-donut {
    stroke: #253b27;
}

#requestCountChart .ct-series-a .ct-label {
    color: white;
}
</style>
