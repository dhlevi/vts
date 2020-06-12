let serviceUrl = "../";
let serviceUnavailable = false;
let refresh = true;

let app = new Vue(
{
    el: '#content',
    data: 
    {
        engines: [],
        requests: [],
        requestCounts: [0, 0, 0, 0, 0],
        tasks: [],
        projects: [],
        selectedEngine: { id: '' },
        selectedTask: { id: '' },
        toolSearch: '',
        request: 
        {  
            priority: 3,
            name: 'New Request',
            public: true,
            processors: [],
            status: 'Submitted',
            scheduledTask: false,
            interval: 1,
            intervalUnit: 'Minutes',
            messages: [],
            tags: [],
            cachePurged: false,
            engine: ''
        },
        selectedNode: { title: '' },
        lastTab: 'dashboard',
        currentTab: 'dashboard',
        tabs: ['dashboard', 'engines', 'edit-engine', 'requests', 'tasks', 'edit-task', 'projects', 'edit-project', 'designer', 'map-viewer', 'about'],
        componentKey: 0,
        tools: [{ name: 'httpReader', tooltip: 'HTTP Reader (GeoJSON, KML, KMZ, GML, Shape(root level zip), FGDB(root level zip))', icon: 'http' },
                { name: 'fileReader', tooltip: 'File Reader (GeoJSON, KML, KMZ, GML, Shape(root level zip), FGDB(root level zip))', icon: 'all_inbox' },
                { name: 'dbReader', tooltip: 'Database Reader (Oracle, Postgis, Couch, Mongo, MS Sql)', icon: 'storage' },
                { name: 'randomReader', tooltip: 'Creates a random point, line or polygon feature to start a process', icon: 'storage' },
                // processors
                { name: 'projector', tooltip: 'Reproject feature geometry', icon: 'scatter_plot' },
                { name: 'cleanCoords', tooltip: 'Remove redundant coordinates', icon: 'border_style' },
                { name: 'buffer', tooltip: 'Buffer features', icon: 'settings_overscan' },
                { name: 'hullCreator', tooltip: 'Create a convex or concave hull from features', icon: 'filter_tilt_shift' },
                { name: 'difference', tooltip: 'Clip the difference between two feature sets', icon: 'flip_to_back' },
                { name: 'dissolve', tooltip: 'Dissolve all features', icon: 'donut_small' },
                { name: 'intersect', tooltip: 'Intersect all features by another feature set', icon: 'branding_watermark' },
                { name: 'simplify', tooltip: 'Simplify all features', icon: 'timeline' },
                { name: 'tesselate', tooltip: 'Tesselate all features', icon: 'details' },
                { name: 'union', tooltip: 'Union all features', icon: 'link' },
                { name: 'scale', tooltip: 'Scale all features', icon: 'aspect_ratio' },
                { name: 'rotate', tooltip: 'Rotate all features', icon: 'loop' },
                { name: 'translate', tooltip: 'Translate all features', icon: 'track_changes' },
                { name: 'voronoi', tooltip: 'Create a voronoi diagram from the feature points', icon: 'grain' },
                { name: 'merge', tooltip: 'Combine features into a multifeature geometry', icon: 'attach_file' },
                { name: 'flatten', tooltip: 'Merge multi features into single feature geometry', icon: 'call_merge' },
                { name: 'explode', tooltip: 'Convert all features coordinates into points', icon: 'border_clear' },
                { name: 'flip', tooltip: 'Flips all features xy coords', icon: 'flip' },
                { name: 'reducePrecision', tooltip: 'Truncates the precision of coordinates', icon: 'sort' },
                { name: 'bezierCurve', tooltip: 'Creates a bezier curve from a linestring', icon: 'gesture' },
                { name: 'lineToPolygon', tooltip: 'Creates a polygon from a linestring', icon: 'crop' },
                { name: 'polygonToLine', tooltip: 'Converts a polygon into a linestring', icon: 'show_chart' },
                { name: 'lineChunk', tooltip: 'Breaks a linestring into chunks', icon: 'tune' },
                { name: 'unkink', tooltip: 'Breaks self-intersecting polygons into multipolygon features', icon: 'unfold_less' },
                { name: 'tin', tooltip: 'Creates a TIN (triangulated irregular network) from a set of points', icon: 'sports_soccer' },
                { name: 'donutExtractor', tooltip: 'Creates a new set of data containing extracted donuts', icon: 'vignette' },
                { name: 'donutRemover', tooltip: 'Removes all donuts from polygons', icon: 'wb_iridescent' },
                // measurement
                { name: 'along', tooltip: 'Creates a point as a new feature at a given distance along a line', icon: 'share' },
                { name: 'area', tooltip: 'Gets the area of a feature', icon: 'texture' },
                { name: 'boundingBox', tooltip: 'Creates a bounding box encompassing all features', icon: 'panorama_vertical' },
                { name: 'center', tooltip: 'Finds the center of a feature', icon: 'center_focus_strong' },
                { name: 'centerOfMass', tooltip: 'Finds the center of mass for a feature', icon: 'center_focus_weak' },
                { name: 'centerAll', tooltip: 'Finds the center of all features', icon: 'all_out' },
                { name: 'centerOfMassAll', tooltip: 'Finds the center of mass for all features', icon: 'toll' },
                { name: 'centroid', tooltip: 'Finds the centroid of a feature by taking the mean of all vertices', icon: 'my_location' },
                { name: 'destination', tooltip: 'Given a distance and bearing, finds the destination point for all point features', icon: 'place' },
                { name: 'length', tooltip: 'Calculates the length of a feature', icon: 'square_foot' },
                // array operators
                { name: 'filter', tooltip: 'Filter features non-spatially by an attribute', icon: 'filter_list'},
                { name: 'spatialFilter', tooltip: 'Filter features spatially by their type', icon: 'filter_b_and_w'},
                { name: 'spatialRelationFilter', tooltip: 'Filter features spatially by their relation', icon: 'filter'},
                // attribute tools
                { name: 'attributeCreator', tooltip: 'Add an attribute to all features', icon: 'title'},
                { name: 'attributeRemover', tooltip: 'Remove an attribute from all features', icon: 'format_clear'},
                { name: 'attributeRenamer', tooltip: 'Rename an attribute from all features', icon: 'text_fields'},
                { name: 'attributeKeeper', tooltip: 'Keep/Create only the requested comma separated list of attributes', icon: 'menu_open'},
                { name: 'attributeCalculator', tooltip: 'Add an attribute that contains a calculation', icon: 'functions'},
                { name: 'timestamper', tooltip: 'Timestamp all features', icon: 'av_timer'},
                { name: 'counter', tooltip: 'Counts all features, and saves the count in a property', icon: 'exposure_plus_1' },
                { name: 'sqlCaller', tooltip: 'Execute a SQL query and append the resulting attributes to a feature', icon: 'nfc' },
                // special tools
                //{ name: 'logger', tooltip: 'Create a log message for all features', icon: ''},
                { name: 'featureHolder', tooltip: 'Holds features for merging datasets', icon: 'horizontal_split' },
                // writer
                { name: 'fileWriter', tooltip: 'Write results to a file (GeoJSON, KML, KMZ, CSV, WKT, GML, Shape(zip), FGDB(zip))', icon: 'publish' },
                { name: 'httpWriter', tooltip: 'Write results to an HTTP service', icon: 'backup' },
                { name: 'dbWriter', tooltip: 'Write results to a DB (Oracle, Postgis, Couch, Mongo, MS Sql)', icon: 'dns' },
                { name: 'cacheWriter', tooltip: 'Write results to the VTS cache and serve', icon: 'dns' }]
    },
    methods: 
    {
        tabSwitch: function (tab) 
        {
            // load engines should already be happening every 5 seconds.
            if (tab === 'designer')
            {
                refresh = false;
            }
            else
            {
                refresh = true;
            }

            if (tab === 'requests')
            {
                loadRequests(null, null, false);
            }
            else if (tab === 'tasks')
            {
                loadRequests(null, null, true);
            }
            else if (tab === 'projects')
            {
                loadRequests(null, 'Created', false);
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
        },
        getCurrentTab()
        {
            return this.currentTab;
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