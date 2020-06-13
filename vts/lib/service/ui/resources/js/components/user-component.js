Vue.component('users',
{
    props: ['users'],
    updated: function () 
    {
        this.$nextTick(function () 
        {
            loadUsers();
        });
    },
    template:   
    `
    <div class="container row">
        <div class="col s12">
            <div class="card primary-color-dark">
                <div class="card-content white-text" style="height: calc(100vh - 150px); overflow: auto;">
                    <span class="card-title">Users</span>
                    <div class="row tag-bar" style="margin-bottom: 5px;">
                        <a href="#" onclick="createUser();" class="btn green white-text" style="float: left; margin-top: 22px;">Add User</a>
                    </div>
                    <div>
                        <ul>
                            <view-users v-for="(user, index) in users"
                                           v-bind:user="user"
                                           v-bind:index="index"
                                           v-bind:key="index">
                            </view-users>
                        </ul>
                   </div>
                </div>
            </div>
        </div>
    </div>
    `
});

Vue.component('view-users',
{
    props: ['user', 'index'],
    template:   
    `
    <li class="collection-item request-item" style="min-height: 60px;">
        <i v-if="user.role === 'public'" class="material-icons circle blue">account_circle</i>
        <i v-else class="material-icons circle red">account_circle</i>
        <a href="#!" v-bind:onclick="'deleteUser(\\'' + user._id + '\\')'" class="secondary-content"><i class="material-icons white-text">close</i></a>
        <a href="#!" v-bind:onclick="'editUser(\\'' + user._id + '\\')'" class="secondary-content"><i class="material-icons white-text">edit</i></a>
        
        <span class="title" style="font-weight: bold;">{{user.name}}</span>
        <p style="padding: 0px; margin: 0px; font-size: 10px;">EMail: {{user.email}} | Role {{user.role}}</p>
    </li>
    `
});