function addNode(node)
{
    let processor = 
    {
        type: node, 
        processed: false,
        name: '', 
        x: 0, 
        y: 0,
        messages: [],
        inputNodes: { features: [] },
        outputNodes: { features: [] },
        attributes: {}
    };

    switch(node)
    {
        case 'httpReader':
            processor.attributes.url = '';
            processor.attributes.dataType = 'json';
            processor.attributes.authenticationType = 'basic';
            processor.attributes.user = '';
            processor.attributes.password = '';
        break;
        case 'fileReader':
            processor.attributes.path = '';
            processor.attributes.dataType = 'json';
        break;
        case 'dbReader':
            processor.attributes.connection = '';
            processor.attributes.source = 'oracle';
            processor.attributes.user = '';
            processor.attributes.password = '';
        break;
        case 'buffer':
            processor.attributes.distance = 0;
            processor.attributes.units = 'kilometers';
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

	processor.name = name;

    app.request.processors.push(processor);

    // this can't be the optimal way to refresh the canvas...
	$("#canvas").empty();

	jsPlumb.empty("canvas");
	jsPlumb.revalidate("canvas");
	jsPlumb.reset();
    
    setupCanvas();
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
                [ "Arrow", {
                    location: 1,
                    visible:true,
                    width:11,
                    length:11,
                    id:"ARROW",
                    events:{
                        click:function() { /* Some function to run when an overlay is clicked on */ }
                    }
                }]/*,
                    [ "Label", {
                    location: 0.1,
                    id: "label",
                    cssClass: "aLabel",
                    events:{
                        tap:function()
                        {
                            //Some function to run when a label is clicked on
                        }
                    }
                }]*/
            ],
            Container: "canvas"
        });

        let basicType =
        {
            connector: "StateMachine",
            paintStyle: { stroke: "red", strokeWidth: 4 },
            hoverPaintStyle: { stroke: "blue" },
            overlays: [ "Arrow" ]
        };

        plumbInst.registerConnectionType("basic", basicType);

        // this is the paint style for the connecting lines..
        let connectorPaintStyle =
        {
            strokeWidth: 2,
            stroke: "#707070",
            joinstyle: "round",
            outlineStroke: "white",
            outlineWidth: 1
        },
        // .. and this is the hover style.
        connectorHoverStyle =
        {
            strokeWidth: 3,
            stroke: "#f44336",
            outlineWidth: 2,
            outlineStroke: "white"
        },
        endpointHoverStyle =
        {
            fill: "#f44336",
            stroke: "#f44336"
        },
        // the definition of source endpoints (the small blue ones)
        sourceEndpoint =
        {
            endpoint: "Dot",
            paintStyle:
            {
                stroke: "#f5f5f5",
                fill: "#474444",
                radius: 7,
                strokeWidth: 4
            },
            //anchor:[ "Perimeter", { shape:"Square" } ],
            isSource: true,
            connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
            connectorStyle: connectorPaintStyle,
            hoverPaintStyle: endpointHoverStyle,
            maxConnections: -1,
            connectorHoverStyle: connectorHoverStyle,
            dragOptions: {},
            overlays: [["Label", { location: [0.5, 1.5], label: "Drag", cssClass: "endpointSourceLabel", visible:false }]]
        },
        // the definition of writer endpoints (the small blue ones)
        writerTargetEndpoint =
        {
            endpoint: "Dot",
            paintStyle:
            {
                stroke: "#f5f5f5",
                fill: "#474444",
                radius: 7,
                strokeWidth: 4
            },
            //anchor:[ "Perimeter", { shape:"Square" } ],
            hoverPaintStyle: endpointHoverStyle,
            maxConnections: -1,
            dropOptions: { hoverClass: "hover", activeClass: "active" },
            isTarget: true,
            overlays: [[ "Label", { location: [0.5, -0.5], label: "Drop", cssClass: "endpointTargetLabel", visible:false } ]]
        },
        // the definition of target endpoints (will appear when the user drags a connection)
        targetEndpoint =
        {
            endpoint: "Dot",
            paintStyle:
            {
                stroke: "#f5f5f5",
                fill: "#474444",
                radius: 7,
                strokeWidth: 4
            },
            //anchor:[ "Perimeter", { shape:"Square" } ],
            hoverPaintStyle: endpointHoverStyle,
            maxConnections: -1,
            dropOptions: { hoverClass: "hover", activeClass: "active" },
            isTarget: true,
            overlays: [[ "Label", { location: [0.5, -0.5], label: "Drop", cssClass: "endpointTargetLabel", visible:false } ]]
        },
        readerSourceEndpoint =
        {
            endpoint: "Dot",
            paintStyle:
            {
                stroke: "#f5f5f5",
                fill: "#474444",
                radius: 7,
                strokeWidth: 4
            },
            //anchor:[ "Perimeter", { shape:"Square" } ],
            isSource: true,
            connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
            connectorStyle: connectorPaintStyle,
            hoverPaintStyle: endpointHoverStyle,
            maxConnections: -1,
            connectorHoverStyle: connectorHoverStyle,
            dragOptions: {},
            overlays: [["Label", { location: [0.5, 1.5], label: "Drag", cssClass: "endpointSourceLabel", visible:false }]]
        },
        writerSourceEndpoint =
        {
            endpoint: "Dot",
            paintStyle:
            {
                stroke: "#f5f5f5",
                fill: "#474444",
                radius: 7,
                strokeWidth: 4
            },
            //anchor:[ "Perimeter", { shape:"Square" } ],
            isSource: true,
            connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
            connectorStyle: connectorPaintStyle,
            hoverPaintStyle: endpointHoverStyle,
            maxConnections: -1,
            connectorHoverStyle: connectorHoverStyle,
            dragOptions: {},
            overlays: [["Label", { location: [0.5, 1.5], label: "Drag", cssClass: "endpointSourceLabel", visible:false }]]
        },
        init = function (connection)
        {
            connection.getOverlay("label").setLabel(connection.sourceId.substring(15) + "-" + connection.targetId.substring(15));
        };

        targetEP = targetEndpoint;
        sourceEP = sourceEndpoint;
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

                if(payload.hasOwnProperty("x") && payload.x > 200) left = payload.x;
                if(payload.hasOwnProperty("y") && payload.y > 100) top = payload.y;

                addProcessorToDiagram(payload, top, left, sourceEndpoint, targetEndpoint);
            }

            // listen for new connections; initialise them the same way we initialise the connections at startup.
            plumbInst.bind("connection", function (connInfo, originalEvent)
            {
                init(connInfo.connection);
            });

            // make all the window divs draggable
            //plumbInst.draggable(jsPlumb.getSelector(".flowchart-demo .window"), { grid: [20, 20] });
            plumbInst.draggable(document.querySelectorAll(".window"), // should probably define a specific class for these, in case of any issues...
            {
                grid: [5, 5],
                //containment: true, // used to contain to the container div. Need to set container sizes appropriately. Useful when zoom is implemented, otherwise too restrictive
                stop: function(event, ui)
                {
                    let name = event.el.id.replace("flowchartWindow", "");
                    for (let i in app.request.processors)
                    {
                        let processor = app.request.processors[i];

                        if(processor.name == name)
                        {
                            processor.x = $("#" + event.el.id).css("left").replace("px", "");
                            processor.y = $("#" + event.el.id).css("top").replace("px", "");
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

                            plumbInst.connect({uuids: ["Window" + inputNode.name + "Source_" + inputNode.node, "Window" + processor.name + "Target_" + key], editable: true});

                            jsPlumb.repaint("flowchartWindow" + inputNode.name);
                            jsPlumb.repaint("flowchartWindow" + processor.name);
                        }
                    }
                }
            }

            // set up listeners
            // listeners for connection click, drag, dragStop, and moved
            plumbInst.bind("click", function (conn, originalEvent)
            {
                //conn.toggleType("basic");
                //console.log("connection " + conn.id + " is being clicked. suspendedElement is ", conn.suspendedElement, " of type ", conn.suspendedElementType);
            });

            plumbInst.bind("connectionDrag", function (connection)
            {
                //console.log("connection " + connection.id + " is being dragged. suspendedElement is ", connection.suspendedElement, " of type ", connection.suspendedElementType);
            });

            plumbInst.bind("connectionDragStop", function (connection)
            {
                //console.log("connection " + connection.id + " was dragged");
            });

            plumbInst.bind("connectionMoved", function (params)
            {
                //console.log("connection " + params.connection.id + " was moved");
            });

            plumbInst.bind("connection", function (info)
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
                                    inputNodes.push({ name: sourceId, node: sourceNode });
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
	/*
	*  Everything about this method is disgusting. I'll refactor and update if and when this code may actually get used. Until then
	*  it's a quick and horribly dirty way to get the flowchart container panels up on screen and databound.
	*/
	let procType = "";

	let result = processor.type.replace( /([A-Z])/g, " $1" );
	let title = result.charAt(0).toUpperCase() + result.slice(1);

	if(title.toLowerCase().includes("writer")) procType = "writer";
	else if(title.toLowerCase().includes("reader")) procType = "reader";
	else procType = "processor";

	getProcessorPanel(processor, top, left, "canvas");

	let inputNodes = 1;
	let outputNodes = 1;

	// main content, by type
	if(processor.type == "overlayOperator" ||
	   processor.type == "spatialRelationFilter") inputNodes = 2;

	if(processor.type == "spatialFilter" ||
	   processor.type == "spatialRelationFilter" ||
	   processor.type == "featureValidator" ||
	   processor.type == "conditionalFilter" ||
	   processor.type == "overlayOperator") outputNodes = 2;

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
			plumbInst.addEndpoint("flowchartWindow" + processor.name, sourceEndpoint, { anchor: [ 1, 0.35, -1, -1 ], uuid: "Window" + processor.name + "Source_"  + outputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.name, sourceEndpoint, { anchor: [ 1, 0.65, -1, -1 ], uuid: "Window" + processor.name + "Source_" + outputNodeKeys[1] });
		}
		else if(outputNodeKeys.length == 1)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.name, sourceEndpoint, { anchor: "RightMiddle", uuid: "Window" + processor.name + "Source_" + outputNodeKeys[0] });
		}

		if(inputNodeKeys.length == 3)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.name, targetEndpoint, { anchor: [ 0, 0.25, -1, -1 ], uuid: "Window" + processor.name + "Target_" + inputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.name, targetEndpoint, { anchor: "LeftMiddle", uuid: "Window" + processor.name + "Target_" + inputNodeKeys[1] });
			plumbInst.addEndpoint("flowchartWindow" + processor.name, targetEndpoint, { anchor: [ 0, 0.75, -1, -1 ], uuid: "Window" + processor.name + "Target_" + inputNodeKeys[2] });
		}
		else if(inputNodeKeys.length == 2)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.name, targetEndpoint, { anchor: [ 0, 0.35, -1, -1 ], uuid: "Window" + processor.name + "Target_" + inputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.name, targetEndpoint, { anchor: [ 0, 0.65, -1, -1 ], uuid: "Window" + processor.name + "Target_" + inputNodeKeys[1] });
		}
		else if(inputNodeKeys.length == 1)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.name, targetEndpoint, { anchor: "LeftMiddle", uuid: "Window" + processor.name + "Target_" + inputNodeKeys[0] });
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

	let processorHtml  = "<div class=\"window jtk-node\" id=\"flowchartWindow" + processor.name + "\" style=\"width: 200px; position: absolute; left: " + left + "px; top: " + top + "px;\">";
		processorHtml += "<div class=\"card " + procType + " z-depth-0\" style=\"border: 1px solid #e0e0e0;\">";
		processorHtml += "<div class='card-image' style='height: 60px;'>";
		processorHtml += "<span class=\"card-title\" style='bottom: -10px;'>" + processor.name + " | <span style='font-size: 16px; font-style: italic;'>" + title + "</span></span>";
        processorHtml += "</div></div></div>";

	$("#" + canvas).append(processorHtml);
}