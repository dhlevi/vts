Vue.component('edit-user',
{
    props: ['selectedUser'],
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
                <span class="card-title">{{selectedUser.name}} | <span style="color: grey; font-size: 15px;">{{selectedUser._id}}</span></span>
                <div class="row">
                    <div class="input-field col s12 white-text">
                        <input v-model="selectedUser.name" placeholder="Enter User Name" id="name" type="text" class="validate white-text">
                        <label class="white-text" for="Name">Name</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12 white-text">
                        <input v-model="selectedUser.email" placeholder="Enter User Email Address" id="email" type="text" class="validate white-text">
                        <label class="white-text" for="email">E-Mail</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12 white-text">
                        <input v-model="selectedUser.password" placeholder="Enter User Password" id="password" type="password" class="validate white-text">
                        <label class="white-text" for="password">Password</label>
                    </div>
                </div>
                <div class="row" v-if="selectedUser.role === 'admin'">
                    <div class="col s6 white-text">
                        <label>Role</label>
                        <select v-model="selectedUser.role" class="browser-default">
                            <option value="public">Public</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="card-action">
                <a href="#" onclick="saveUser();" title="Save"><i class="material-icons green-text">save</i></a>
                <a href="#" onclick="refresh = true; app.tabSwitch('users');" title="Cancel"><i class="material-icons red-text">close</i></a>
            </div>
        </div>
    </div>
    `
});