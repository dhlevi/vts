function uuid() 
{
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) 
	{
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function loadRequests()
{
    $.ajax
    ({
        url: serviceUrl + 'Requests',
        type: "get",
        dataType: 'json',
        contentType:'application/json',
        success: function (results)
        {
            app.requests = results;
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Could not get current request counts'});
        }
    });
}

function finalizeRequest()
{

}

function runRequest()
{
    app.request.scheduledTask = false;
    app.request.status = 'Submitted';
    app.request.name = uuid();

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