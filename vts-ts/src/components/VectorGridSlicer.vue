<template>
  <div />
</template>

<script>
import L from 'leaflet'
import 'leaflet.vectorgrid'

export default {
  props: {
    json: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: function () {
        return {}
      }
    }
  },
  watch: {
    json () {
      this.updateLayer()
    },
    options () {
      this.updateLayer()
    }
  },
  mounted () {
    this.mapObject = L.vectorGrid.slicer(this.json, this.options)

    if (this.options && this.options.interactive) {
      L.DomEvent.on(this.mapObject, this.$listeners)
    }

    if (this.$parent._isMounted) {
      this.deferredMountedTo(this.$parent.mapObject)
    }
  },
  beforeDestroy () {
    this.removeLayer()
  },
  methods: {
    getDataLayerNames () {
      return this.mapObject.getDataLayerNames()
    },
    setFeatureStyle (key, style) {
      this.mapObject.setFeatureStyle(key, style)
    },
    deferredMountedTo (parent) {
      this.mapObject.addTo(parent)
      this.attributionControl = parent.attributionControl

      for (let i = 0; i < this.$children.length; i++) {
        if (typeof this.$children[i].deferredMountedTo === 'function') {
          this.$children[i].deferredMountedTo(this.mapObject)
        }
      }
    },
    setAttribution (val, old) {
      this.attributionControl.removeAttribution(old)
      this.attributionControl.addAttribution(val)
    },
    removeLayer () {
      this.$parent.mapObject.removeLayer(this.mapObject)
    },
    updateLayer () {
      this.removeLayer()
      this.mapObject = L.vectorGrid.slicer(this.json, this.options)

      if (this.options && this.options.interactive) {
        L.DomEvent.on(this.mapObject, this.$listeners)
      }

      this.deferredMountedTo(this.$parent.mapObject)
    }
  }
}
</script>
