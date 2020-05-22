Vue.component('tasks',
{
    props: ['tasks'],
    data: function () 
    {
        return {
            requestSearch : ''
        };
    },
    updated: function () 
    {
        this.$nextTick(function () 
        {
            loadRequests(this.requestSearch, null, true);
        });
    },
    template:   
    `
    <div class="container row">
        <div class="col s12">
            <div class="card primary-color-dark">
                <div class="card-content white-text" style="height: calc(100vh - 110px); overflow: auto;">
                    <span class="card-title">Request Status</span>
                    <div class="row tag-bar" style="margin-bottom: 5px;">
                        <div class="input-field col s10 white-text">
                            <input id="search" v-model="requestSearch" type="text" class="validate white-text">
                            <label class="white-text" for="search">Search</label>
                        </div>
                        <div class="col s2">
                            <a href="#" v-bind:onclick="'loadRequests(\\'' + requestSearch + '\\');'" class="btn green white-text" style="float: left; margin-top: 22px;">Search</a>
                        </div>
                    </div>
                    <div>
                        <ul>
                            <view-requests v-for="(request, index) in tasks"
                                           v-bind:request="request"
                                           v-bind:index="index"
                                           v-bind:key="index">
                            </view-requests>
                        </ul>
                   </div>
                </div>
            </div>
        </div>
    </div>
    `
});