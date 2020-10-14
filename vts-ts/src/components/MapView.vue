<template>
  <div fill-width style="margin-top: 115px; width: 100%; height: calc(100vh - 145px);">
    <l-map ref="map" style="width: 100%; height: 100%;">
      <l-control-layers ref="layerList" position="topright"></l-control-layers>
      <l-tile-layer
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>'
      />
      <l-geo-json v-for="(jsonObject, i) in jsonObjects" :key="i"
                  :geojson="jsonObject.json"
                  layer-type="overlay"
                  :name="jsonObject.name"
                  :options-style="jsonObject.style"></l-geo-json>
      <vector-grid-slicer v-for="(jsonObject, i) in jsonObjects" :key="i + jsonObject.length"
                          :json="jsonObject.json"
                          :name="jsonObject.name"
                          layer-type="base"
                          :options="{
                            vectorTileLayerStyles: {
                              sliced: function (properties, zoom) {
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
                              getFeatureId: function (feature) {
                                const properties = feature.properties
                                console.log(properties)
                                return properties.name
                              }
                            }
                          }"
      />
    </l-map>
  </div>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import VtsRequest from '@/model/request'
import Vue from 'vue'
import { Component, Prop, Watch } from 'vue-property-decorator'
import API from '@/service/api-service'
import { LMap, LTileLayer, LControlLayers, LGeoJson } from 'vue2-leaflet'
import L from 'leaflet'
import 'leaflet.vectorgrid'
import VectorGridSlicer from './VectorGridSlicer.vue'
import Engine from '@/model/engine'

@Component({
  components: {
    LMap: LMap,
    LTileLayer: LTileLayer,
    LControlLayers: LControlLayers,
    LGeoJson: LGeoJson,
    VectorGridSlicer: VectorGridSlicer
  }
})
export default class MapView extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  private requestId = ''
  private request: VtsRequest|null = null

  public jsonObjects: Array<any> = []

  async mounted () {
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
        const map = (this.$refs.map as LMap).mapObject

        for (const processor of this.request.processors) {
          for (const node of Object.keys(processor.outputNodes)) {
            const geojson = await API.fetchRequestJson(engine.route, this.request.name, processor.name, node)
            console.log(`fetched for ${processor.name}/${node}`)
            console.log(geojson)
            if (geojson) {
              console.log('Found geometry')
              // strip out any null features
              geojson.features = geojson.features.filter(function (el: any) {
                return el != null
              })

              if (geojson && geojson.features && geojson.features.length > 0) {
                console.log('creating layer...')
                const color = '#000000'.replace(/0/g, function () { return (~~(Math.random() * 16)).toString(16) })
                this.jsonObjects.push({
                  json: geojson,
                  name: `${processor.type}-${processor.name}-${node}`,
                  style: {
                    fill: true,
                    fillColor: color,
                    color: color,
                    opacity: 0.8,
                    width: 2
                  }
                })
              }
            }
          }
        }
      }
    }
  }

  @Watch('$route')
  route () {
    this.requestId = (this as any).$router.history.params.id
  }
}
</script>
<style>
.leaflet-container {
  position: relative !important;
}
</style>
