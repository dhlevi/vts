Vue.component('edit-engine',
{
    props: ['selectedEngine'],
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
    <div class="row">
        <div class="card primary-color-dark">
            <div class="card-content white-text">
                <span class="card-title">{{selectedEngine.id}} | <span style="color: grey; font-size: 15px;">{{selectedEngine._id}}</span></span>
                <div class="row">
                    <div class="input-field col s6 white-text">
                        <input v-model="selectedEngine.route" placeholder="Enter Engine URL" id="route" type="text" class="validate white-text">
                        <label class="white-text" for="route">Route</label>
                        <a href="#" onclick="testRoute();" class="btn green white-text">Test</a>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6 white-text">
                        <p>
                            <label>
                                <input type="checkbox" class="filled-in white-text" v-model="selectedEngine.acceptsRequests" />
                                <span class="white-text">Accepts Ad-Hoc Requests</span>
                            </label>
                        </p>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6 white-text">
                        <p>
                            <label>
                                <input type="checkbox" class="filled-in white-text" v-model="selectedEngine.acceptsScheduledTasks" />
                                <span class="white-text">Accepts Scheduled Tasks</span>
                            </label>
                        </p>
                    </div>
                </div>
            </div>
            <div class="card-action">
                <a href="#" onclick="saveEngine();" title="Save"><i class="material-icons green-text">save</i></a>
                <a href="#" onclick="refresh = true; app.tabSwitch('engines');" title="Cancel"><i class="material-icons red-text">close</i></a>
            </div>
        </div>
    </div>
    `
});