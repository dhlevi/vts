Vue.component('dashboard',
{
    props: [],
    data: function () 
    {
        return {};
    },
    template:   
    `
    <div class="container row">
        <div class="col s12">
            <div class="card primary-color-dark hoverable">
                <div class="card-content white-text dashboard-card">
                    <span class="card-title">Projects</span>
                    <p>A Project is a request that has been created, but not yet submitted.
                       Projects will be persisted until manually deleted, and can be edited and
                       re-run as a request, or saved as a scheduled task, at any time.
                    </p>
                </div>
                <div class="card-action">
                    <a href="#" onclick="app.tabSwitch('projects')">Manage</a>
                </div>
            </div>
        </div>
        <div class="col s12">
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
        </div>
    </div>
    `
});