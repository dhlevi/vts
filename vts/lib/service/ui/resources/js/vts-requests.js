function uuid() 
{
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) 
	{
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function loadRequests(text, status, tasks)
{
    let requestQuery = serviceUrl + 'Requests?tasks=' + tasks;

    if (text && text.length > 0)
    {
        requestQuery += '&text=' + text;
    }

    if (status && status.length > 0)
    {
        requestQuery += '&status=' + status;
    }

    $.ajax
    ({
        url: requestQuery,
        type: "get",
        dataType: 'json',
        contentType:'application/json',
        success: function (results)
        {
            if (tasks) app.tasks = results;
            else if (!tasks && status === 'Created') app.projects = results;
            else app.requests = results;
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Could not get current request counts'});
        }
    });
}

function saveProject(isTask, status)
{
    app.request.scheduledTask = isTask;

    if (isTask && app.request.interval < 1) {
        app.request.interval = 1;
    }
    
    app.request.status = status;
    app.request.name = app.request.name && app.request.name.length > 0 ? app.request.name : uuid();

    $.ajax
    ({
        url: serviceUrl + 'Requests' + (app.request._id && app.request._id.length > 0 ? '/' + app.request._id : ''),
        type: app.request._id && app.request._id.length > 0 ? 'put' : 'post',
        data: JSON.stringify(app.request),
        dataType: 'json',
        contentType:'application/json',
        crossDomain: true,
        withCredentials: true,
        success: function (result)
        {
            M.toast({ html: 'Saved!'});
            app.tabSwitch('designer');
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Request could not be saved. It may be invalid or the service is experiencing an error'});
        }
    });
}

function runRequest()
{
    app.request.scheduledTask = false;
    app.request.status = 'Submitted';
    app.request.name = uuid();
    app.request.messages = [];

    $.ajax
    ({
        url: serviceUrl + 'Requests',
        type: "post",
        data: JSON.stringify(app.request),
        dataType: 'json',
        contentType:'application/json',
        crossDomain: true,
        withCredentials: true,
        success: function (result)
        {
            M.toast({ html: 'Request submitted'});
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Request could not be submitted. It may be invalid or the service is experiencing an error'});
        }
    });
}

function editRequest(requestId)
{
    $.ajax
    ({
        url: serviceUrl + 'Requests/' + requestId,
        type: "get",
        dataType: 'json',
        contentType:'application/json',
        success: function (results)
        {
            app.request = results;
            app.tabSwitch('designer');
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Could not get current request counts'});
        }
    });
}

function viewOnMap(requestId)
{
    $.ajax
    ({
        url: serviceUrl + 'Requests/' + requestId,
        type: "get",
        dataType: 'json',
        contentType:'application/json',
        success: function (results)
        {
            app.request = results;
            app.tabSwitch('map-viewer');
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Could not get current request counts'});
        }
    });
}

function deleteRequest(requestId)
{
    $.ajax
    ({
        url: serviceUrl + 'Requests/' + requestId,
        type: "delete",
        crossDomain: true,
        withCredentials: true,
        success: function (result)
        {
            M.toast({ html: 'Request Deleted'});
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Request could not be deleted.'});
        }
    });
}