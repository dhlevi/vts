let serviceUrl = "../";
let serviceUnavailable = false;
let refresh = true;

let app = new Vue(
{
    el: '#content',
    data: 
    {
        engines: [],
        selectedEngine: { id: '' },
        request: 
        {  
            priority: 3,
            name: 'New Request',
            public: true,
            processors: [],
            status: 'Submitted',
            scheduledTask: false,
            interval: 0,
            intervalUnit: 'Seconds',
            messages: [],
            tags: [],
            cachePurged: false,
        },
        lastTab: 'dashboard',
        currentTab: 'dashboard',
        tabs: ['dashboard', 'engines', 'edit-engine', 'requests', 'tasks', 'logs', 'designer'],
        componentKey: 0,
        tools: [{ name: 'httpReader', tooltip: 'HTTP Reader (GeoJSON, KML, KMZ, CSV, WKT, GML, Shape(zip), FGDB(zip))', icon: 'http' },
                { name: 'fileReader', tooltip: 'HTTP Reader (GeoJSON, KML, KMZ, CSV, WKT, GML, Shape(zip), FGDB(zip))', icon: 'all_inbox' },
                { name: 'dbReader', tooltip: 'Database Reader (Oracle, Postgis, Couch, Mongo, MS Sql)', icon: 'storage' },
                { name: 'buffer', tooltip: 'Buffer features', icon: 'settings_overscan' },
                { name: 'cleanCoords', tooltip: 'Remove redundant coordinates', icon: 'border_style' }],
        self: this
    },
    methods: 
    {
        tabSwitch: function (tab) 
        {
            // load engines should already be happening every 5 seconds.
            if (this.currentTab === 'designer')
            {
                refresh = false;
            }
            else
            {
                refresh = true;
            }

            this.lastTab = this.currentTab;
            this.currentTab = tab;
        },
        forceRerender() 
        {
            // If a data component does not change, Vue won't trigger a render
            // if you need a force re-render of a page, but don't need to or
            // want to change data, increment the componentKey
            this.componentKey += 1;  
        }
    },
    computed: 
    {
        currentTabComponent: function () 
        {   
            this.componentKey += 1;
            return this.currentTab.toLowerCase();
        }
    },
    updated: function () 
    {
        this.$nextTick(function () 
        {
            M.AutoInit(); 
            M.updateTextFields();

            if (this.currentTab === 'designer') 
            {
                $("#canvas").empty();
                jsPlumb.empty("canvas");
                jsPlumb.revalidate("canvas");
                jsPlumb.reset()
                setupCanvas();
            };
        })
    }
});

$(document).ready(function()
{
    $('.materialboxed').materialbox();
    $('.sidenav').sidenav();
    
    M.AutoInit();

    setTimeout(statusCheck, 5000);
    buildDashboard();
});

function statusCheck()
{
    if (refresh)
    {
        $.ajax
        ({
            url: serviceUrl + 'Ping',
            type: "get",
            success: function (result)
            {
                if (serviceUnavailable)
                {
                    M.toast({ html: 'Service is back up and running!'});
                }

                serviceUnavailable = false;
                buildDashboard();
            },
            error: function (status)
            {   
                if (!serviceUnavailable)
                {
                    M.toast({ html: 'Service unavailable. Some functionality may not work in offline mode.'});
                }

                serviceUnavailable = true;
            }
        });
    }

    setTimeout(statusCheck, 5000);
}