Vue.component('designer',
{
    props: ['tools'],
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
    <div>
        <div id="toolbar" class="row">
            <div class="card toolbar z-depth-2 hoverable">
                <toolbar-buttons v-for="(tool, index) in tools"
                                 v-bind:tool="tool"
                                 v-bind:index="index"
                                 v-bind:key="index">
                </toolbar-buttons>
            </div>
        </div>
        <div class="row primary-color-light">
            <div id="creatorContainer">
                <div class="designer-canvas jtk-demo-canvas canvas-wide flowchart-demo jtk-surface jtk-surface-nopan zoomItem" id="canvas">
                </div>
            </div>
        </div>
    </div>
    `
});

Vue.component('toolbar-buttons',
{
    props: ['tool', 'index'],
    template:   
    `
    <a href="#" v-bind:onclick="'addNode(\\'' + tool.name + '\\');'" v-bind:title="tool.tooltip"><i class="material-icons">{{tool.icon}}</i></a>
    `
});