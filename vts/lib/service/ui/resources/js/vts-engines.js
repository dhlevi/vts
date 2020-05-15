function shutdownAll()
{
    app.engines.forEach(engine => 
    {
        shutdownEngine(engine._id);
    });
}

function startupAll()
{
    app.engines.forEach(engine => 
    {
        startupEngine(engine._id);
    });
}

function shutdownEngine(engine)
{
    $.ajax
	({
		url: serviceUrl + 'Engines/' + engine + '/Stop',
		type: "put",
		success: function (engines)
		{
            M.toast({ html: 'The Engine "' + engines.id + '" has been asked to shut down. Please wait...'});
        },
        error: function (status)
		{   
            M.toast({ html: 'ERROR: Engine could not be retrieved from the service.'});
		}
    });
}

function startupEngine(engine)
{
    $.ajax
	({
		url: serviceUrl + 'Engines/' + engine + '/Start',
		type: "put",
		success: function (engine)
		{
            M.toast({ html: 'The Engine "' + engine.id + '" has been asked to start up. Please wait...'});
        },
        error: function (status)
		{   
            M.toast({ html: 'ERROR: Engine could not be retrieved from the service.'});
		}
    });
}

function flushEngine(engine)
{
    $.ajax
	({
		url: serviceUrl + 'Engines/' + engine + '/Flush',
		type: "put",
		success: function (engines)
		{
            M.toast({ html: 'The Engine queue flush was requested...'});
        },
        error: function (status)
		{   
            M.toast({ html: 'ERROR: Engine could not be retrieved from the service.'});
		}
    });
}

function editEngine(engineId)
{
    // stop update spinner
    refresh = false;

    // get engine
    $.ajax
	({
		url: serviceUrl + 'Engines/' + engineId,
		type: "get",
		success: function (engine)
		{
            app.selectedEngine = engine;
            app.tabSwitch('edit-engine');
        },
        error: function (status)
		{   
            M.toast({ html: 'ERROR: Engine could not be retrieved from the service.'});
            refresh = true;
		}
    });
}

function testRoute()
{
    $.ajax
    ({
        url: app.selectedEngine.route,
        type: "get",
        dataType: 'json',
        contentType:'application/json',
        crossDomain: true,
        withCredentials: true,
        success: function (engine)
        {
            M.toast({ html: 'Engine found at route ' + app.selectedEngine.route });
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Test failed. Engine could not be accessed.'});
        }
    });
}
function saveEngine()
{
    $.ajax
    ({
        url: serviceUrl + 'Engines/' + app.selectedEngine._id,
        type: "put",
        data: JSON.stringify(app.selectedEngine),
        dataType: 'json',
        contentType:'application/json',
        crossDomain: true,
        withCredentials: true,
        success: function (engine)
        {
            M.toast({ html: 'Engine "' + engine.id + '" updated'});
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Engine could not be saved.'});
        }
    });

    refresh = true;
    app.tabSwitch('engines');
}

function deleteEngine(engine)
{
    $.ajax
	({
		url: serviceUrl + 'Engines/' + engine,
		type: "delete",
		success: function (engines)
		{
            M.toast({ html: 'The Engine "' + engines.id + '" registration has been deleted. To recreate it, restart your engine container'});
        },
        error: function (status)
		{   
            M.toast({ html: 'ERROR: Engine could not be retrieved from the service.'});
		}
    });
}