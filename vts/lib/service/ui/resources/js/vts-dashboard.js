function buildDashboard()
{
    buildEngineChart();
    buildRequestCountChart();
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
                    
                    let requestData = engine.runningRequests ? engine.runningRequests : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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
                    'There are ' + engines.length + ' engines running'
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