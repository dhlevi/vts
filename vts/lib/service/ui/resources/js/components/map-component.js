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
                    request.open('GET', engineUrl + '/Requests/' + app.request.name + '/Features/' + processor.name, false);
                    request.send(null);

                    if (request.status === 200) 
                    {
                        let json = JSON.parse(request.responseText);
                        let arcgisJson = Terraformer.ArcGIS.convert(json);

                        let graphics = [];
                        let geometryType;
                        arcgisJson.forEach((graphic, index) =>
                        {
                            graphic.attributes.ObjectID = index;
                            if (graphic.geometry.hasOwnProperty('paths')) 
                            {
                                graphic.geometry.type = 'polyline';
                                geometryType = 'polyline';
                            }
                            else if (graphic.geometry.hasOwnProperty('rings')) 
                            {
                                graphic.geometry.type = 'polygon';
                                geometryType = 'polygon';
                            }
                            else
                            {
                                graphic.geometry.type = 'point';
                                geometryType = 'point';
                            }

                            graphics.push(new Graphic(graphic));
                        });

                        layers.push(new FeatureLayer(
                        {
                            title: processor.name + '|' + processor.type,
                            source: graphics,
                            copyright: 'Government of British Columbia',
                            visible: true,
                            geometryType: geometryType,
                            objectIdField: 'ObjectID'
                        }));
                    }
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

            /*let layerListBase = new LayerList(
            {
                view: view,
                listItemCreatedFunction: createActions
            });

            let layerList = new Expand(
            {
                view: view,
                content: layerListBase
            });*/

            // bottom left
            // view.ui.add(ccWidget, "bottom-left");
            //top right
            view.ui.add(bgExpand,  "top-right");
            //view.ui.add(layerList,  "top-right");
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