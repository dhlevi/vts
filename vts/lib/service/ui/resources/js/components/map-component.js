Vue.component('map-viewer',
{
    props: ['request'],
    created: function () 
    {
        esriLoader.loadModules(
        [
            "esri/Map",
            "esri/views/MapView",
            "esri/views/SceneView",
            "esri/WebMap",
            "esri/widgets/Expand",
            "esri/widgets/Legend",
            "esri/layers/FeatureLayer",
            "esri/Graphic",
            "esri/widgets/BasemapGallery",
            "esri/widgets/CoordinateConversion",
            "esri/widgets/Bookmarks",
            "esri/widgets/DirectLineMeasurement3D",
            "esri/widgets/AreaMeasurement3D",
            "esri/widgets/Locate",
            "esri/widgets/LayerList",
            "esri/widgets/Print",
            "esri/layers/WMSLayer",
            "esri/layers/GeoJSONLayer",
            "esri/geometry/geometryEngine",
            "esri/geometry/Point",
            "esri/layers/support/LabelClass",
            "esri/layers/WebTileLayer",
            "esri/widgets/Home"
        ])
        .then(function ([
            Map, 
            MapView, 
            SceneView,
            WebMap,
            Expand,
            Legend,
            FeatureLayer,
            Graphic,
            BasemapGallery,
            CoordinateConversion,
            Bookmarks,
            DirectLineMeasurement3D,
            AreaMeasurement3D,
            Locate,
            LayerList,
            Print,
            WMSLayer,
            GeoJSONLayer,
            geometryEngine,
            Point,
            LabelClass,
            WebTileLayer,
            Home
        ]) 
        {
            // create layers
            let layers = [];
            app.request.processors.forEach(processor =>
            {
                let engineUrl;
                for (let idx in app.engines)
                {
                    let engine = app.engines[idx];
                    if (engine.id === app.request.engine)
                    {
                        engineUrl = engine.route;
                        break;
                    }
                }

                if (engineUrl)
                {
                    let request = new XMLHttpRequest();

                    Object.keys(processor.outputNodes).forEach(node =>
                    {
                        request.open('GET', engineUrl + '/Requests/' + app.request.name + '/Features/' + processor.name + '/' + node, false);
                        request.send(null);
    
                        if (request.status === 200) 
                        {
                            let json = JSON.parse(request.responseText);
    
                            // strip out any null features
                            json.features = json.features.filter(function (el) 
                            {
                                return el != null;
                            });
    
                            // this will probably break if a collection has multiple feature types
                            let arcgisJson = Terraformer.ArcGIS.convert(json);
    
                            let graphics = [];
                            let geometryType;
                            arcgisJson.forEach((graphic, index) =>
                            {
                                // handle multifeature geoms
                                let graphicArray = [];
                                if (!Array.isArray(graphic))
                                {
                                    graphicArray.push(graphic);
                                }
                                else 
                                {
                                    graphicArray = graphic;
                                }
    
                                graphicArray.forEach(subGraphic =>
                                {
                                    subGraphic.attributes.ObjectID = index;
                                    if (subGraphic.geometry.hasOwnProperty('paths')) 
                                    {
                                        subGraphic.geometry.type = 'polyline';
                                        geometryType = 'polyline';
                                    }
                                    else if (subGraphic.geometry.hasOwnProperty('rings')) 
                                    {
                                        subGraphic.geometry.type = 'polygon';
                                        geometryType = 'polygon';
                                    }
                                    else
                                    {
                                        subGraphic.geometry.type = 'point';
                                        geometryType = 'point';
                                    }
        
                                    graphics.push(new Graphic(subGraphic));
                                });
                            });
    
                            let r = Math.floor(Math.random() * Math.floor(256));
                            let g = Math.floor(Math.random() * Math.floor(256));
                            let b = Math.floor(Math.random() * Math.floor(256));
    
                            var renderer = geometryType === 'point' ?
                            {
                                  type: "simple",
                                  symbol:
                                  {
                                    type: "simple-marker",
                                    size: 6,
                                    color: [r, g, b, 0.45],
                                    outline: { cap: "round", join: "round", width: 1, color: [60, 60, 60, 0.65] }
                                  }
                            } 
                            : geometryType === 'polygon' ?
                            {
                                type: "simple",
                                symbol:
                                {
                                  type: "simple-fill",
                                  style: "solid", //diagonal-cross
                                  outline: {
                                    color: [r, g, b, 1]
                                  },
                                  color: [r, g, b, 0.25]
                                }
                            } 
                            :
                            {
                                type: "simple",
                                symbol:
                                {
                                    type: "simple-line",
                                    color: [r, g, b, 0.35],
                                    width: "1px",
                                    style: "solid"
                                }
                            };
    
                            let popup = 
                            {
                                title: processor.name + ' | ' + processor.type + ' - ' + node,
                                content:
                                [
                                    {
                                        type: "text",
                                        text: "A cached geometry from a VTS process"
                                    },
                                    {
                                        type: "fields",
                                        fieldInfos: [ ]
                                    }
                                ]
                            };
    
                            let fields = [];
                            Object.keys(graphics[0].attributes).forEach(attribute =>
                            {
                                let result = attribute.replace( /([A-Z])/g, " $1" );
                                let title = result.charAt(0).toUpperCase() + result.slice(1);
    
                                popup.content[1].fieldInfos.push(
                                {
                                    fieldName: attribute,
                                    visible: true,
                                    label: title
                                });
    
                                fields.push(
                                {
                                    name: attribute,
                                    alias: title,
                                    type: name.toLowerCase() === 'objectid' ? 'oid' : 'string'
                                });
                            });
                            
                            layers.push(new FeatureLayer(
                            {
                                title: processor.name + ' | ' + processor.type + ' - ' + node,
                                source: graphics,
                                copyright: 'Government of British Columbia',
                                visible: true,
                                geometryType: geometryType,
                                objectIdField: 'ObjectID',
                                renderer: renderer,
                                popupTemplate: popup,
                                fields: fields,
                                outFields: ["*"]
                            }));
                        }
                    });
                }
            });

            const map = new Map(
            {
                basemap: "streets",
                //basemap: "hybrid",
                //ground: "world-elevation",
                layers: layers
            });
            
            const viewOptions = 
            {
                container: "viewDiv",
                map: map,
                center: [-101.17, 21.78],
                zoom: 2
            };

            // 2D:
            let view = new MapView(viewOptions);
            
            // 3D:
            // let view = new SceneView(viewOptions);

            let legend = new Expand(
            {
                content: new Legend(
                {
                    view: view,
                    style: 'classic'
                }),
                view: view,
                expand: true
            });

            let bgExpand = new Expand(
            {
                view: view,
                content: new BasemapGallery(
                {
                    view: view,
                    container: document.createElement("div")
                })
            });

            let ccWidget = new CoordinateConversion(
            {
                view: view
            });

            let dlmExpand = new Expand(
            {
                view: view,
                content: new DirectLineMeasurement3D(
                {
                    view: view
                })
            });

            let amExpand = new Expand(
            {
                view: view,
                content: new AreaMeasurement3D(
                {
                    view: view
                })
            });

            let layerListBase = new LayerList(
            {
                view: view,
                listItemCreatedFunction: function() 
                {
                }
            });

            layerListBase.on("trigger-action", function(event)
            {
                let actionId = event.action.id;
                let layer = event.item.layer;

                return layer.queryExtent().then(function(response) { view.goTo(response.extent); });
            });

            let layerList = new Expand(
            {
                view: view,
                content: layerListBase
            });

            // bottom left
            // view.ui.add(ccWidget, "bottom-left");
            //top right
            view.ui.add(bgExpand,  "top-right");
            view.ui.add(layerList,  "top-right");
            view.ui.add(dlmExpand, "top-right");
            view.ui.add(amExpand, "top-right");
            // bottom right
            view.ui.add(legend, "bottom-right");
        });
    },
    updated: function () 
    {
        this.$nextTick(function () 
        {
        });
    },
    template:   
    `
    <div>
        <div id='viewDiv' style="height: calc(100vh - 66px); width: 100vw;">
        </div>
    </div>
    `
});