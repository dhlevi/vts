function clearDiagram()
{
    app.request = 
    {
        priority: 3,
        name: 'New Request',
        public: true,
        processors: [],
        status: 'Submitted',
        scheduledTask: false,
        interval: 0,
        intervalUnit: 'Minutes',
        messages: [],
        tags: [],
        cachePurged: false,
        engine: ''
    };

    refreshDiagram();
}

function refreshDiagram()
{
    $("#canvas").empty();

	jsPlumb.empty("canvas");
	jsPlumb.revalidate("canvas");
	jsPlumb.reset();
    
    setupCanvas();

    $('#node_editor').hide();
}
function addNode(node, x, y)
{
    let processor = 
    {
        type: node, 
        processed: false,
        name: '', 
        x: x ? x : 0, 
        y: y ? y : 0,
        messages: [],
        inputNodes: { features: [] },
        outputNodes: { features: [] },
        attributes: {}
    };

    switch(node)
    {
        case 'httpReader':
            processor.attributes.url = '';
            processor.attributes.dataType = 'json'; // json, shape, fgdb, csv, kml, kmz, wkt, gml
            processor.attributes.sourceProjection = '';
        break;
        case 'fileReader':
            processor.attributes.path = '';
            processor.attributes.dataType = 'json'; // json, shape, fgdb, csv, kml, kmz, wkt, gml
            processor.attributes.sourceProjection = '';
        break;
        case 'dbReader':
            processor.attributes.connection = '';
            processor.attributes.source = 'oracle'; // oracle, postgres, mongo, couch, h2, mysql
            processor.attributes.user = '';
            processor.attributes.password = '';
            processor.attributes.query = ''; // select statement used to get results
            processor.attributes.sourceProjection = '';
        break;
        case 'randomReader':
            processor.attributes.featureType = 'polygon'; // point, line, polygon
            processor.attributes.items = 1;
        break;
        case 'projector':
            processor.attributes.sourceProjection = '';
            processor.attributes.newProjection = '';
        break;
        case 'buffer':
            processor.attributes.distance = 0;
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
        break;
        case 'hullCreator':
            processor.attributes.isConvex = true;
        break;
        case 'difference':
            processor.inputNodes['clipper'] = [];
        break;
        case 'intersect':
            processor.inputNodes['intersector'] = [];
        break;
        case 'simplify':
            processor.attributes.tolerance = 1;
            processor.attributes.highQuality = false;
        break;
        case 'voronoi':
            processor.attributes.bbox = '-180,-85,180,-85';
        break;
        case 'scale':
            processor.attributes.factor = 1;
            processor.attributes.location = 'centroid'; // sw/se/nw/ne/center/centroid
        break;
        case 'rotate':
            processor.attributes.angle = 0;
            processor.attributes.pivot = 'centroid'; // sw/se/nw/ne/center/centroid
        break;
        case 'translate':
            processor.attributes.distance = 0;
            processor.attributes.direction = 0;
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
        break;
        case 'reducePrecision':
            processor.attributes.precision = 6;
        break;
        case 'bezierCurve':
            processor.attributes.resolution = 10000;
            processor.attributes.sharpness = 0.85;
            processor.outputNodes['curves'] = [];
        break;
        case 'lineChunk':
            processor.attributes.length = 0;
            processor.attributes.reverse = false;
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
        break;
        case 'along':
            processor.attributes.length = 0;
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
            processor.outputNodes['points'] = [];
        break;
        case 'area':
            processor.attributes.fieldName = 'AREA_SQ_M';
        break;
        case 'counter':
            processor.attributes.fieldName = 'COUNT';
        break;
        case 'donutExtractor':
            processor.outputNodes['donuts'] = [];
        break;
        case 'destination':
            processor.attributes.dstance = 0;
            processor.attributes.bearing = 0;
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
            processor.outputNodes['destinations'] = [];
        break;
        case 'length':
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
            processor.attributes.fieldName = 'LENGTH';
        break;
        case 'attributeCreator':
            processor.attributes.fieldName = 'NAME';
            processor.attributes.defaultValue = '';
            processor.attributes.type = 'string'; //string, number, date, boolean
        break;
        case 'attributeRemover':
            processor.attributes.fieldName = 'NAME';
        break;
        case 'attributeRenamer':
            processor.attributes.fromName = 'NAME';
            processor.attributes.toName = 'NEW_NAME';
        break;
        case 'attributeCalculator':
            processor.attributes.calculation = 'NAME + NAME2';
            processor.attributes.fieldName = 'CALC';
        break;
        case 'timestamper':
            processor.attributes.fieldName = 'TIMESTAMP';
        break;
        case 'filter':
            processor.attributes.query = 'NAME === "Test"';
            processor.outputNodes['false'] = [];
        break;
        case 'spatialFilter':
            processor.attributes.type = 'Polygon'; // point, line, poly, multi's
            processor.outputNodes['false'] = [];
        break;
        case 'spatialRelationFilter':
            processor.attributes.relationType = 'crosses'; // within, contains, crosses, touches
            processor.inputNodes['relator'] = [];
            processor.outputNodes['false'] = [];
        break;
        case 'fileWriter':
            processor.attributes.path = '';
            processor.attributes.dataType = 'json'; // json, shape, fgdb, csv, kml, kmz, wkt, gml
            processor.attributes.projection = '';
        break;
        case 'httpWriter':
            processor.attributes.url = '';
            processor.attributes.dataType = 'json'; // json, shape, fgdb, csv, kml, kmz, wkt, gml
            processor.attributes.upsert = false; // upsert means we'll put for existig, insert for new. If false, always post
        break;
        case 'dbWriter':
            processor.attributes.connection = '';
            processor.attributes.source = 'oracle'; // oracle, postgres, mongo, couch, h2, mysql
            processor.attributes.user = '';
            processor.attributes.password = '';
            processor.attributes.destinationTable = '';
            processor.attributes.upsert = false;
        break;
    }

    //need to set a name
	let uniqueId = false;
	let name = Math.floor(Math.random() * 1000) + 1;
	while(!uniqueId && app.request.processors.length > 0)
	{
		for (let x in app.request.processors)
		{
			if(app.request.processors[x].name == name)
			{
				uniqueId = false;
				break;
			}
			else uniqueId = true;
		}
		name = Math.floor(Math.random() * 1000) + 1;
	}

	processor.name = '' + name;

    app.request.processors.push(processor);

    refreshDiagram();
}

function deleteSelectedNode(processorName)
{
    for (let idx in app.request.processors)
    {
        let processor = app.request.processors[idx];
        if (processor.name === processorName)
        {
            app.request.processors.splice(idx, 1);
            break;
        }
    }

    refreshDiagram();
}

let plumbInst;
function setupCanvas()
{
    refresh = false;

    jsPlumb.ready(function() 
    {
        plumbInst = window.jsp = jsPlumb.getInstance(
        {
            // default drag options
            DragOptions: { cursor: 'pointer', zIndex: 2000 },
            // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
            // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
            ConnectionOverlays:
            [
                [ 'Arrow', {
                    location: 1,
                    visible:  true,
                    width:    11,
                    length:   11,
                    id:       'ARROW',
                    events:{
                        click:function() { /* Some function to run when an overlay is clicked on */ }
                    }
                }],
                [ 'Label', {
                    location: 0.5,
                    id:       'label',
                    cssClass: 'designerLabel',
                    events:{
                        tap:function() { /* Some function to run when a label is clicked on */ }
                    }
                }]
            ],
            Container: 'canvas'
        });

        let basicType =
        {
            connector:       'StateMachine',
            paintStyle:      { stroke: 'red', strokeWidth: 4 },
            hoverPaintStyle: { stroke: 'blue' },
            overlays:        [ 'Arrow' ]
        };

        plumbInst.registerConnectionType('basic', basicType);

        // this is the paint style for the connecting lines..
        let connectorPaintStyle =
        {
            strokeWidth:   2,
            stroke:        'black',
            joinstyle:     'round',
            outlineStroke: '#ffffff21',
            outlineWidth:  1
        },
        // .. and this is the hover style.
        connectorHoverStyle =
        {
            strokeWidth:   3,
            stroke:        '#f44336',
            outlineWidth:  2,
            outlineStroke: '#ffffff21'
        },
        endpointHoverStyle =
        {
            fill:   '#f44336',
            stroke: '#f44336'
        },
        // the definition of source endpoints (the small blue ones)
        sourceEndpoint =
        {
            endpoint: 'Dot',
            paintStyle:
            {
                stroke:      '#f5f5f5',
                fill:        '#474444',
                radius:      7,
                strokeWidth: 4
            },
            isSource:            true,
            connector:           [ 'Flowchart', { stub: [0, 0], gap: 10, cornerRadius: 8, alwaysRespectStubs: false } ],
            connectorStyle:      connectorPaintStyle,
            hoverPaintStyle:     endpointHoverStyle,
            maxConnections:      -1,
            connectorHoverStyle: connectorHoverStyle,
            dragOptions: {},
            // label the nodes... not sure? Only useful for multiple in/out
            overlays: [['Label', { location: [0.5, 1.5], label: 'Drag', cssClass: 'endpointSourceLabel', visible: false }]]
        },
        // the definition of writer endpoints (the small blue ones)
        writerTargetEndpoint =
        {
            endpoint: 'Dot',
            paintStyle:
            {
                stroke:      '#f5f5f5',
                fill:        '#474444',
                radius:      7,
                strokeWidth: 4
            },
            //anchor:[ "Perimeter", { shape:"Square" } ],
            hoverPaintStyle: endpointHoverStyle,
            maxConnections:  -1,
            dropOptions:     { hoverClass: 'hover', activeClass: 'active' },
            isTarget:        true,
            overlays: [[ 'Label', { location: [0.5, -0.5], label: 'Drop', cssClass: 'endpointTargetLabel', visible: false } ]]
        },
        // the definition of target endpoints (will appear when the user drags a connection)
        targetEndpoint =
        {
            endpoint: 'Dot',
            paintStyle:
            {
                stroke:      '#f5f5f5',
                fill:        '#474444',
                radius:      7,
                strokeWidth: 4
            },
            //anchor:[ "Perimeter", { shape:"Square" } ],
            hoverPaintStyle: endpointHoverStyle,
            maxConnections:  -1,
            dropOptions:     { hoverClass: 'hover', activeClass: 'active' },
            isTarget:        true,
            overlays: [[ 'Label', { location: [0.5, -0.5], label: 'Drop', cssClass: 'endpointTargetLabel', visible: false } ]]
        },
        readerSourceEndpoint =
        {
            endpoint: 'Dot',
            paintStyle:
            {
                stroke:      '#f5f5f5',
                fill:        '#474444',
                radius:      7,
                strokeWidth: 4
            },
            //anchor:[ "Perimeter", { shape:"Square" } ],
            isSource:            true,
            connector:           [ 'Flowchart', { stub: [0, 0], gap: 10, cornerRadius: 8, alwaysRespectStubs: false } ],
            connectorStyle:      connectorPaintStyle,
            hoverPaintStyle:     endpointHoverStyle,
            maxConnections:      -1,
            connectorHoverStyle: connectorHoverStyle,
            dragOptions: {},
            overlays: [['Label', { location: [0.5, 1.5], label: 'Drag', cssClass: 'endpointSourceLabel', visible:false }]]
        },
        writerSourceEndpoint =
        {
            endpoint: 'Dot',
            paintStyle:
            {
                stroke:      '#f5f5f5',
                fill:        '#474444',
                radius:      7,
                strokeWidth: 4
            },
            //anchor:[ 'Perimeter', { shape:'Square' } ],
            isSource:            true,
            connector:           [ 'Flowchart', { stub: [0, 0], gap: 10, cornerRadius: 8, alwaysRespectStubs: false } ], //'StateMachine'
            connectorStyle:      connectorPaintStyle,
            hoverPaintStyle:     endpointHoverStyle,
            maxConnections:      -1,
            connectorHoverStyle: connectorHoverStyle,
            dragOptions: {},
            overlays: [['Label', { location: [0.5, 1.5], label: 'Drag', cssClass: 'endpointSourceLabel', visible:false }]]
        },
        init = function (connection)
        {
            // no label atm
           /* let sourceId = connection.sourceId.substring(15);
            let targetId = connection.targetId.substring(15);
            let sourceProcessor;
            let targetProcessor;

            for(let idx in app.request.processors)
            {
                let processor = app.request.processors[idx];
                
                if (processor.name === sourceId && !sourceProcessor)
                {
                    sourceProcessor = processor;
                }
                else if (processor.name === targetId && !targetProcessor)
                {
                    targetProcessor = processor;
                }

                if (sourceProcessor && targetProcessor)
                    break;
            }

            let srcLabel = sourceProcessor.type.replace( /([A-Z])/g, " $1" );
            srcLabel = srcLabel.charAt(0).toUpperCase() + srcLabel.slice(1);
            
            if (sourceProcessor.outputNodes.length === 1) srcLabel += ' Features';
            
            let tgtLabel = targetProcessor.type.replace( /([A-Z])/g, " $1" );
            tgtLabel = tgtLabel.charAt(0).toUpperCase() + tgtLabel.slice(1);
            
            if (targetProcessor.inputNodes.length === 1) tgtLabel += ' Features';
            
            connection.getOverlay('label').setLabel(srcLabel + ' to ' + tgtLabel); */
        };

        targetEP       = targetEndpoint;
        sourceEP       = sourceEndpoint;
        writerTargetEP = writerTargetEndpoint;
        writerSourceEP = writerSourceEndpoint;
        readerSourceEP = readerSourceEndpoint;

        plumbInst.batch(function ()
        {
            // create a window for each processor
            let screenHeight = window.innerHeight;
            let col = 0;

            for (let i in app.request.processors)
            {
                let payload = app.request.processors[i];

                let top = 200 + (130 * i) - ((screenHeight - 320) * col);

                if(top > screenHeight - 160)
                {
                    col += 1;
                    top = 200 + (130 * i) - ((screenHeight - 320) * col);
                }

                let left = 400 + (350 * col);

                if(payload.hasOwnProperty('x') && payload.x > 200) left = payload.x;
                if(payload.hasOwnProperty('y') && payload.y > 100) top = payload.y;

                addProcessorToDiagram(payload, top, left, sourceEndpoint, targetEndpoint);
            }

            // listen for new connections; initialise them the same way we initialise the connections at startup.
            plumbInst.bind('connection', function (connInfo, originalEvent)
            {
                init(connInfo.connection);
            });

            // make all the window divs draggable
            // or see below to lock to a canvas
            // plumbInst.draggable(jsPlumb.getSelector(".flowchart-demo .window"), { grid: [20, 20] });
            plumbInst.draggable(document.querySelectorAll('.window'), // should probably define a specific class for these, in case of any issues...
            {
                grid: [5, 5],
                //containment: true, // used to contain to the container div. Need to set container sizes appropriately. Useful when zoom is implemented, otherwise too restrictive
                stop: function(event, ui)
                {
                    let name = event.el.id.replace('flowchartWindow', '');
                    for (let i in app.request.processors)
                    {
                        let processor = app.request.processors[i];

                        if(processor.name == name)
                        {
                            processor.x = $('#' + event.el.id).css('left').replace('px', '');
                            processor.y = $('#' + event.el.id).css('top').replace('px', '');
                            break;
                        }
                    }
                }
            });

            // Connect any related windows
            // need to add handling for processors with multiple input sources (leftTop, leftBottom)
            for (let i in app.request.processors)
            {
                let processor = app.request.processors[i];

                for (let key in processor.inputNodes)
                {
                    if (processor.inputNodes.hasOwnProperty(key))
                    {
                        let inputNodes = processor.inputNodes[key];
                        for (let node in inputNodes)
                        {
                            let inputNode = inputNodes[node];

                            plumbInst.connect({uuids: ['Window' + inputNode.name + 'Source_' + inputNode.node, 'Window' + processor.name + 'Target_' + key], editable: true});

                            jsPlumb.repaint('flowchartWindow' + inputNode.name);
                            jsPlumb.repaint('flowchartWindow' + processor.name);
                        }
                    }
                }
            }

            // set up listeners
            // listeners for connection click, drag, dragStop, and moved
            plumbInst.bind('click', function (conn, originalEvent)
            {
                //conn.toggleType('basic');
                //console.log('connection ' + conn.id + ' is being clicked. suspendedElement is ', conn.suspendedElement, ' of type ', conn.suspendedElementType);
            });

            plumbInst.bind('connectionDrag', function (connection)
            {
                //console.log('connection ' + connection.id + ' is being dragged. suspendedElement is ', connection.suspendedElement, ' of type ', connection.suspendedElementType);
            });

            plumbInst.bind('connectionDragStop', function (connection)
            {
                //console.log('connection ' + connection.id + ' was dragged');
            });

            plumbInst.bind('connectionMoved', function (params)
            {
            });

            plumbInst.bind('connection', function (info)
            {
                if(info.sourceId.includes("flowchartWindow") && info.targetId.includes("flowchartWindow"))
                {
                    let sourceId = info.sourceId.replace('flowchartWindow','');
                    let targetId = info.targetId.replace('flowchartWindow','');

                    let sourceNode = info.sourceEndpoint._jsPlumb.uuid.replace('Window' + sourceId + 'Source_','');
                    let targetNode = info.targetEndpoint._jsPlumb.uuid.replace('Window' + targetId + 'Target_','');

                    for (let i in app.request.processors)
                    {
                        let processor = app.request.processors[i];
                        if(processor.name == targetId)
                        {
                            for (let key in processor.inputNodes)
                            {
                                if (processor.inputNodes.hasOwnProperty(key))
                                {
                                    let inputNodes = processor.inputNodes[targetNode];
                                    if(!inputNodes) inputNodes = [];

                                    // only link source node to this nodes set of inputs if
                                    // there is no circular path back. Does source node depend on the input?
                                    // go through the source nodes tree. If at any point the it hits, cancel this
                                    let isCircular = testCircularLinks(sourceId, targetId);

                                    if (!isCircular) {
                                        inputNodes.push({ name: sourceId, node: sourceNode });
                                    } else {
                                        refreshDiagram();
                                    }

                                    break;
                                }
                            }
                        }
                    }
                }
            });

            plumbInst.bind("connectionDetached", function (info)
            {
                if(info.sourceId.includes("flowchartWindow") && info.targetId.includes("flowchartWindow"))
                {
                    let sourceId = info.sourceId.replace('flowchartWindow','');
                    let targetId = info.targetId.replace('flowchartWindow','');

                    let sourceNode = info.sourceEndpoint._jsPlumb.uuid.replace('Window' + sourceId + 'Source_','');
                    let targetNode = info.targetEndpoint._jsPlumb.uuid.replace('Window' + targetId + 'Target_','');

                    for (let i in app.request.processors)
                    {
                        let processor = app.request.processors[i];
                        if(processor.name == targetId)
                        {
                            for (let key in processor.inputNodes)
                            {
                                if (processor.inputNodes.hasOwnProperty(key))
                                {
                                    let inputNodes = processor.inputNodes[key];
                                    for (let nodeInd in inputNodes)
                                    {
                                        let node = inputNodes[nodeInd];
                                        if(node.name == sourceId)
                                        {
                                            let index = inputNodes.indexOf(node);
                                            if (index > -1)
                                            {
                                                inputNodes.splice(index, 1);
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });

        jsPlumb.fire("jsPlumbDemoLoaded", plumbInst);

        jsPlumb.repaintEverything();
    });
}

let targetEP;
let sourceEP;
let writerSourceEP;
let writerTargetEP;
let readerSourceEP;

function addProcessorToDiagram(processor, top, left, sourceEndpoint, targetEndpoint)
{
	let procType = "";

	let result = processor.type.replace( /([A-Z])/g, " $1" );
	let title = result.charAt(0).toUpperCase() + result.slice(1);

	if(title.toLowerCase().includes("writer")) procType = "writer";
	else if(title.toLowerCase().includes("reader")) procType = "reader";
	else procType = "processor";

    getProcessorPanel(processor, top, left, "canvas");
    
	// technically, we don't need any of this logic. Just replace the hard coded node definitions
	// with some math to adjust node placement on the left or right according to how many nodes we have.

	if(procType == "writer")
	{
		// should writers have an output port?
		//plumbInst.addEndpoint("flowchartWindow" + processor.name, writerSourceEP, { anchor: "RightMiddle", uuid: "Window" + processor.name + "RightMiddle" });
		plumbInst.addEndpoint("flowchartWindow" + processor.name, writerTargetEP, { anchor: "LeftMiddle", uuid: "Window" + processor.name + "Target_features" });
	}
	else if(procType == "reader")
	{
		plumbInst.addEndpoint("flowchartWindow" + processor.name, readerSourceEP, { anchor: "RightMiddle", uuid: "Window" + processor.name + "Source_features" });
	}
	else
	{
		let outputNodeKeys = [];
		let inputNodeKeys = [];
		for (let key in processor.outputNodes)
		{
			outputNodeKeys.push(key);
		}

		for (let key in processor.inputNodes)
		{
			inputNodeKeys.push(key);
		}

		if(outputNodeKeys.length == 3)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.name, sourceEndpoint, { anchor: [ 0, 0.25, -1, -1 ], uuid: "Window" + processor.name + "Source_"  + outputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.name, sourceEndpoint, { anchor: "RightMiddle", uuid: "Window" + processor.name + "Source_"  + outputNodeKeys[1] });
			plumbInst.addEndpoint("flowchartWindow" + processor.name, sourceEndpoint, { anchor: [ 0, 0.75, -1, -1 ], uuid: "Window" + processor.name + "Source_"  + outputNodeKeys[2] });
		}
		else if(outputNodeKeys.length == 2)
		{
            let ep1 = JSON.parse(JSON.stringify(sourceEndpoint));
            let ep2 = JSON.parse(JSON.stringify(sourceEndpoint));

            ep1.overlays[0][1].label = outputNodeKeys[0];
            ep1.overlays[0][1].visible = true;

            ep2.overlays[0][1].label = outputNodeKeys[1];
            ep2.overlays[0][1].visible = true;

			plumbInst.addEndpoint("flowchartWindow" + processor.name, ep1, { anchor: [ 1, 0.55, 0, 0 ], uuid: "Window" + processor.name + "Source_"  + outputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.name, ep2, { anchor: [ 1, 0.75, 0, 0 ], uuid: "Window" + processor.name + "Source_" + outputNodeKeys[1] });
		}
		else if(outputNodeKeys.length == 1)
		{
            let ep1 = JSON.parse(JSON.stringify(sourceEndpoint));

            ep1.overlays[0][1].label = outputNodeKeys[0];
            ep1.overlays[0][1].visible = true;

			plumbInst.addEndpoint("flowchartWindow" + processor.name, ep1, { anchor: [ 1, 0.65, 0, 0 ], uuid: "Window" + processor.name + "Source_" + outputNodeKeys[0] });
		}

		if(inputNodeKeys.length == 3)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.name, targetEndpoint, { anchor: [ 0, 0.25, 0, 0 ], uuid: "Window" + processor.name + "Target_" + inputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.name, targetEndpoint, { anchor: "LeftMiddle", uuid: "Window" + processor.name + "Target_" + inputNodeKeys[1] });
			plumbInst.addEndpoint("flowchartWindow" + processor.name, targetEndpoint, { anchor: [ 0, 0.75, 0, 0 ], uuid: "Window" + processor.name + "Target_" + inputNodeKeys[2] });
		}
		else if(inputNodeKeys.length == 2)
		{
            let ep1 = JSON.parse(JSON.stringify(targetEndpoint));
            let ep2 = JSON.parse(JSON.stringify(targetEndpoint));

            ep1.overlays[0][1].label = inputNodeKeys[0];
            ep1.overlays[0][1].visible = true;

            ep2.overlays[0][1].label = inputNodeKeys[1];
            ep2.overlays[0][1].visible = true;

			plumbInst.addEndpoint("flowchartWindow" + processor.name, ep1, { anchor: [ 0, 0.55, 0, 0 ], uuid: "Window" + processor.name + "Target_" + inputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.name, ep2, { anchor: [ 0, 0.75, 0, 0 ], uuid: "Window" + processor.name + "Target_" + inputNodeKeys[1] });
		}
		else if(inputNodeKeys.length == 1)
		{
            let ep1 = JSON.parse(JSON.stringify(targetEndpoint));

            ep1.overlays[0][1].label = inputNodeKeys[0];
            ep1.overlays[0][1].visible = true;

			plumbInst.addEndpoint("flowchartWindow" + processor.name, ep1, { anchor: [ 0, 0.65, 0, 0 ], uuid: "Window" + processor.name + "Target_" + inputNodeKeys[0] });
		}
	}
}

function getProcessorPanel(processor, top, left, canvas)
{
	// wrapper
	let result = processor.type.replace( /([A-Z])/g, " $1" );
    let title = result.charAt(0).toUpperCase() + result.slice(1);
    
	let procType = "";

	if(title.toLowerCase().includes("writer")) procType = "writer";
	else if(title.toLowerCase().includes("reader")) procType = "reader";
	else procType = "processor";

    let outputs = Object.keys(processor.outputNodes).length;
    let inputs = Object.keys(processor.inputNodes).length;

    let panelHeight = outputs > 1 || inputs > 1 ? 110 : 90
    let titleHeight = outputs > 1 || inputs > 1 ? 40 : 20

	let processorHtml  = "<div ondblclick=\"editNode('" + processor.name + "');\" class=\"window jtk-node\" id=\"flowchartWindow" + processor.name + "\" style=\"width: 250px; position: absolute; left: " + left + "px; top: " + top + "px;\">";
		processorHtml += "<div class=\"card " + procType + " z-depth-0\" style=\"border: 1px solid #e0e0e0;\">";
		processorHtml += "<div class='card-image' style='height: " + panelHeight + "px;'>";
		processorHtml += "<span class=\"card-title\" style='bottom: " + titleHeight + "px;'>" + processor.name + " | <span style='font-size: 16px; font-style: italic;'>" + title + "</span></span>";
        processorHtml += "</div></div></div>";

	$("#" + canvas).append(processorHtml);
}

function editNode(processorId)
{
    app.request.processors.forEach(processor => 
    {
        if (processor.name === processorId)
        {
            let result = processor.type.replace( /([A-Z])/g, " $1" );
            let title = result.charAt(0).toUpperCase() + result.slice(1);

            app.selectedNode =
            {
                title: processor.name + ' | ' + title,
                processor: JSON.parse(JSON.stringify(processor))
            };
            // display
            $('#node_editor').show();
        }
    });
}

function saveNodeUpdates()
{
    app.request.processors.forEach(processor => 
    {
        if (processor.name === app.selectedNode.processor.name)
        {
            processor.attributes = app.selectedNode.processor.attributes;
        }
    });

    $('#node_editor').hide();
}

function dragTool(event) 
{
    event.dataTransfer.setData('tool', event.target.id);
}

function allowDropTool(event)
{
    event.preventDefault();
}

function dropTool(event)
{
    console.log('Drop! ' + event.dataTransfer.getData('tool'));
    addNode(event.dataTransfer.getData('tool'), event.pageX - 120, event.pageY - 40);
}

function testCircularLinks(sourceId, targetId)
{
    let dependentNodes = [];
    for (let i in app.request.processors)
    {
        let processor = app.request.processors[i];
        if(processor.name == sourceId)
        {
            for(let key in processor.inputNodes) {
                let inputs = processor.inputNodes[key];
                dependentNodes = dependentNodes.concat(inputs);
            }
            break;
        }
    }

    // do we have a hit with targetId?
    for (let node in dependentNodes) {
        if (dependentNodes[node].name === targetId) {
            return true;
        }
    }

    // Test the dependents
    for (let i = 0; i < dependentNodes.length; i++) {
        for (let key in app.request.processors)
        {
            let processor = app.request.processors[key];
            if(processor.name == dependentNodes[i].name)
            {
                let isCircular = testCircularLinks(dependentNodes[i].name, targetId);
                if (isCircular) return true;
            }
        }
    }

    return false;
}