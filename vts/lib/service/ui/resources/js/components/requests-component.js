Vue.component('requests',
{
    props: ['requests'],
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
            loadRequests(this.requestSearch, null, false);
        });
    },
    template:   
    `
    <div class="container row">
        <div class="col s12">
            <div class="card primary-color-dark">
                <div class="card-content white-text" style="height: calc(100vh - 150px); overflow: auto;">
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
    <li class="collection-item request-item" style="min-height: 60px;">
        <i v-if="request.status === 'Created'" class="material-icons circle blue">check_circle_outline</i>
        <i v-if="request.status === 'Submitted'" class="material-icons circle yellow">forward</i>
        <i v-if="request.status === 'Queued'" class="material-icons circle yellow">highlight_off</i>
        <i v-if="request.status === 'In Progress'" class="material-icons circle yellow">settings</i>
        <i v-if="request.status === 'Completed'" class="material-icons circle green">sentiment_satisfied_alt</i>
        <i v-if="request.status === 'Failed'" class="material-icons circle red">sms_failed</i>

        <a v-if="request.status !=='Created'" href="#!" v-bind:onclick="'viewOnMap(\\'' + request._id + '\\')'" class="secondary-content"><i class="material-icons white-text">map</i></a>
        <a href="#!" v-bind:onclick="'deleteRequest(\\'' + request._id + '\\')'" class="secondary-content"><i class="material-icons white-text">close</i></a>
        <a href="#!" v-bind:onclick="'editRequest(\\'' + request._id + '\\')'" class="secondary-content"><i class="material-icons white-text">edit</i></a>
        <a v-if="request.status !=='Created'" href="#!" v-bind:onclick="'$(\\'#logs_' + index + '\\').slideToggle();'" class="secondary-content"><i class="material-icons white-text">textsms</i></a>
        <span class="title" style="font-weight: bold;">{{request.name}}</span>
        <p style="padding: 0px; margin: 0px; font-size: 10px;">Engine: {{request.engine}} | Submitted by {{request.metadata.createUser}} | Status: {{request.status}}</p>
        <p v-if="request.description" style="padding: 0px; margin: 0px; font-size: 10px;">{{request.description}}</p>
        <ul v-bind:id="'logs_' + index" class="collection" style="display: none; max-height: 400px; overflow: auto;">
            <view-messages v-for="(message, index) in request.messages"
                           v-bind:message="message"
                           v-bind:index="index"
                           v-bind:key="index">
            </view-messages>
        </ul>
    </li>
    `
});