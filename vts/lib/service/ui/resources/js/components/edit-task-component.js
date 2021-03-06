Vue.component('edit-task',
{
    props: ['request'],
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
        <div class="card primary-color-dark">
            <div class="card-content white-text">
                <span class="card-title">{{request.name}} | <span style="color: grey; font-size: 15px;">{{request._id}}</span></span>
                <div class="row">
                    <div class="input-field col s6 white-text">
                        <input v-model="request.name" placeholder="Request Name" id="name" type="text" class="validate white-text">
                        <label class="white-text" for="name">Name</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6 white-text">
                        <input v-model="request.interval" placeholder="Interval" id="interval" type="text" class="validate white-text">
                        <label class="white-text" for="interval">Interval</label>
                    </div>
                </div>
                <div class="row">
                    <div class="col s6 white-text">
                        <label>interval Unit</label>
                        <select v-model="request.intervalUnit" class="browser-default">
                            <!-- option value="Seconds">Seconds</option -->
                            <option value="Minutes">Minutes</option>
                            <option value="Hours">Hours</option>
                            <option value="Days">Days</option>
                        </select>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12 white-text">
                        <input v-model="request.description" placeholder="Description" id="description" type="text" class="validate white-text">
                        <label class="white-text" for="description">Description</label>
                    </div>
                </div>
            </div>
            <div class="card-action">
                <a href="#" onclick="saveProject(true, 'Submitted');" title="Save"><i class="material-icons green-text">save</i></a>
                <a href="#" onclick="app.tabSwitch('designer');" title="Cancel"><i class="material-icons red-text">close</i></a>
            </div>
        </div>
    </div>
    `
});