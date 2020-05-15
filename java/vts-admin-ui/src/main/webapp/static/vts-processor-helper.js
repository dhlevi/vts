function getProcessorPanel(processor, top, left, canvas)
{
	// wrapper
	var result = processor.type.replace( /([A-Z])/g, " $1" );
	var title = result.charAt(0).toUpperCase() + result.slice(1);

	var cardColor = "white";

	var procType = "";

	if(title.toLowerCase().includes("writer")) procType = "writer";
	else if(title.toLowerCase().includes("reader")) procType = "reader";
	else procType = "processor";

	if(procType == "writer") cardColor = "red lighten-3";
	else if(procType == "reader") cardColor = "orange lighten-5";
	else cardColor = "deep-purple lighten-4";

	var processorHtml = "<div class=\"window jtk-node\" id=\"flowchartWindow" + processor.processorID + "\" style=\"width: 300px; position: absolute; left: " + left + "px; top: " + top + "px;\">";
		processorHtml += "<div class=\"card " + cardColor + " z-depth-0\" style=\"border: 1px solid #e0e0e0;\">";
		processorHtml += "<div class='card-image' style='height: 100px;'>";
		processorHtml += "<span class=\"card-title black-text\" style='bottom: 15px;'>(" + processor.processorID + ") " + title + "</span>";
		processorHtml += "<a class='btn-floating halfway-fab waves-effect waves-light red' onclick=\"$('#" + processor.processorID + "_panelContainer').toggle();\"><i class='material-icons'>add</i></a>";
		processorHtml += "</div>";
		processorHtml += "<div class='card-content white' style='padding: 0px;'>";

	// main content, by type
	switch(processor.type)
	{
		case "areaCalculator":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Attribute Name\" id='" + processor.processorID + "_attributeName' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"areaAttribute\", $(\"#" + processor.processorID + "_attributeName\").val())'><label for='" + processor.processorID + "_attributeName'>Area Attribute Name:</label></div></div>";

		break;
		case "lengthCalculator":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Attribute Name\" id='" + processor.processorID + "_lengthAttribute' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"lengthAttribute\", $(\"#" + processor.processorID + "_lengthAttribute\").val())'><label for='" + processor.processorID + "_lengthAttribute'>Length Attribute Name:</label></div></div>";
		break;
		case "convexHullCreator":
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
		break;
		case "bufferFeature":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Distance\" id='" + processor.processorID + "_distanceAttribute' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"distance\", $(\"#" + processor.processorID + "_distanceAttribute\").val())'><label for='" + processor.processorID + "_attributeName'>Distance:</label></div></div>";
		break;
		case "overlayOperator":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><select id='" + processor.processorID + "_operator' onchange='updateProcessorColumn(\"" + processor.processorID + "\", \"overlayOperation\", $(\"#" + processor.processorID + "_operator\").val())'><option value=\"intersection\">Intersection</option><option value=\"difference\">Difference</option><option value=\"union\">Union</option></select><label>Overlay Method</label></div></div>";
		break;
		case "featureSimplifier":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Distance Tolerance\" id='" + processor.processorID + "_distance' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"distanceTolerance\", $(\"#" + processor.processorID + "_distance\").val())'><label for='" + processor.processorID + "_distance'>Distance Tolerance:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><select id='" + processor.processorID + "_operator' onchange='updateProcessorColumn(\"" + processor.processorID + "\", \"method\", $(\"#" + processor.processorID + "_operator\").val())'><option value=\"visvalingamwhyatt\">Visvalingam-Whyatt</option><option value=\"douglaspeucker\">Douglas-Peucker</option><option value=\"topologypreserver\">Douglas-Peucker Topology Preserver</option></select><label for='" + processor.processorID + "_operator'>Simplification Method:</label></div></div>";
		break;
		case "featureValidator":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Is Valid Attribute\" id='" + processor.processorID + "_isValidName' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"isValidAttribute\", $(\"#" + processor.processorID + "_isValidName\").val())'><label for='" + processor.processorID + "_isValidName'>Is Valid Attribute:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Validation Message Attribute\" id='" + processor.processorID + "_messageName' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"errorMessageAttribute\", $(\"#" + processor.processorID + "_messageName\").val())'><label for='" + processor.processorID + "_messageName'>Validation Message Attribute:</label></div></div>";
		break;
		case "attributeCreator":
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			// inputs
			// need additional screen to define full attribute structure and add as many as needed
		break;
		case "attributeRenamer":
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			// need additional screen to define full AttributeUpdateValueMapper structure and add as many as needed
		break;
		case "attributeRemover":
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			// need additional screen to select attributes to remove
		break;
		case "attributeCalculator":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Attribute Name\" id='" + processor.processorID + "_attributeName' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"attributeName\", $(\"#" + processor.processorID + "_attributeName\").val())'><label for='" + processor.processorID + "_attributeName'>Attribute Name:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><textarea id='" + processor.processorID + "_expression' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"expression\", $(\"#" + processor.processorID + "_expression\").val())' class='materialize-textarea'><label for='" + processor.processorID + "_isValidName'>Expression:</label></div></div>";
		break;
		case "oracleReader":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Connection String\" id='" + processor.processorID + "_conn' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"connection\", $(\"#" + processor.processorID + "_conn\").val())'><label for='" + processor.processorID + "_conn'>Connection String:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"User Name\" id='" + processor.processorID + "_user' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"user\", $(\"#" + processor.processorID + "_user\").val())'><label for='" + processor.processorID + "_user'>User:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input  placeholder=\"Password\" id='" + processor.processorID + "_password' type='password' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"password\", $(\"#" + processor.processorID + "_password\").val())'><label for='" + processor.processorID + "_password'>Password:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Table Name\" id='" + processor.processorID + "_table' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"table\", $(\"#" + processor.processorID + "_table\").val())'><label for='" + processor.processorID + "_table'>Table:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Where Clause\" id='" + processor.processorID + "_where' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"whereClause\", $(\"#" + processor.processorID + "_where\").val())'><label for='" + processor.processorID + "_where'>Where Clause:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Custom Query\" id='" + processor.processorID + "_customQuery' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"customQuery\", $(\"#" + processor.processorID + "_customQuery\").val())'><label for='" + processor.processorID + "_customQuery'>Custom Query (overrides table/where):</label></div></div>";
		break;
		case "oracleWriter":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Connection String\" id='" + processor.processorID + "_conn' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"connection\", $(\"#" + processor.processorID + "_conn\").val())'><label for='" + processor.processorID + "_conn'>Connection String:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"User Name\" id='" + processor.processorID + "_user' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"user\", $(\"#" + processor.processorID + "_user\").val())'><label for='" + processor.processorID + "_user'>User:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input  placeholder=\"Password\" id='" + processor.processorID + "_password' type='password' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"password\", $(\"#" + processor.processorID + "_password\").val())'><label for='" + processor.processorID + "_password'>Password:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Table Name\" id='" + processor.processorID + "_table' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"table\", $(\"#" + processor.processorID + "_table\").val())'><label for='" + processor.processorID + "_table'>Table:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Key Attribute Name\" id='" + processor.processorID + "_keyAttribute' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"keyAttributeName\", $(\"#" + processor.processorID + "_keyAttribute\").val())'><label for='" + processor.processorID + "_keyAttribute'>Key Attribute Name:</label></div></div>";
		break;
		case "spatialFilter":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><select id='" + processor.processorID + "_filters' onchange='updateProcessorColumn(\"" + processor.processorID + "\", \"filterTypes\", $(\"#" + processor.processorID + "_filters\").val())' multiple><option value=\"all\">All</option><option value=\"point\">Point</option><option value=\"line\">Line</option><option value=\"polygon\">Polygon</option><option value=\"multipoint\">Multi-Point</option><option value=\"multiline\">Multi-Line</option><option value=\"multipolygon\">Multi-Polygon</option><option value=\"nil\">Null</option><option value=\"none\">None</option></select><label for='" + processor.processorID + "_filters'>Filters:</label></div></div>";
		break;
		case "spatialRelationFilter":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><select id='" + processor.processorID + "_operator' onchange='updateProcessorColumn(\"" + processor.processorID + "\", \"relationTypes\", $(\"#" + processor.processorID + "_operator\").val())' multiple><option value=\"any\">Any</option><option value=\"intersects\">intersects</option><option value=\"contains\">Contains</option><option value=\"within\">Within</option><option value=\"equals\">Equals</option><option value=\"disjoint\">Disjoint</option><option value=\"touches\">Touches</option><option value=\"crosses\">Crosses</option><option value=\"overlaps\">Overlaps</option><option value=\"covers\">Covers</option><option value=\"coveredby\">Covered By</option></select><label for='" + processor.processorID + "_operator'>Relation Methods:</label></div></div>";
		break;
		case "conditionalFilter":
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			// inputs
			// need to add a window that allows condition creation.
		break;
		case "voronoi":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Tolerance\" id='" + processor.processorID + "_tolerance' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"tolerance\", $(\"#" + processor.processorID + "_tolerance\").val())'><label for='" + processor.processorID + "_tolerance'>Tolerance:</label></div></div>";
		break;
		case "triangulator":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Tolerance\" id='" + processor.processorID + "_tolerance' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"tolerance\", $(\"#" + processor.processorID + "_tolerance\").val())'><label for='" + processor.processorID + "_tolerance'>Tolerance:</label></div></div>";
			processorHtml += "</div>";
		break;
		case "shapeFileReader":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Path\" id='" + processor.processorID + "_path' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"path\", $(\"#" + processor.processorID + "_path\").val())'><label for='" + processor.processorID + "_path'>Path:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><label><input id='" + processor.processorID + "_del' type=\"checkbox\" class=\"checkbox-orange filled-in\" onclick='updateProcessorColumn(\"" + processor.processorID + "\", \"deleteAfterRead\", $(\"#" + processor.processorID + "_del\").is(\":checked\"))'/><span>Delete after read</span></label>";
		break;
		case "shapeFileWriter":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Path\" id='" + processor.processorID + "_path' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"destination\", $(\"#" + processor.processorID + "_path\").val())'><label for='" + processor.processorID + "_path'>Path:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"File Name\" id='" + processor.processorID + "_fileName' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"fileName\", $(\"#" + processor.processorID + "_fileName\").val())'><label for='" + processor.processorID + "_fileName'>File Name:</label></div></div>";
		break;
		case "jsonReader":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Path\" id='" + processor.processorID + "_path' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"path\", $(\"#" + processor.processorID + "_path\").val())'><label for='" + processor.processorID + "_path'>Path:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><label><input id='" + processor.processorID + "_del' type=\"checkbox\" class=\"checkbox-orange filled-in\" onclick='updateProcessorColumn(\"" + processor.processorID + "\", \"deleteAfterRead\", $(\"#" + processor.processorID + "_del\").is(\":checked\"))'/><span>Delete after read</span></label>";
		break;
		case "kmlReader":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Path\" id='" + processor.processorID + "_path' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"path\", $(\"#" + processor.processorID + "_path\").val())'><label for='" + processor.processorID + "_path'>Path:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><label><input id='" + processor.processorID + "_del' type=\"checkbox\" class=\"checkbox-orange filled-in\" onclick='updateProcessorColumn(\"" + processor.processorID + "\", \"deleteAfterRead\", $(\"#" + processor.processorID + "_del\").is(\":checked\"))'/><span>Delete after read</span></label>";
		break;
		case "kmlWriter":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Path\" id='" + processor.processorID + "_path' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"destination\", $(\"#" + processor.processorID + "_path\").val())'><label for='" + processor.processorID + "_path'>Path:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"File Name\" id='" + processor.processorID + "_fileName' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"fileName\", $(\"#" + processor.processorID + "_fileName\").val())'><label for='" + processor.processorID + "_fileName'>File Name:</label></div></div>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"Custom style XML\" id='" + processor.processorID + "_style' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"style\", $(\"#" + processor.processorID + "_style\").val())'><label for='" + processor.processorID + "_style'>Custom Style XML:</label></div></div>";
		break;
		case "featureHolder":
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			// inputs
			// allow to supply arbitrary feature objects? Basically a geometry creator
		break;
		case "projector":
			// inputs
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
			processorHtml += "<div class='row'><div class='input-field col s12'><input placeholder=\"SRID\" id='" + processor.processorID + "_srid' type='text' class='validate' onkeyup='updateProcessorColumn(\"" + processor.processorID + "\", \"srid\", $(\"#" + processor.processorID + "_srid\").val())'><label for='" + processor.processorID + "_srid'>SRID:</label></div></div>";
		break;
		default:
			processorHtml += "<div id='" + processor.processorID + "_panelContainer' style='display: none;'>";
	}
	// footer (delete button), close panel container
	processorHtml += "<div class=\"row\" style=\"padding: 10px;\"><div class=\"col s4 offset-s8\"><a onclick=\"deleteProcessor(" + processor.processorID + ")\" class=\"waves-effect waves-light btn red darken-4 white-text\">Delete</a></div></div></div>";
	// close content, card-white, and feature panel
	processorHtml += "</div></div></div>";

	$("#" + canvas).append(processorHtml);

	$('select').formSelect();

	//bind values (you know, this should all be done in Vue. Maybe once the prototype is verified we'll re-write this stuff)
	if(processor.hasOwnProperty('areaAttribute')) $("#" + processor.processorID + "_attributeName").val(processor.areaAttribute);
	if(processor.hasOwnProperty('lengthAttribute')) $("#" + processor.processorID + "_lengthAttribute").val(processor.lengthAttribute);
	if(processor.hasOwnProperty('distance')) $("#" + processor.processorID + "_distanceAttribute").val(processor.distance);
	if(processor.hasOwnProperty('overlayOperation')) $("#" + processor.processorID + "_operator").val(processor.overlayOperation);
	if(processor.hasOwnProperty('method')) $("#" + processor.processorID + "_operator").val(processor.method);
	if(processor.hasOwnProperty('distanceTolerance')) $("#" + processor.processorID + "_distance").val(processor.distanceTolerance);
	if(processor.hasOwnProperty('isValidAttribute')) $("#" + processor.processorID + "_isValidName").val(processor.isValidAttribute);
	if(processor.hasOwnProperty('errorMessageAttribute')) $("#" + processor.processorID + "_messageName").val(processor.errorMessageAttribute);
	if(processor.hasOwnProperty('attributeName')) $("#" + processor.processorID + "_attributeName").val(processor.attributeName);
	if(processor.hasOwnProperty('expression')) $("#" + processor.processorID + "_expression").val(processor.expression);
	if(processor.hasOwnProperty('connection')) $("#" + processor.processorID + "_conn").val(processor.connection);
	if(processor.hasOwnProperty('user')) $("#" + processor.processorID + "_user").val(processor.user);
	if(processor.hasOwnProperty('password')) $("#" + processor.processorID + "_password").val(processor.password);
	if(processor.hasOwnProperty('table')) $("#" + processor.processorID + "_table").val(processor.table);
	if(processor.hasOwnProperty('whereClause')) $("#" + processor.processorID + "_where").val(processor.whereClause);
	if(processor.hasOwnProperty('customQuery')) $("#" + processor.processorID + "_customQuery").val(processor.customQuery);
	if(processor.hasOwnProperty('keyAttributeName')) $("#" + processor.processorID + "_keyAttribute").val(processor.keyAttributeName);
	if(processor.hasOwnProperty('filterTypes')) $("#" + processor.processorID + "_filters").val(processor.filterTypes);
	if(processor.hasOwnProperty('relationTypes')) $("#" + processor.processorID + "_operator").val(processor.relationTypes);
	if(processor.hasOwnProperty('tolerance')) $("#" + processor.processorID + "_tolerance").val(processor.tolerance);
	if(processor.hasOwnProperty('path')) $("#" + processor.processorID + "_path").val(processor.path);
	if(processor.hasOwnProperty('destination')) $("#" + processor.processorID + "_path").val(processor.destination);
	if(processor.hasOwnProperty('fileName')) $("#" + processor.processorID + "_fileName").val(processor.fileName);
	if(processor.hasOwnProperty('style')) $("#" + processor.processorID + "_style").val(processor.style);
	if(processor.hasOwnProperty('deleteAfterRead')) $("#" + processor.processorID + "_style").val(processor.deleteAfterRead);
	if(processor.hasOwnProperty('srid')) $("#" + processor.processorID + "_srid").val(processor.srid);
}

function setupProcessor(processor)
{
	processor.inputNodes = { features: [] };
	processor.outputNodes = { features: [] };

	switch(processor.type)
	{
		case "areaCalculator":
			processor.areaAttribute = "";
		break;
		case "lengthCalculator":
			processor.lengthAttribute = "";
		break;
		case "bufferFeature":
			processor.distance = 0;
		break;
		case "overlayOperator":
			processor.outputNodes.outside = [];
			processor.inputNodes.operators = [];
			processor.overlayOperation = "intersection";
		break;
		case "featureSimplifier":
			processor.method = "douglaspeucker";
			processor.distanceTolerance = 0;
		break;
		case "featureValidator":
			processor.isValidAttribute = "IS_VALID";
			processor.errorMessageAttribute = "IS_VALID_MESSAGE";
		break;
		case "attributeCreator":
			processor.newAttributes = [];
		break;
		case "attributeRenamer":
			processor.attributesToTest = [];
		break;
		case "attributeRemover":
			processor.attributesToRemove = [];
		break;
		case "attributeCalculator":
			processor.expression = "";
			processor.attributeName = "";
		break;
		case "oracleReader":
			processor.connection = "";
			processor.user = "";
			processor.password = "";
			processor.table = "";
			processor.whereClause = "";
			processor.customQuery = "";
		break;
		case "oracleWriter":
			processor.connection = "";
			processor.user = "";
			processor.password = "";
			processor.table = "";
			processor.truncate = false;
			processor.keyAttributeName = "";
		break;
		case "spatialFilter":
			processor.filterTypes = [];
			processor.outputNodes.failed = [];
		break;
		case "spatialRelationFilter":
			processor.relationTypes = [];
			processor.outputNodes.failed = [];
			processor.inputNodes.operators = [];
		break;
		case "conditionalFilter":
			processor.outputNodes.failed = [];
			processor.conditions = [];
			processor.conditionalAnd = false;
		break;
		case "voronoi":
			processor.tolerance = 1.0;
		break;
		case "triangulator":
			processor.tolerance = 1.0;
		break;
		case "shapeFileReader":
			processor.path = "";
			processor.deleteAfterRead = false;
		break;
		case "shapeFileWriter":
			processor.destination = "";
			processor.fileName = "";
		break;
		case "jsonReader":
			processor.path = "";
			processor.deleteAfterRead = false;
		break;
		case "kmlReader":
			processor.path = "";
			processor.deleteAfterRead = false;
		break;
		case "kmlWriter":
			processor.destination = "";
			processor.fileName = "";
			processor.style = "";
		break;
		case "featureValidator":
			processor.outputNodes.failed = [];
		break;
		case "projector":
			processor.srid = "";
		break;
	}
}

function determineProcessorAttributes(processor)
{
	var deleteAfterRead;
	if(processor.hasOwnProperty("deleteAfterRead"))
	{
		deleteAfterRead = processor.deleteAfterRead;
		processor.deleteAfterRead = false;
	}

	var jsonString = JSON.stringify(processor);

	$.ajax
	({
		url: serviceUrl + "Admin/Attributes",
        type: 'post',
        dataType: 'json',
        contentType:'application/json',
        data: jsonString,
	    crossDomain: true,
		withCredentials: true,
        success: function (attributeData)
        {
			// we have a readers attribute list... where do we store this?
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to fetch attributes: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}