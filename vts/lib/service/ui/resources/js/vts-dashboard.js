function buildDashboard()
{
    buildEngineChart();
    buildRequestCountChart();
    buildTaskNotification();
}

function buildTaskNotification()
{
    // display next running task on dashboard
    // overwrite <div id="nextTask"></div>
    $.ajax
    ({
        url: serviceUrl + 'Requests?tasks=true',
        type: "get",
        dataType: 'json',
        contentType:'application/json',
        success: function (results)
        {
            let list = '<ul class="collection">';
            if (results && results.length > 0)
            {
                results.forEach(request =>
                {
                    let timeRemainingMessage = '';
                    // time remaining, in seconds
                    let timeRemaining = (new Date(request.nextRunTime).getTime() - new Date().getTime()) / 1000;

                    // create a nice message
                    if (timeRemaining > 86400) timeRemainingMessage =  Math.floor(timeRemaining / 86400) + ' Days';
                    else if (timeRemaining > 3600) timeRemainingMessage = Math.floor(timeRemaining / 3600) + ' hours';
                    else if (timeRemaining > 60) timeRemainingMessage = Math.floor(timeRemaining / 60) + ' minutes';
                    else timeRemainingMessage = Math.floor(timeRemaining) > 0 ? Math.floor(timeRemaining) + ' seconds' : 'now';

                    list += '<li class="collection-item request-item"><span>' + request.name + '</span> <span style="color: lightgray; font-style: italic; display: block; float: right">(' + timeRemainingMessage + ')</span></li>';
                });
            }
            else
            {
                list += '<li>No Scheduled Tasks!</li>';
            }

            list += '</ul>';

            $('#nextTask').empty(); 
            $('#nextTask').append(list); //2020-05-22T21:41:02.558Z
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Could not get current request counts'});
        }
    });
}

function buildRequestCountChart()
{
    $.ajax
    ({
        url: serviceUrl + 'Requests/Counts',
        type: "get",
        dataType: 'json',
        contentType:'application/json',
        success: function (results)
        {
            app.requestCounts = results;
            if(app.currentTab === 'dashboard')
            {
                let data = 
                {
                    labels: ['submitted', 'queued', 'running', 'complete', 'failed'],
                    series: [results[1], results[2], results[3], results[4], results[5]]
                };
                  
                let options = 
                {
                    labelInterpolationFnc: function(value) 
                    {
                        return value[0]
                    }
                };

                let responsiveOptions = 
                [
                    ['screen and (min-width: 640px)', {
                      chartPadding: 30,
                      labelOffset: 100,
                      labelDirection: 'explode',
                      labelInterpolationFnc: function(value) 
                      {
                        return value;
                      }
                    }],
                    ['screen and (min-width: 1024px)', {
                      labelOffset: 80,
                      chartPadding: 20
                    }]
                ];
                  
                new Chartist.Pie('#requestCountChart', data, options, responsiveOptions);
            }
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Could not get current request counts'});
        }
    });
}

function buildEngineChart()
{
    $.ajax
	({
		url: serviceUrl + 'Engines', // get all engines
		type: "get",
		success: function (engines)
		{
            app.engines = engines;
            // pull updated stats from engine routes
            app.engines.forEach(engine =>
            {
                if (engine.route && engine.route.startsWith('http'))
                {
                    $.ajax
                    ({
                        url: engine.route,
                        type: "get",
                        success: function (engineData)
                        {
                            engine['runningRequests'] = engineData.runningRequests;
                            engine['queuedRequests']  = engineData.queuedRequests;
                            engine['uptime']          = engineData.uptime;
                            engine['totalRequests']   = engineData.totalRequests;
                            engine['maxMemory']       = engineData.maxMemory;
                            engine['usedMemory']      = engineData.usedMemory;
                            engine['alive']           = true;
                        },
                        error: function (error)
                        {
                            engine['alive'] = false;
                        }
                    });
                }
            });

            // append engine stats, update dashboard
            if(app.currentTab === 'dashboard')
            {
                let data = 
                {
                    labels: [],
                    series: []
                };

                // loop through engines, update the data arrays
                engines.forEach(engine =>
                {
                    data.labels.push(engine.id);
                    
                    let requestData = engine.queuedRequests ? engine.queuedRequests : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    data.series.push(requestData);
                });

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

                new Chartist.Line('#enginesChart', data, options);

                let message = 'There are no engines running. Fire some up!'
                
                if (engines && engines.length === 1 )
                {
                    message = 'There is 1 engine running.';
                }
                else if (engines && engines.length > 1)
                {
                    message = 'There are ' + engines.length + ' engines running'
                }

                $('#runningEnginesMessage').text(message);
            }
		},
		error: function (status)
		{   
            M.toast({ html: 'ERROR: Engines could not be retrieved from the service.'});
		}
    });
}