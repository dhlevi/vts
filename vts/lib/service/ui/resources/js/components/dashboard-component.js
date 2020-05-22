Vue.component('dashboard',
{
    props: [],
    data: function () 
    {
        return {};
    },
    template:   
    `
    <div class=" container row">
        <div class="col s12 l6">
            <div class="card primary-color-dark hoverable">
                <div class="card-content white-text dashboard-card">
                    <span class="card-title">VTS Engines</span>
                    <p>Engines Request Status:</p>
                    <div id="enginesChart"></div>
                    <p id="runningEnginesMessage">There are X engines running</p>
                </div>
                <div class="card-action">
                    <a href="#" onclick="app.tabSwitch('engines')">Manage</a>
                    <a href="#" onclick="shutdownAll()">Stop All</a>
                    <a href="#" onclick="startupAll()">Start All</a>
                </div>
            </div>
            <div class="card primary-color-dark hoverable">
                <div class="card-content white-text dashboard-card">
                    <span class="card-title">Logs / Messages</span>
                    <p>From here you can see the last 10 or so log messages.
                        Just a snapshot of course. Purging will dump log files
                        and option to view detailed logs/search logs
                    </p>
                </div>
                <div class="card-action">
                    <a href="#">View Details</a>
                    <a href="#">Purge</a>
                </div>
            </div>
        </div>
        <div class="col s12 l6">
            <div class="card primary-color-dark hoverable">
                <div class="card-content white-text dashboard-card">
                    <span class="card-title">Requests</span>
                    <div id="requestCountChart"></div>
                </div>
                <div class="card-action">
                    <a href="#" onclick="app.tabSwitch('designer')">Create</a>
                    <a href="#" onclick="app.tabSwitch('requests')">Manage</a>
                </div>
            </div>
            <div class="card primary-color-dark hoverable">
                <div class="card-content white-text dashboard-card">
                    <span class="card-title">Scheduled Tasks</span>
                    <p>Next Up:</p>
                    <div id="nextTask"></div>
                </div>
                <div class="card-action">
                    <a href="#" onclick="app.tabSwitch('designer')">Create</a>
                    <a href="#" onclick="app.tabSwitch('tasks')">Manage</a>
                </div>
            </div>
        </div>
    </div>
    `
});