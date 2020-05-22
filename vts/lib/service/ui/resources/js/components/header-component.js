Vue.component('header-component',
{
    props: [],
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
                    <a href="#" data-target="slide-out" class="sidenav-trigger" style="display: block;">
                        <i class="material-icons">menu</i>
                    </a>
                    <a href="index.html" class="brand-logo">Vivid Topology Service</a>
                    <ul id="nav-mobile" class="right hide-on-med-and-down">
                        <li><a href="#">Docs</a></li>
                        <li><a href="#">About</a></li>
                    </ul>
                </div>
            </div>
        </nav>
        <ul id="slide-out" class="sidenav primary-color-dark">
            <li>
                <div class="user-view">
                    <div class="background">
                        <img src="">
                    </div>
                    <a href="#user"><img class="circle" src=""></a>
                    <a href="#name"><span class="white-text name">John Doe</span></a>
                    <a href="#email"><span class="white-text email">jdandturk@gmail.com</span></a>
                </div>
            </li>
            <li><a class="subheader">Engines</a></li>
            <li><a href="#" onclick="app.tabSwitch('engines')"><i class="material-icons white-text">settings</i>Manage Engines</a></li>
            <li><div class="divider"></div></li>
            <li><a class="subheader">Requests</a></li>
            <li><a href="#" onclick="app.tabSwitch('designer')"><i class="material-icons white-text">brush</i>Workflow Designer</a></li>
            <li><a href="#" onclick="app.tabSwitch('requests')"><i class="material-icons white-text">send</i>View Requests</a></li>
            <li><a href="#" onclick="app.tabSwitch('tasks')"><i class="material-icons white-text">schedule</i>View Scheduled Tasks</a></li>
        </ul>
    </div>
    `
});