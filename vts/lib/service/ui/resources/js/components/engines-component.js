Vue.component('engines',
{
    props: ['engines'],
    data: function () 
    {
        return {};
    },
    updated: function () 
    {
        this.$nextTick(function () 
        {
            M.AutoInit(); 
            M.updateTextFields();
        });
    },
    template:   
    `
    <div class="container row">
        <div class="col s12">
            <engine-panel v-for="(engine, index) in engines"
                        v-bind:engine="engine"
                        v-bind:index="index"
                        v-bind:key="index">
            </engine-panel>
        </div>
    </div>
    `
});


Vue.component('engine-panel',
{
    props: ['engine', 'index'],
    data: function () 
    {
        return {};
    },
    updated: function () 
    {
        this.$nextTick(function () 
        {
            let options = 
            {
                showPoint: false,
                lineSmooth: true,
                axisX: 
                {
                    showGrid: true,
                    showLabel: false
                },
                axisY: 
                {
                    offset: 60,
                    labelInterpolationFnc: function(value) 
                    {
                        return value + ' reqs';
                    }
                }
            };

            let lineData =
            {
                labels: ['Queued Requests', 'Running Requests'],
                series: [this.engine.queuedRequests ? this.engine.queuedRequests : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], this.engine.runningRequests ? this.engine.runningRequests : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
            };

            new Chartist.Line('#engine_' + this.index + '_Chart', lineData, options);
            new Chartist.Pie('#engine_' + this.index + '_memchart', {
                label: ['Used Memory', 'Total Memory'],
                series: [this.engine.usedMemory, this.engine.maxMemory - this.engine.usedMemory]
              }, {
                donut: true,
                donutWidth: 30,
                startAngle: 270,
                total: this.engine.maxMemory,
                showLabel: true
              });
        })
    },
    template:   
    `
    <div class="card primary-color-dark hoverable">
        <div class="card-content white-text">
            <span class="card-title">{{engine.id}} | <span style="color: grey; font-size: 15px;">{{engine._id}}</span></span>
            <div class="row tag-bar" style="margin-bottom: 5px;" v-bind:onclick="'$(\\'#engine_' + index + '\\').slideToggle();'">
            <p v-if="!engine.alive && engine.route"><span class="chip red">Offline</span></p>
            <p v-if="!engine.route || !engine.route.startsWith('http')"><span class="chip red">Unregistered</span></p>
            <p v-if="engine.route && engine.route.startsWith('http') && engine.alive">
                    <i style="margin: 4px; position: absolute;" class="material-icons">menu</i>
                    <span style="margin-left: 35px;" v-if="engine.currentState === 'Running' && engine.requestedState === 'Running'" class="chip green">Running</span>
                    <span style="margin-left: 35px;" v-if="engine.currentState === 'Stopped' && engine.requestedState === 'Stopped'" class="chip red">Stopped</span>
                    <span style="margin-left: 35px;" v-if="engine.currentState === 'Running' && engine.requestedState === 'Stopped'" class="chip yellow">Stopping</span>
                    <span style="margin-left: 35px;" v-if="engine.currentState === 'Stopped' && engine.requestedState === 'Running'" class="chip yellow">Starting</span>
                    <span style="margin-left: 35px;" v-if="engine.currentState === 'Flushing'" class="chip">Flushing Queues</span>
                    <span v-if="engine.acceptsRequests" class="chip">Ad-Hoc Requests supported</span>
                    <span v-if="engine.acceptsScheduledTasks" class="chip">Scheduled Tasks supported</span>
                    <span class="chip">{{engine.totalRequests}} request over {{engine.uptime}} Mins</span>
                </p>
            </div>
            <div v-bind:id="'engine_' + index" style="display: none;">
            <p v-if="engine.route && engine.route.startsWith('http')">Route to engine: <a v-bind:href="engine.route" target="_blank">{{engine.route}}</a></p>
                <div class="row">
                    <div class="col s9">
                        <p>Engine Request Status:</p>
                        <div class="engine" v-bind:id="'engine_' + index + '_Chart'"></div>
                    </div>
                    <div class="col s3">
                        <p style="text-align: center;">Memory Usage:</p>
                        <div class="mem-chart" v-bind:id="'engine_' + index + '_memchart'"></div>
                    </div>
                </div>
                <div class="row">
                    <div class="col s6">
                        <p>Recent Messages</p>
                        <ul id="messageList" class="collection" style="height: 400px; overflow: auto;">
                            <view-messages v-for="(message, index) in engine.messages"
                                        v-bind:message="message"
                                        v-bind:index="index"
                                        v-bind:key="index">
                            </view-messages>
                        </ul>
                    </div>
                    <div class="col s6">
                        <p>Recent History</p>
                        <ul id="historyList" class="collection" style="height: 400px; overflow: auto;">
                            <view-log-messages v-for="(log, index) in engine.metadata.history"
                                        v-bind:log="log"
                                        v-bind:index="index"
                                        v-bind:key="index">
                            </view-log-messages>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="card-action">
            <a href="#" v-bind:onclick="'startupEngine(\\'' + engine._id + '\\')'" title="Start Engine" v-if="engine.currentState === 'Stopped' && engine.requestedState === 'Stopped'"><i class="material-icons red-text">power_settings_new</i></a>
            <a href="#" v-bind:onclick="'shutdownEngine(\\'' + engine._id + '\\')'" title="Stop Engine" v-if="engine.currentState === 'Running' && engine.requestedState === 'Running'"><i class="material-icons green-text">power_settings_new</i></a>
            <a title="Wait..." v-if="(engine.currentState === 'Stopped' && engine.requestedState === 'Running') || (engine.currentState === 'Running' && engine.requestedState === 'Stopped')"><i class="material-icons grey-text">power_settings_new</i></a>
            <a href="#" v-bind:onclick="'flushEngine(\\'' + engine._id + '\\')'" title="Flush Engine Queue"><i class="material-icons orange-text">clear_all</i></a>
            <a href="#" v-bind:onclick="'editEngine(\\'' + engine._id + '\\')'" title="Edit"><i class="material-icons orange-text">edit</i></a>
            <a href="#" v-bind:onclick="'deleteEngine(\\'' + engine._id + '\\')'" title="Delete"><i class="material-icons orange-text">delete</i></a>
        </div>
    </div>
    `
});

Vue.component('view-messages',
{
    props: ['message', 'index'],
    template:   
    `
    <li class="collection-item" style="min-height: 60px;">
        <p style="padding: 0px; margin: 0px; font-size: 10px; font-weight: bold;">From {{message.sender}} on {{message.timestamp.split('T')[0]}} at {{message.timestamp.split('T')[1].split('.')[0]}}</span></p>
        <p style="padding: 0px; margin: 0px; font-size: 14px;">{{message.message}}</p>
    </li>
    `
});

Vue.component('view-log-messages',
{
    props: ['log', 'index'],
    template:   
    `
    <li class="collection-item" style="min-height: 60px;">
        <p style="padding: 0px; margin: 0px; font-size: 10px; font-weight: bold;">From {{log.user}} on {{log.date.split('T')[0]}} at {{log.date.split('T')[1].split('.')[0]}}</span></p>
        <p style="padding: 0px; margin: 0px; font-size: 14px;">{{log.event}}</p>
    </li>
    `
});