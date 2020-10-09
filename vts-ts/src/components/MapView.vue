<template>
  <div style="width: 100%; margin-top: 115px;">
    <v-row style="width: 100%; height: 100%;">
      <v-col cols="12" style="width: 100%; height: 100%;">
        <l-map ref="map" style="width: calc(100vw - 100px); height: calc(100vh - 160px);">
          <l-tile-layer
              url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>'
          />
        </l-map>
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import VtsRequest from '@/model/request'
import Vue from 'vue'
import { Component, Prop, Watch } from 'vue-property-decorator'
import API from '@/service/api-service'
import { LMap, LTileLayer } from 'vue2-leaflet'
import L from 'leaflet'
import 'leaflet.vectorgrid'
import VectorGridSlicer from './VectorGridSlicer.vue'
import Engine from '@/model/engine'

@Component({
  components: {
    LMap: LMap,
    LTileLayer: LTileLayer,
    VectorGridSlicer: VectorGridSlicer
  }
})
export default class MapView extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  private requestId = ''
  private request: VtsRequest|null = null

  async beforeMount () {
    this.requestId = (this as any).$router.history.current.params.id
    this.request = await API.fetchVtsRequest(this.user, this.requestId)
    this.fetchGeoJson()
  }

  async fetchGeoJson () {
    if (this.request) {
      let engine: Engine|null = null
      const engines = await API.fetchEngines(this.user)

      for (const engineData of engines) {
        if (this.request && engineData.id === this.request.engine) {
          engine = await API.fetchEngine(this.user, engineData._id) as Engine
          break
        }
      }

      if (engine) {
        for (const processor of this.request.processors) {
          for (const node of Object.keys(processor.outputNodes)) {
            const geojson = await API.fetchRequestJson(engine.route, this.request.name, processor.name, node)

            if (geojson) {
              // strip out any null features
              geojson.features = geojson.features.filter(function (el: any) {
                return el != null
              })

              if (geojson && geojson.features && geojson.features.length > 0) {
                const options = {
                  vectorTileLayerStyles: {
                    sliced: function (properties: any, zoom: number) {
                      let weight = 1

                      weight = zoom > 10 ? 3
                        : zoom > 5 ? 2
                          : 1

                      return {
                        weight: weight,
                        color: '#9a9a9a',
                        dashArray: '2, 6',
                        fillOpacity: 0
                      }
                    },
                    interactive: true,
                    getFeatureId: function (feature: { properties: any }) {
                      const properties = feature.properties
                      console.log(properties)
                      return properties.name
                    },
                    onEachFeature: () => this.onEachFeatureFunction
                  }
                }

                L.vectorGrid.slicer(geojson, options).addTo((this.$refs.map as LMap).mapObject)
              }
            }
          }
        }
      }
    }
  }

  mounted () {
    // mounted actions
  }

  @Watch('$route')
  route () {
    this.requestId = (this as any).$router.history.params.id
  }

  onEachFeatureFunction () {
    return (feature: any, layer: any) => {
      layer.bindTooltip(
        '<div>code:' +
        feature.properties.admin +
        '</div><div>nom: ' +
        feature.properties.name +
        '</div>',
        {
          permanent: false, sticky: true
        }
      )
    }
  }
}
</script>
<style>
.leaflet-container {
  position: absolute !important;
}
</style>
