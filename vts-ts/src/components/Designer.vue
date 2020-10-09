<template>
  <v-row style="margin-top: 115px;">
    <div id="canvas"></div>
  </v-row>
</template>
<script lang="ts">
import AuthenticatedUser from '@/model/authenticated-user'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import * as jsPlumb from '@jsplumb/community'
import { BrowserJsPlumbInstance } from '@jsplumb/community'

@Component
export default class Designer extends Vue {
  @Prop()
  readonly user!: AuthenticatedUser

  public plumbInst: BrowserJsPlumbInstance|null = null
  mounted () {
    this.plumbInst = jsPlumb.newInstance({
      // default drag options
      dragOptions: { cursor: 'pointer', zIndex: 2000 },
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

    console.log(this.plumbInst)

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
    const sourceEndpoint = {
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
    const writerTargetEndpoint = {
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
    const targetEndpoint = {
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

    const readerSourceEndpoint = {
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

    const writerSourceEndpoint = {
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

    this.plumbInst.repaintEverything()
  }
}
</script>
<style>
</style>
