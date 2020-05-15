function buildDashboard()
{
    buildEngineChart();
}

function buildEngineChart()
{
    // call the API, get the engines and thier current status
    // only engines with a active route can be tracked

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

                // test data
                //let data = 
                //{
                //    labels: ['Engine1', 'Engine2', 'Engine3'],
                //    series: [
                //    [12, 4, 6, 17, 15, 10, 12, 5, 33, 12],
                //    [13, 12, 19, 15, 14, 16, 5, 4, 3, 7],
                //    [12, 11, 3, 4, 2, 0, 0, 5, 2, 1]
                //    ]
                //};

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