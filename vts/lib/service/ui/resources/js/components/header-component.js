Vue.component('header-component',
{
    props: ['currentTab'],
    data: function () 
    {
        return {};
    },
    template:   
    `
    <div>
        <nav>
            <div class="row nav-wrapper primary-color-dark">
                <div class="col s12">
                    <a href="https://dhlevi.github.io/vts/" target="_blank" class="brand-logo">Vivid Topology Service</a>
                    <ul id="nav-mobile" class="right hide-on-med-and-down">
                        <li><a href="https://dhlevi.github.io/vts/documentation.html" target="_blank">Docs</a></li>
                        <li><a href="#" onclick="app.tabSwitch('about')">About</a></li>
                    </ul>
                </div>
            </div>
        </nav>
        <div class="menubar primary-color-dark">
          <a href="#" class="waves-effect waves-white btn-flat primary-color-dark" onclick="app.tabSwitch('dashboard')">Dashboard</a>
          <a href="#" class="waves-effect waves-white btn-flat primary-color-dark" onclick="app.tabSwitch('users')">User Management</a>
          <a href="#" class="waves-effect waves-white btn-flat primary-color-dark" onclick="app.tabSwitch('engines')">Engines</a>
          <a href="#" class="waves-effect waves-white btn-flat primary-color-dark" onclick="app.tabSwitch('requests')">Requests</a>
          <a href="#" class="waves-effect waves-white btn-flat primary-color-dark" onclick="app.tabSwitch('tasks')">Scheduled Tasks</a>
          <a href="#" class="waves-effect waves-white btn-flat primary-color-dark" onclick="app.tabSwitch('projects')">Projects</a>
          <a href="#" class="waves-effect waves-white btn-flat primary-color-dark" onclick="app.tabSwitch('designer')">Designer</a>
        </div>
    </div>
    `
});