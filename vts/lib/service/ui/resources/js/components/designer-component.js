Vue.component('designer',
{
    props: ['tools', 'selectedNode', 'toolSearch'],
    data: function () 
    {
        return {};
    },
    updated: function () 
    {
        this.$nextTick(function () 
        {
        });
    },
    template:   
    `
    <div class="row">
        <div class="col s2">
            <div id="tools" class="row">
                <div class="input-field col s12">
                    <input id="search" v-model="toolSearch" type="text" class="validate white-text">
                    <label for="search">Search</label>
                </div>
            </div>
            <div class="row" style="height: calc(100vh - 248px);">
                <ul class="tool-menu">
                    <toolbar-buttons v-for="(tool, index) in tools"
                                    v-bind:tool="tool"
                                    v-bind:index="index"
                                    v-bind:tool-search="toolSearch"
                                    v-bind:key="index">
                    </toolbar-buttons>
                </ul>
            </div>
        </div>
        <div class="col s10 primary-color-light" style="height: calc(100vh - 130px);" ondrop="dropTool(event)" ondragover="allowDropTool(event)">
            <div class="card toolbar z-depth-2 hoverable">
                <a href="#" onclick="app.tabSwitch('edit-task');" title="Save request as a Scheduled Task"><i class="material-icons">schedule</i></a>
                <a href="#" onclick="runRequest();" title="Send as an ad hoc request"><i class="material-icons">send</i></a>
                <a href="#" onclick="app.tabSwitch('edit-project');" title="Save Diagram"><i class="material-icons">save</i></a>
                <a href="#" onclick="clearDiagram();" title="New Diagram"><i class="material-icons">clear</i></a>
            </div>
            <div id="creatorContainer" class="creatorContainer">
                <div onclick="saveNodeUpdates();" class="designer-canvas jtk-canvas canvas-wide flowchart-area jtk-surface jtk-surface-nopan" id="canvas">
                </div>
            </div>
            <node-editor v-bind:selected-node="selectedNode"></node-editor>
        </div>
    </div>
    `
});

Vue.component('node-editor',
{
    props: ['selectedNode'],
    template:
    `
    <div id="node_editor" class="primary-color-dark z-depth-2 node-editor col s9" style="display: none;">
        <h4 class="white-text" style="font-size: 18px;">{{selectedNode.title}}</h4>
        <div id="nodeEditorContent" style="height: calc(100vh - 364px); overflow-y: scroll;">
            <!-- node attributes -->
            <node-attribute v-for="(attributeKey, index) in Object.keys(selectedNode.processor.attributes)"
                            v-bind:attributeKey="attributeKey"
                            v-bind:attributes="selectedNode.processor.attributes"
                            v-bind:index="index"
                            v-bind:key="index">
            </node-attribute>
        </div>
        <div class="row" style="background-color: inherit; border-top: 1px solid rgba(160,160,160,0.2); position: relative; padding: 16px 24px;">
            <div class="">
                <a href="#" onclick="saveNodeUpdates()" title="Save"><i class="material-icons green-text">save</i></a>
                <a href="#" onclick="$('#node_editor').hide();" title="Cancel"><i class="material-icons red-text">close</i></a>
                <a href="#" v-bind:onclick="'deleteSelectedNode(\\'' + selectedNode.processor.name + '\\');'" title="Delete"><i class="material-icons red-text">delete</i></a>
            </div>
        </div>
    </div>
    `
});

Vue.component('node-attribute',
{
    props: ['attributeKey', 'attributes', 'index'],
    template:   
    `
    <div class="row">
        <div v-bind:class="{ 'input-field': attributeKey !== 'dataType' && attributeKey !== 'featureType' && attributeKey !== 'units' && attributeKey !== 'relationType' }" class="col s12 white-text">
            <label v-if="attributeKey === 'dataType' || attributeKey === 'featureType' || attributeKey === 'units' || attributeKey === 'relationType'" class="white-text" style="text-transform: uppercase;" v-bind:for="'' + attributeKey + ''">{{attributeKey.replace( /([A-Z])/g, " $1" )}}</label>
            <select v-if="attributeKey === 'dataType'" class="browser-default" v-bind:id="'' + attributeKey + ''" v-model="attributes[attributeKey]">
                <option value="json">GeoJSON</option>
                <option value="kml">KML</option>
                <option value="kmz">KMZ</option>
                <option value="shape">Shapefile (zip)</option>
                <option value="fgdb">FGDB (zip)</option>
                <option value="gml">GML</option>
            </select>
            <select v-if="attributeKey === 'featureType'" class="browser-default" v-bind:id="'' + attributeKey + ''" v-model="attributes[attributeKey]">
                <option value="polygon">Polygon</option>
                <option value="lines">Line</option>
                <option value="point">Point</option>
            </select>
            <select v-else-if="attributeKey === 'units'" class="browser-default" v-bind:id="'' + attributeKey + ''" v-model="attributes[attributeKey]">
                <option value="meters">Meters</option>
                <option value="millimeters">Millimeters</option>
                <option value="centimeters">Centimeters</option>
                <option value="kilometers">Kilometers</option>
                <option value="acres">Acres</option>
                <option value="miles">Miles</option>
                <option value="nauticalmiles">Nautical Miles</option>
                <option value="inches">Inches</option>
                <option value="yards">Yards</option>
                <option value="feet">Feet</option>
            </select>
            <select v-else-if="attributeKey === 'relationType'" class="browser-default" v-bind:id="'' + attributeKey + ''" v-model="attributes[attributeKey]">
                <option value="crosses">Croses</option>
                <option value="contains">Contains</option>
                <option value="disjoint">Disjoint</option>
                <option value="equal">Equal</option>
                <option value="overlap">Overlap</option>
                <option value="parallel">Parallel</option>
                <option value="pointinpolygon">Point in Polygon</option>
                <option value="pointonline">Point on Line</option>
                <option value="within">Within</option>
            </select>
            <p v-else-if="attributeKey === 'isConvex' || attributeKey === 'highQuality'">
                <label>
                    <input type="checkbox" class="filled-in" checked="checked" v-model="attributes[attributeKey]"/>
                    <span>{{attributeKey.replace( /([A-Z])/g, " $1" )}}</span>
                </label>
            </p>
            <input v-else v-model="attributes[attributeKey]" v-bind:id="'' + attributeKey + ''" type="text" class="validate white-text">
            <label v-if="attributeKey !== 'isConvex' && attributeKey !== 'highQuality' && attributeKey !== 'dataType' && attributeKey !== 'featureType' && attributeKey !== 'units' && attributeKey !== 'relationType'" class="white-text" style="text-transform: uppercase;" v-bind:for="'' + attributeKey + ''">{{attributeKey.replace( /([A-Z])/g, " $1" )}}</label>
        </div>
    </div>
    `
});

Vue.component('toolbar-buttons',
{
    props: ['tool', 'index', 'toolSearch'],
    template:   
    `
    <li v-bind:id="tool.name" draggable="true" ondragstart="dragTool(event)" v-if="toolSearch === '' || tool.name.toLowerCase().includes(toolSearch.toLowerCase())" v-bind:onclick="'addNode(\\'' + tool.name + '\\');'" v-bind:title="tool.tooltip" style="border-bottom: 1px solid #4a6572; cursor: pointer; text-transform: capitalize; padding: 2px;"><i class="material-icons" style="padding-right: 8px;">{{tool.icon}}</i> {{tool.name.replace( /([A-Z])/g, " $1" )}}</li>
    `
});