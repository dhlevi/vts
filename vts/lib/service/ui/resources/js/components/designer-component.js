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
                    <input id="search" v-model="toolSearch" type="text" class="validate">
                    <label for="search">Search</label>
                </div>
            </div>
            <div class="row" style="height: calc(100vh - 208px);">
                <ul style="overflow: auto; height: 100%">
                    <toolbar-buttons v-for="(tool, index) in tools"
                                    v-bind:tool="tool"
                                    v-bind:index="index"
                                    v-bind:tool-search="toolSearch"
                                    v-bind:key="index">
                    </toolbar-buttons>
                </ul>
            </div>
        </div>
        <div class="col s10 primary-color-light" style="height: calc(100vh - 157px);">
            <div class="card toolbar z-depth-2 hoverable">
                <a href="#" onclick="finalizeRequest();" title="Save request as a Scheduled Task"><i class="material-icons">schedule</i></a>
                <a href="#" onclick="runRequest();" title="Send as an ad hoc request"><i class="material-icons">send</i></a>
                <a href="#" onclick="saveRequest();" title="Save Diagram"><i class="material-icons">save</i></a>
                <a href="#" onclick="clearDiagram();" title="New Diagram"><i class="material-icons">clear</i></a>
            </div>
            <div id="creatorContainer">
                <div class="designer-canvas jtk-demo-canvas canvas-wide flowchart-demo jtk-surface jtk-surface-nopan zoomItem" id="canvas">
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
    <div id="node_editor" class="primary-color-dark z-depth-2 node-editor" style="display: none;">
        <h4 class="white-text" style="font-size: 18px;">{{selectedNode.title}}</h4>
        <div id="nodeEditorContent" style="height: calc(100vh - 324px); overflow-y: scroll;">
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
        <div class="input-field col s12 white-text">
            <input v-model="attributes[attributeKey]" v-bind:id="'' + attributeKey + ''" type="text" class="validate white-text">
            <label class="white-text" v-bind:for="'' + attributeKey + ''">{{attributeKey}}</label>
        </div>
    </div>
    `
});

Vue.component('toolbar-buttons',
{
    props: ['tool', 'index', 'toolSearch'],
    template:   
    `
    <li v-if="toolSearch === '' || tool.name.toLowerCase().includes(toolSearch.toLowerCase())" v-bind:onclick="'addNode(\\'' + tool.name + '\\');'" v-bind:title="tool.tooltip" style="border-bottom: 1px solid #4a6572; cursor: pointer; text-transform: capitalize;"><i class="material-icons">{{tool.icon}}</i> {{tool.name.replace( /([A-Z])/g, " $1" )}}</li>
    `
});