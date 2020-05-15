Vue.component('requests',
{
    props: ['requests'],
    data: function () 
    {
        return {};
    },
    updated: function () 
    {
        this.$nextTick(function () 
        {
        });
    },
    template:   
    `
    <div class="row">
        <div class="col s12">
            <div class="card primary-color-dark">
                <div class="card-content white-text" style="height: calc(100vh - 110px); overflow: auto;">
                    <span class="card-title">Request Status</span>
                    <div class="row tag-bar" style="margin-bottom: 5px;">
                        a search bar should go here
                    </div>
                    <div>
                        show the requests in a list here
                        <ul>
                            <view-requests v-for="(request, index) in requests"
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

Vue.component('view-requests',
{
    props: ['request', 'index'],
    template:   
    `
    <li class="collection-item" style="min-height: 60px;">
        {{request.name}}
    </li>
    `
});