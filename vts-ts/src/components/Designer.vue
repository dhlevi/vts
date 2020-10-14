<template>
  <v-row style="margin-top: 115px; width: 100%; height: calc(100vh - 145px);">
    <v-col cols="3">
      <v-list dense flat style="height: calc(100vh - 170px); overflow-y: auto">
        <v-list-item-group color="blue">
          <v-list-item v-for="(tool, i) in tools" :key="i" @click="addTool(tool)">
            <v-list-item-icon style="margin-left: 0px; margin-right: 5px; margin-top: 10px; margin-bottom: 0px;">
              <v-icon>mdi-{{ tool.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{tool.name.replace( /([A-Z])/g, ' $1' )}}</v-list-item-title>
              <v-list-item-subtitle v-text="tool.tooltip"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-col>
    <v-col cols="9">
      <v-row no-gutters style="height: 55px;">
        <v-toolbar dense>
          <v-btn icon><v-icon>mdi-run-fast</v-icon></v-btn>
          <v-btn icon><v-icon>mdi-clock-outline</v-icon></v-btn>
          <v-btn icon><v-icon>mdi-content-save</v-icon></v-btn>
          <v-btn icon @click="clearDiagram()"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
      </v-row>
      <v-row no-gutters style="width: 100%; height: calc(100% - 40px);">
        <div id="creatorCanvas" style="width: 100%; height: 100%;">
          <div style="width: 100%; height: 100%;" class="designer-canvas jtk-canvas canvas-wide flowchart-area jtk-surface jtk-surface-nopan" id="canvas">
          </div>
        </div>
      </v-row>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import VtsRequest from '@/model/request'
import API from '@/service/api-service'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import * as jsPlumb from '@jsplumb/community'
import { BrowserJsPlumbInstance } from '@jsplumb/community'

@Component
export default class Designer extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  private requestId = ''
  private request: VtsRequest = new VtsRequest({})
  public plumbInst: BrowserJsPlumbInstance|null = null
  private targetEndpoint: any|null = null
  private sourceEndpoint: any|null = null
  private writerTargetEndpoint: any|null = null
  private writerSourceEndpoint: any|null = null
  private readerSourceEndpoint: any|null = null

  public tools: Array<any> = [{ name: 'httpReader', tooltip: 'HTTP Reader (GeoJSON, KML, KMZ, GML, Shape(root level zip), FGDB(root level zip))', icon: 'http' },
    { name: 'fileReader', tooltip: 'File Reader (GeoJSON, KML, KMZ, GML, Shape(root level zip), FGDB(root level zip))', icon: 'all_inbox' },
    { name: 'dbReader', tooltip: 'Database Reader (Oracle, Postgis, Couch, Mongo, MS Sql)', icon: 'storage' },
    { name: 'randomReader', tooltip: 'Creates a random point, line or polygon feature to start a process', icon: 'storage' },
    { name: 'cacheReader', tooltip: 'Reads features from the VTS cache service', icon: 'cached' },
    // processors
    { name: 'projector', tooltip: 'Reproject feature geometry', icon: 'scatter_plot' },
    { name: 'cleanCoords', tooltip: 'Remove redundant coordinates', icon: 'border_style' },
    { name: 'buffer', tooltip: 'Buffer features', icon: 'settings_overscan' },
    { name: 'hullCreator', tooltip: 'Create a convex or concave hull from features', icon: 'filter_tilt_shift' },
    { name: 'difference', tooltip: 'Clip the difference between two feature sets', icon: 'flip_to_back' },
    { name: 'dissolve', tooltip: 'Dissolve all features', icon: 'donut_small' },
    { name: 'intersect', tooltip: 'Intersect all features by another feature set', icon: 'branding_watermark' },
    { name: 'simplify', tooltip: 'Simplify all features', icon: 'change_history' },
    { name: 'tesselate', tooltip: 'Tesselate all features', icon: 'details' },
    { name: 'union', tooltip: 'Union all features', icon: 'link' },
    { name: 'scale', tooltip: 'Scale all features', icon: 'aspect_ratio' },
    { name: 'rotate', tooltip: 'Rotate all features', icon: 'loop' },
    { name: 'translate', tooltip: 'Translate all features', icon: 'track_changes' },
    { name: 'voronoi', tooltip: 'Create a voronoi diagram from the feature points', icon: 'grain' },
    { name: 'merge', tooltip: 'Combine features into a multifeature geometry', icon: 'attach_file' },
    { name: 'flatten', tooltip: 'Merge multi features into single feature geometry', icon: 'call_merge' },
    { name: 'explode', tooltip: 'Convert all features coordinates into points', icon: 'border_clear' },
    { name: 'flip', tooltip: 'Flips all features xy coords', icon: 'flip' },
    { name: 'reducePrecision', tooltip: 'Truncates the precision of coordinates', icon: 'sort' },
    { name: 'bezierCurve', tooltip: 'Creates a bezier curve from a linestring', icon: 'gesture' },
    { name: 'lineToPolygon', tooltip: 'Creates a polygon from a linestring', icon: 'crop' },
    { name: 'polygonToLine', tooltip: 'Converts a polygon into a linestring', icon: 'show_chart' },
    { name: 'lineChunk', tooltip: 'Breaks a linestring into chunks', icon: 'tune' },
    { name: 'unkink', tooltip: 'Breaks self-intersecting polygons into multipolygon features', icon: 'unfold_less' },
    { name: 'tin', tooltip: 'Creates a TIN (triangulated irregular network) from a set of points', icon: 'sports_soccer' },
    { name: 'donutExtractor', tooltip: 'Creates a new set of data containing extracted donuts', icon: 'vignette' },
    { name: 'donutRemover', tooltip: 'Removes all donuts from polygons', icon: 'wb_iridescent' },
    { name: 'boundingBoxReplace', tooltip: 'Replaces all features with their bounding box', icon: 'launch' },
    { name: 'boundingBoxCreator', tooltip: 'Create a bounding box from min/max XY coordinates', icon: 'open_in_new' },
    { name: 'hullReplace', tooltip: 'Replaces all features with their convex or concave hull', icon: 'amp_stories' },
    { name: 'lineCreator', tooltip: 'Creates a linestring from feature vertices. For point features, merge into a multipoint feature first.', icon: 'timeline' },
    // measurement
    { name: 'along', tooltip: 'Creates a point as a new feature at a given distance along a line', icon: 'share' },
    { name: 'area', tooltip: 'Gets the area of a feature', icon: 'texture' },
    { name: 'boundingBox', tooltip: 'Creates a bounding box encompassing all features', icon: 'panorama_vertical' },
    { name: 'center', tooltip: 'Finds the center of a feature', icon: 'center_focus_strong' },
    { name: 'centerOfMass', tooltip: 'Finds the center of mass for a feature', icon: 'center_focus_weak' },
    { name: 'centerAll', tooltip: 'Finds the center of all features', icon: 'all_out' },
    { name: 'centerOfMassAll', tooltip: 'Finds the center of mass for all features', icon: 'toll' },
    { name: 'centroid', tooltip: 'Finds the centroid of a feature by taking the mean of all vertices', icon: 'my_location' },
    { name: 'destination', tooltip: 'Given a distance and bearing, finds the destination point for all point features', icon: 'place' },
    { name: 'length', tooltip: 'Calculates the length of a feature', icon: 'square_foot' },
    { name: 'vertexCounter', tooltip: 'Calculates the number of vertices in a feature', icon: 'linear_scale' },
    // array operators
    { name: 'filter', tooltip: 'Filter features non-spatially by an attribute', icon: 'filter_list' },
    { name: 'nullGeometryFilter', tooltip: 'Filter features that have empty geometry', icon: 'highlight_alt' },
    { name: 'spatialFilter', tooltip: 'Filter features spatially by their type', icon: 'filter_b_and_w' },
    { name: 'spatialRelationFilter', tooltip: 'Filter features spatially by their relation', icon: 'filter' },
    // attribute tools
    { name: 'attributeCreator', tooltip: 'Add an attribute to all features', icon: 'title' },
    { name: 'attributeRemover', tooltip: 'Remove an attribute from all features', icon: 'format_clear' },
    { name: 'attributeRenamer', tooltip: 'Rename an attribute from all features', icon: 'text_fields' },
    { name: 'attributeKeeper', tooltip: 'Keep/Create only the requested comma separated list of attributes', icon: 'menu_open' },
    { name: 'attributeCalculator', tooltip: 'Add an attribute that contains a calculation', icon: 'functions' },
    { name: 'timestamper', tooltip: 'Timestamp all features', icon: 'av_timer' },
    { name: 'counter', tooltip: 'Counts all features, and saves the count in a property', icon: 'exposure_plus_1' },
    { name: 'sqlCaller', tooltip: 'Execute a SQL query and append the resulting attributes to a feature', icon: 'nfc' },
    // special tools
    // { name: 'logger', tooltip: 'Create a log message for all features', icon: ''},
    { name: 'featureHolder', tooltip: 'Holds features for merging datasets', icon: 'horizontal_split' },
    // writer
    { name: 'fileWriter', tooltip: 'Write results to a file (GeoJSON, KML, KMZ, CSV, WKT, GML, Shape(zip), FGDB(zip))', icon: 'publish' },
    { name: 'httpWriter', tooltip: 'Write results to an HTTP service', icon: 'backup' },
    { name: 'dbWriter', tooltip: 'Write results to a DB (Oracle, Postgis, Couch, Mongo, MS Sql)', icon: 'dns' },
    { name: 'cacheWriter', tooltip: 'Write results to the VTS cache and serve', icon: 'layers' }]

  async mounted () {
    const params = (this as any).$router.history.current.params
    if (Object.prototype.hasOwnProperty.call(params, 'id')) {
      this.requestId = params.id
      this.request = await API.fetchVtsRequest(this.user, this.requestId)
    }

    jsPlumb.ready(() => {
      this.plumbInst = jsPlumb.newInstance({
        // default drag options
        dragOptions: {
          cursor: 'pointer',
          zIndex: 2000,
          containment: 'true',
          stop: (event) => { console.log(event)/* Put drag stop logic here */ }
        },
        // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
        // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
        connectionOverlays: [
          ['Arrow', {
            location: 1,
            visible: true,
            width: 11,
            length: 11,
            id: 'ARROW',
            events: {
              click: function () { alert('you clicked on the arrow overlay') }
            }
          }],
          ['Label', {
            location: 0.5,
            id: 'label',
            cssClass: 'designerLabel',
            events: {
              tap: function () { alert('You clicke a label') }
            }
          }]
        ],
        container: 'canvas'
      })

      const basicType: jsPlumb.TypeDescriptor = {
        connector: 'StateMachine',
        paintStyle: { stroke: 'red', strokeWidth: 4 },
        hoverPaintStyle: { stroke: 'blue' },
        overlays: ['Arrow']
      }

      this.plumbInst.registerConnectionType('basic', basicType)

      const connectorPaintStyle = {
        strokeWidth: 2,
        stroke: 'black',
        joinstyle: 'round',
        outlineStroke: '#ffffff21',
        outlineWidth: 1
      }

      const connectorHoverStyle = {
        strokeWidth: 3,
        stroke: '#f44336',
        outlineWidth: 2,
        outlineStroke: '#ffffff21'
      }

      const endpointHoverStyle = {
        fill: '#f44336',
        stroke: '#f44336'
      }
      // the definition of source endpoints (the small blue ones)
      this.sourceEndpoint = {
        endpoint: 'Dot',
        paintStyle: {
          stroke: '#f5f5f5',
          fill: '#474444',
          radius: 7,
          strokeWidth: 4
        },
        isSource: true,
        connector: ['Flowchart', { stub: [0, 0], gap: 10, cornerRadius: 8, alwaysRespectStubs: false }],
        connectorStyle: connectorPaintStyle,
        hoverPaintStyle: endpointHoverStyle,
        maxConnections: -1,
        connectorHoverStyle: connectorHoverStyle,
        dragOptions: {},
        // label the nodes... not sure? Only useful for multiple in/out
        overlays: [['Label', { location: [0.5, 1.5], label: 'Drag', cssClass: 'endpointSourceLabel', visible: false }]]
      }
      // the definition of writer endpoints (the small blue ones)
      this.writerTargetEndpoint = {
        endpoint: 'Dot',
        paintStyle:
              {
                stroke: '#f5f5f5',
                fill: '#474444',
                radius: 7,
                strokeWidth: 4
              },
        // anchor:[ "Perimeter", { shape:"Square" } ],
        hoverPaintStyle: endpointHoverStyle,
        maxConnections: -1,
        dropOptions: { hoverClass: 'hover', activeClass: 'active' },
        isTarget: true,
        overlays: [['Label', { location: [0.5, -0.5], label: 'Drop', cssClass: 'endpointTargetLabel', visible: false }]]
      }
      // the definition of target endpoints (will appear when the user drags a connection)
      this.targetEndpoint = {
        endpoint: 'Dot',
        paintStyle:
              {
                stroke: '#f5f5f5',
                fill: '#474444',
                radius: 7,
                strokeWidth: 4
              },
        // anchor:[ "Perimeter", { shape:"Square" } ],
        hoverPaintStyle: endpointHoverStyle,
        maxConnections: -1,
        dropOptions: { hoverClass: 'hover', activeClass: 'active' },
        isTarget: true,
        overlays: [['Label', { location: [0.5, -0.5], label: 'Drop', cssClass: 'endpointTargetLabel', visible: false }]]
      }

      this.readerSourceEndpoint = {
        endpoint: 'Dot',
        paintStyle:
              {
                stroke: '#f5f5f5',
                fill: '#474444',
                radius: 7,
                strokeWidth: 4
              },
        // anchor:[ "Perimeter", { shape:"Square" } ],
        isSource: true,
        connector: ['Flowchart', { stub: [0, 0], gap: 10, cornerRadius: 8, alwaysRespectStubs: false }],
        connectorStyle: connectorPaintStyle,
        hoverPaintStyle: endpointHoverStyle,
        maxConnections: -1,
        connectorHoverStyle: connectorHoverStyle,
        dragOptions: {},
        overlays: [['Label', { location: [0.5, 1.5], label: 'Drag', cssClass: 'endpointSourceLabel', visible: false }]]
      }

      this.writerSourceEndpoint = {
        endpoint: 'Dot',
        paintStyle:
              {
                stroke: '#f5f5f5',
                fill: '#474444',
                radius: 7,
                strokeWidth: 4
              },
        // anchor:[ 'Perimeter', { shape:'Square' } ],
        isSource: true,
        connector: ['Flowchart', { stub: [0, 0], gap: 10, cornerRadius: 8, alwaysRespectStubs: false }], // 'StateMachine'
        connectorStyle: connectorPaintStyle,
        hoverPaintStyle: endpointHoverStyle,
        maxConnections: -1,
        connectorHoverStyle: connectorHoverStyle,
        dragOptions: {},
        overlays: [['Label', { location: [0.5, 1.5], label: 'Drag', cssClass: 'endpointSourceLabel', visible: false }]]
      }

      this.plumbInst.batch(() => {
        // create a window for each processor
        const screenHeight = window.innerHeight
        let col = 0

        if (this.request.processors) {
          for (let i = 0; i < this.request.processors.length; i++) {
            const payload = this.request.processors[i]

            let top = 200 + (130 * i) - ((screenHeight - 320) * col)

            if (top > screenHeight - 160) {
              col += 1
              top = 200 + (130 * i) - ((screenHeight - 320) * col)
            }

            let left = 400 + (350 * col)

            if (Object.prototype.hasOwnProperty.call(payload, 'x') && payload.x > 200) left = payload.x
            if (Object.prototype.hasOwnProperty.call(payload, 'y') && payload.y > 100) top = payload.y

            // add the processor to the diagram at the selected location, using source/target endpoint styles
            this.addProcessorToDiagram(payload, top, left)
          }

          if (this.plumbInst) {
            // Connect any related windows
            // need to add handling for processors with multiple input sources (leftTop, leftBottom)
            for (const processor of this.request.processors) {
              for (const key in processor.inputNodes) {
                if (Object.prototype.hasOwnProperty.call(processor.inputNodes, key)) {
                  const inputNodes = processor.inputNodes[key]
                  for (const node in inputNodes) {
                    const inputNode = inputNodes[node]

                    this.plumbInst.connect({
                      uuids: ['Window' + inputNode.name + 'Source_' + inputNode.node, 'Window' + processor.name + 'Target_' + key]
                    })

                    this.plumbInst.repaint('flowchartWindow' + inputNode.name)
                    this.plumbInst.repaint('flowchartWindow' + processor.name)
                  }
                }
              }
            }

            // listen for new connections; initialise them the same way we initialise the connections at startup.
            // this.plumbInst.bind('connection', function (connInfo, originalEvent) {
            //    // Here you can adjust labels, etc. Currently not done
            // })

            // make all the window divs draggable
            // or see below to lock to a canvas

            this.plumbInst.setDraggable(document.querySelectorAll('.flowchart-area .window').item(0) as HTMLElement, true)

            // adjust the processors x/y locations for redrawing after save/load
            /* .draggable(document.querySelectorAll('.flowchart-area .window'), { // should probably define a specific class for these, in case of any issues...
              grid: [5, 5],
              // containment: true
              stop: function (event: { el: { id: string } }, ui: any) {
                const name = event.el.id.replace('flowchartWindow', '')

                for (const processor of this.request.processors) {
                  if (processor.name === name) {
                    // processor.x = $('#' + event.el.id).css('left').replace('px', '');
                    // processor.y = $('#' + event.el.id).css('top').replace('px', '');
                    break
                  }
                }
              }
            }) */

            this.plumbInst.bind('connection', (info: { sourceId: string; targetId: string; sourceEndpoint: { _jsPlumb: { uuid: string } }; targetEndpoint: { _jsPlumb: { uuid: string } } }) => {
              if (info.sourceId.includes('flowchartWindow') && info.targetId.includes('flowchartWindow')) {
                const sourceId = info.sourceId.replace('flowchartWindow', '')
                const targetId = info.targetId.replace('flowchartWindow', '')

                const sourceNode = info.sourceEndpoint._jsPlumb.uuid.replace('Window' + sourceId + 'Source_', '')
                const targetNode = info.targetEndpoint._jsPlumb.uuid.replace('Window' + targetId + 'Target_', '')

                for (const processor of this.request.processors) {
                  if (processor.name === targetId) {
                    for (const key in processor.inputNodes) {
                      if (Object.prototype.hasOwnProperty.call(processor.inputNodes, key)) {
                        let inputNodes = processor.inputNodes[targetNode]
                        if (!inputNodes) inputNodes = []

                        // only link source node to this nodes set of inputs if
                        // there is no circular path back. Does source node depend on the input?
                        // go through the source nodes tree. If at any point the it hits, cancel this
                        const isCircular = this.testCircularLinks(sourceId, targetId)

                        if (!isCircular) {
                          inputNodes.push({ name: sourceId, node: sourceNode })
                        } else {
                          this.refreshDiagram()
                        }

                        break
                      }
                    }
                  }
                }
              }
            })

            this.plumbInst.bind('connectionDetached', (info: { sourceId: string; targetId: string; sourceEndpoint: { _jsPlumb: { uuid: string } }; targetEndpoint: { _jsPlumb: { uuid: string } } }) => {
              if (info.sourceId.includes('flowchartWindow') && info.targetId.includes('flowchartWindow')) {
                const sourceId = info.sourceId.replace('flowchartWindow', '')
                const targetId = info.targetId.replace('flowchartWindow', '')

                // const sourceNode = info.sourceEndpoint._jsPlumb.uuid.replace('Window' + sourceId + 'Source_', '')
                // const targetNode = info.targetEndpoint._jsPlumb.uuid.replace('Window' + targetId + 'Target_', '')

                for (const processor of this.request.processors) {
                  if (processor.name === targetId) {
                    for (const key in processor.inputNodes) {
                      if (Object.prototype.hasOwnProperty.call(processor.inputNodes, key)) {
                        const inputNodes = processor.inputNodes[key]
                        for (const nodeInd in inputNodes) {
                          const node = inputNodes[nodeInd]
                          if (node.name === sourceId) {
                            const index = inputNodes.indexOf(node)
                            if (index > -1) {
                              inputNodes.splice(index, 1)
                            }
                            break
                          }
                        }
                      }
                    }
                  }
                }
              }
            })
          }
        }
      }, false)
      // finally...
      this.plumbInst.fire('jsPlumbDemoLoaded', this.plumbInst)
    })
  }

  testCircularLinks (sourceId: string, targetId: string): boolean {
    return false
  }

  refreshDiagram () {
    if (this.plumbInst) {
      this.plumbInst.repaintEverything()
    }
  }

  addProcessorToDiagram (processor: any, top: number, left: number) {
    if (this.plumbInst) {
      // this.sourceEndpoint, this.targetEndpoint
      let procType = ''
      const result = processor.type.replace(/([A-Z])/g, ' $1')
      const title = result.charAt(0).toUpperCase() + result.slice(1)

      if (title.toLowerCase().includes('writer')) procType = 'writer'
      else if (title.toLowerCase().includes('reader')) procType = 'reader'
      else procType = 'processor'

      this.getProcessorPanel(processor, top, left, 'canvas')

      // technically, we don't need any of this logic. Just replace the hard coded node definitions
      // with some math to adjust node placement on the left or right according to how many nodes we have.

      if (procType === 'writer') {
        // should writers have an output port?
        // plumbInst.addEndpoint("flowchartWindow" + processor.name, writerSourceEP, { anchor: "RightMiddle", uuid: "Window" + processor.name + "RightMiddle" });
        this.plumbInst.addEndpoint('flowchartWindow' + processor.name, this.targetEndpoint, { anchor: 'LeftMiddle', uuid: 'Window' + processor.name + 'Target_features' })
      } else if (procType === 'reader') {
        this.plumbInst.addEndpoint('flowchartWindow' + processor.name, this.sourceEndpoint, { anchor: 'RightMiddle', uuid: 'Window' + processor.name + 'Source_features' })
      } else {
        const outputNodeKeys = []
        const inputNodeKeys = []
        for (const key in processor.outputNodes) {
          outputNodeKeys.push(key)
        }

        for (const key in processor.inputNodes) {
          inputNodeKeys.push(key)
        }

        if (outputNodeKeys.length === 3) {
          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, this.sourceEndpoint, { anchor: [0, 0.25, -1, -1], uuid: 'Window' + processor.name + 'Source_' + outputNodeKeys[0] })
          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, this.sourceEndpoint, { anchor: 'RightMiddle', uuid: 'Window' + processor.name + 'Source_' + outputNodeKeys[1] })
          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, this.sourceEndpoint, { anchor: [0, 0.75, -1, -1], uuid: 'Window' + processor.name + 'Source_' + outputNodeKeys[2] })
        } else if (outputNodeKeys.length === 2) {
          const ep1 = JSON.parse(JSON.stringify(this.sourceEndpoint))
          const ep2 = JSON.parse(JSON.stringify(this.sourceEndpoint))

          ep1.overlays[0][1].label = outputNodeKeys[0]
          ep1.overlays[0][1].visible = true

          ep2.overlays[0][1].label = outputNodeKeys[1]
          ep2.overlays[0][1].visible = true

          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, ep1, { anchor: [1, 0.55, 0, 0], uuid: 'Window' + processor.name + 'Source_' + outputNodeKeys[0] })
          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, ep2, { anchor: [1, 0.75, 0, 0], uuid: 'Window' + processor.name + 'Source_' + outputNodeKeys[1] })
        } else if (outputNodeKeys.length === 1) {
          const ep1 = JSON.parse(JSON.stringify(this.sourceEndpoint))

          ep1.overlays[0][1].label = outputNodeKeys[0]
          ep1.overlays[0][1].visible = true

          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, ep1, { anchor: [1, 0.65, 0, 0], uuid: 'Window' + processor.name + 'Source_' + outputNodeKeys[0] })
        }

        if (inputNodeKeys.length === 3) {
          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, this.targetEndpoint, { anchor: [0, 0.25, 0, 0], uuid: 'Window' + processor.name + 'Target_' + inputNodeKeys[0] })
          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, this.targetEndpoint, { anchor: 'LeftMiddle', uuid: 'Window' + processor.name + 'Target_' + inputNodeKeys[1] })
          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, this.targetEndpoint, { anchor: [0, 0.75, 0, 0], uuid: 'Window' + processor.name + 'Target_' + inputNodeKeys[2] })
        } else if (inputNodeKeys.length === 2) {
          const ep1 = JSON.parse(JSON.stringify(this.targetEndpoint))
          const ep2 = JSON.parse(JSON.stringify(this.targetEndpoint))

          ep1.overlays[0][1].label = inputNodeKeys[0]
          ep1.overlays[0][1].visible = true

          ep2.overlays[0][1].label = inputNodeKeys[1]
          ep2.overlays[0][1].visible = true

          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, ep1, { anchor: [0, 0.55, 0, 0], uuid: 'Window' + processor.name + 'Target_' + inputNodeKeys[0] })
          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, ep2, { anchor: [0, 0.75, 0, 0], uuid: 'Window' + processor.name + 'Target_' + inputNodeKeys[1] })
        } else if (inputNodeKeys.length === 1) {
          const ep1 = JSON.parse(JSON.stringify(this.targetEndpoint))

          ep1.overlays[0][1].label = inputNodeKeys[0]
          ep1.overlays[0][1].visible = true

          this.plumbInst.addEndpoint('flowchartWindow' + processor.name, ep1, { anchor: [0, 0.65, 0, 0], uuid: 'Window' + processor.name + 'Target_' + inputNodeKeys[0] })
        }
      }
    }
  }

  getProcessorPanel (processor: any, top: number, left: number, div: string) {
    // wrapper
    const result = processor.type.replace(/([A-Z])/g, ' $1')
    const title = result.charAt(0).toUpperCase() + result.slice(1)
    let procType = ''

    if (title.toLowerCase().includes('writer')) procType = 'writer'
    else if (title.toLowerCase().includes('reader')) procType = 'reader'
    else procType = 'processor'

    const outputs = Object.keys(processor.outputNodes).length
    const inputs = Object.keys(processor.inputNodes).length

    const panelHeight = outputs > 1 || inputs > 1 ? 110 : 90
    const titleHeight = outputs > 1 || inputs > 1 ? 40 : 20

    let processorHtml = "<div ondblclick=\"editNode('" + processor.name + "');\" class=\"window jtk-node\" id=\"flowchartWindow" + processor.name + '" style="width: 250px; position: absolute; left: ' + left + 'px; top: ' + top + 'px;">'
    processorHtml += '<div class="card ' + procType + ' z-depth-0" style="border: 1px solid #e0e0e0;">'
    processorHtml += "<div class='card-image' style='height: " + panelHeight + "px;'>"
    processorHtml += "<span class=\"card-title\" style='bottom: " + titleHeight + "px;'>" + processor.name + " | <span style='font-size: 16px; font-style: italic;'>" + title + '</span></span>'
    processorHtml += '</div></div></div>'

    const newDiv = document.createElement('div')
    newDiv.innerHTML = processorHtml.trim()

    const child = newDiv.firstChild as ChildNode
    const root = document.getElementById(div) || undefined

    if (root && child && this.plumbInst) {
      root.appendChild(child)
      this.plumbInst.setDraggable(document.getElementById(`flowchartWindow${processor.name}`)!, true)
    }
  }

  clearDiagram () {
    this.request = new VtsRequest({})
    const node = document.getElementById('canvas')

    if (node && this.plumbInst) {
      node.querySelectorAll('*').forEach(n => {
        if (this.plumbInst) this.plumbInst.remove(n)
        n.remove() // should be removed by the above line, but just in case
      })
      this.plumbInst.repaintEverything()
    }
  }

  addTool (tool: any) {
    // empty
  }
}
</script>
<style>
.toolbar {
    max-height: 50px;
    height: 50px;
    overflow-y: hidden;
    overflow-x: auto;
    width: 100%;
    padding: 10px;
}

.toolbar a {
    transition: all 0.5s ease;
    color: black;
    font-size: 24px;
}

.toolbar a:hover {
    border: 1px solid black;
    background-color: lightgray;
    color: black;
    font-size: 24px;
}

.toolbar::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    background-color: #232f34;
}

.toolbar::-webkit-scrollbar {
    width: 10px;
    background-color: #232f34;
}

.toolbar::-webkit-scrollbar-thumb {
    background-color: #4A6572;
    border: 2px solid #232f34;
}

.designer-canvas {
    background-color: #4A6572;
    overflow: auto;
}

.designer-canvas::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    background-color: #232f34;
}

.designer-canvas::-webkit-scrollbar {
    width: 10px;
    background-color: #232f34;
}

.designer-canvas::-webkit-scrollbar-thumb {
    background-color: #4A6572;
    border: 2px solid #232f34;
}

.reader {
    background: #004d40;
    color: white;
}

.processor {
    background: #f57f17;
    color: black;
}

.writer {
    background: #b71c1c;
    color: white;
}

.node-editor {
    z-index: 100;
    float: right !important;
    position: absolute;
    right: 10px !important;
    top: 175px;
    border-radius: 3px;
    padding-left: 12px;
    padding-right: 12px;
}

#nodeEditorContent {
    overflow-x: hidden;
    overflow-y: auto;
}

#nodeEditorContent::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    background-color: #232f34;
}

#nodeEditorContent::-webkit-scrollbar {
    width: 10px;
    background-color: #232f34;
}

#nodeEditorContent::-webkit-scrollbar-thumb {
    background-color: #4A6572;
    border: 2px solid #232f34;
}

.request-item {
    border-bottom: solid 1px #344955;
    padding-top: 5px;
    background: #25353b;
    cursor: pointer;
}

.tool-menu {
    overflow: auto; height: 100%
}

.tool-menu li {
    transition: all 0.5s ease;
    border-bottom: 1px solid rgb(74, 101, 114);
    cursor: pointer;
    text-transform: capitalize;
}

.tool-menu li:hover {
    border-bottom: 1px solid rgb(74, 101, 114);
    cursor: pointer;
    text-transform: capitalize;
    background: #F9AA33 !important;
    color: black !important;
}

.tool-menu::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    background-color: #232f34;
}

.tool-menu::-webkit-scrollbar {
    width: 10px;
    background-color: #232f34;
}

.tool-menu::-webkit-scrollbar-thumb {
    background-color: #4A6572;
    border: 2px solid #232f34;
}

.menubar {
    height: 40px;
    border-top: 1px solid #e0e0e02b;
}

.menubar a {
    transition: all 0.5s ease;
    margin-top: 2px;
    color: white !important;
}

.menubar a:hover {
    background: #F9AA33 !important;
    margin-top: 2px;
    color: black !important;
}

.designerLabel {
    margin-top: -10px;
    color: black;
}

.endpointSourceLabel {
    margin-left: -40px;
    margin-top: -23px;
    font-size: 16px;
    font-style: italic;
    font-weight: 100;
    text-align: right;
}

.endpointTargetLabel {
    margin-left: 40px;
    margin-top: 20px;
    font-size: 16px;
    font-style: italic;
    font-weight: 100;
    text-align: right;
}

/* designer */

.creatorContainer {
    /* for IE10+ touch devices */
    touch-action:none;
    height: calc(100vh - 205px);
}

.flowchart-area {
    height: calc(100vh - 205px);
}

.flowchart-area .window .card {
    margin: 0px;
}

.flowchart-area .window:hover {
    box-shadow: 2px 2px 19px #444;
    -o-box-shadow: 2px 2px 19px #444;
    -webkit-box-shadow: 2px 2px 19px #444;
    -moz-box-shadow: 2px 2px 19px #444;
}

.flowchart-area .active {
    border: 1px dotted green;
}

.flowchart-area .hover {
    border: 1px dotted red;
}

.flowchart-area .jtk-connector {
    z-index: 4;
}

.flowchart-area .jtk-endpoint, .endpointTargetLabel, .endpointSourceLabel {
    z-index: 21;
    cursor: pointer;
}

.flowchart-area .aLabel {
    background-color: white;
    padding: 0.4em;
    font: 12px sans-serif;
    color: #444;
    z-index: 21;
    border: 1px dotted gray;
    opacity: 0.8;
    cursor: pointer;
}

.flowchart-area .aLabel.jtk-hover {
    background-color: #5C96BC;
    color: white;
    border: 1px solid white;
}

.window.jtk-connected {
    border: 1px solid green;
}

.jtk-drag {
    outline: 4px solid rgb(255, 166, 0) !important;
}

path, .jtk-endpoint {
    cursor: pointer;
}

.jtk-overlay {
    background-color:transparent;
}

.card-title {
  font-size: 16px;
  font-weight: 300;
  color: #fff;
  position: absolute;
  bottom: 0;
  left: 0;
  max-width: 100%;
  padding: 24px;
}
</style>
