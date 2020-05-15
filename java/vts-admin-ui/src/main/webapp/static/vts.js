var serviceUrl = "../";
var requestIds = [];
var taskIds = [];
var projectIds = [];
var engineIds = [];

var user =
{
	name: "Not Logged In",
	email: "",
	role: "user",
	favoriteProjects: []
};

function login(user, password)
{
	$('#userNameInput').val('');
	$('#userPasswordInput').val('');

	$.ajax
	({
		url: serviceUrl + "/Admin/Users/Login",
		type: 'post',
		dataType: 'json',
		contentType:'application/json',
		success: function (loginData)
		{
			$('#userNameLabel').text(loginData.name);

			user = loginData;

			M.toast({html: 'Welcome ' + user.name + '!'});
		},
		error: function (status)
		{
			M.toast({html: 'Failed to log in: Status: ' + status.status + ' Message: ' + status.statusText});
		}
	});
}

function toggleFavorite(div)
{
	var fav = $("#" + div).text();
	if(fav == "favorite") $("#" + div).text("favorite_border");
	else $("#" + div).text("favorite");
}

function togglePanels(id)
{
	$('#projectPanels').hide();
	$('#logPanel').hide();
	$('#defaultPanel').hide();
	$('#requestPanels').hide();
	$('#taskPanels').hide();
	$('#creatorPanel').hide()
	$('#enginePanels').hide()

	$('#' + id).show()
}

function serviceUpdate()
{
	serviceHealth();
	loadRunningJobs(false);
	loadLogs();
	loadProjects();
	loadEngines();
}

function loadEngines()
{
	$.ajax
	({
		url: serviceUrl + "/Admin/Engines",
		type: 'get',
		dataType: 'json',
		contentType:'application/json',
		success: function (engineData)
		{
			var ids = [];
			for (var i in engineData)
			{
				ids.push(engineData[i].engineID);
			}

			// update or delete request panels
			for (var i in engineIds)
			{
				 var engine = engineIds[i];
				 if(ids.includes(engine)) updateEnginePanel(engine);
				 else deletePanel(engine);
			}

			// create new request panel
			for (var i in engineData)
			{
				var newEngine = engineData[i];
				if(!engineIds.includes(newEngine.engineID)) buildEnginePanel(newEngine.engineID);
			}

			engineIds = [];
			for (var i in engineData)
			{
				engineIds.push(engineData[i].engineID);
			}
		},
		error: function (status)
		{
			M.toast({html: 'Failed to load engines: Status: ' + status.status + ' Message: ' + status.statusText});
		}
	});
}

function updateEnginePanel(id)
{
	$.ajax
	({
		url: serviceUrl + "/Admin/Engines/" + id,
        type: 'get',
        dataType: 'json',
        contentType:'application/json',
        success: function (enginePanelData)
        {
        	var panel = generateEnginePanelHtml(enginePanelData);
			$("#" + enginePanelData._id + "_item").replaceWith(panel);
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to load Engine: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function buildEnginePanel(id)
{
	$.ajax
	({
		url: serviceUrl + "/Admin/Engines/" + id,
		type: 'get',
		dataType: 'json',
		contentType:'application/json',
		success: function (enginePanelData)
		{
			var panel = generateEnginePanelHtml(enginePanelData);
			$("#engineList").append(panel);
		},
		error: function (status)
		{
			M.toast({html: 'Failed to load engine!: Status: ' + status.status + ' Message: ' + status.statusText});
		}
	});
}

function generateEnginePanelHtml(enginePanelData)
{
	var panel = "<li id=\"" + enginePanelData._id + "_item\" class=\"collection-item avatar\"><img src=\"logo.jpg\" alt=\"\" class=\"circle\" \"><span class=\"title\" style=\"font-weight: bold; cursor: pointer;\">" + enginePanelData.engineName + "</span>";

	panel += "<p style=\"font-size: small;\">Status: " + (enginePanelData.halted ? "Halted" : "Running");
	panel += "<br>Queued Requests:";
	panel += "<br>Queued Scheduled Tasks: </p>";

	panel += "<div class=\"card z-depth-0\" style=\"padding: 0px; margin: 0px;\"><div class=\"card-action\" style=\"padding: 0px; font-size: smaller;\"><a href=\"#\" onclick=\"startStopEngine('" + enginePanelData.engineID + "')\">" + (enginePanelData.halted ? "Start" : "Halt") + " Engine</a></div></div>";

	panel += "<a href=\"#!\" class=\"secondary-content\" onclick=\"viewRequest('" + enginePanelData.engineID + "');\">";

	if(!enginePanelData.halted) panel += "<i class=\"medium material-icons green-text\">check_circle_outline</i>";
	else panel += "<i class=\"medium material-icons red-text\">close</i>";

	panel += "</a></li>";

	return panel;
}

function startStopEngine(id)
{

}

function loadProjects()
{
	$.ajax
	({
		url: serviceUrl + "/Admin/Projects",
		type: 'get',
		dataType: 'json',
		contentType:'application/json',
		success: function (projectData)
		{
			// update or delete request panels
			for (var i in projectIds)
			{
				 var project = projectIds[i];
				 if(projectData.includes(project)) updateProjectPanel(project);
				 else deletePanel(project);
			}

			// create new request panel
			for (var i in projectData)
			{
				var newProject = projectData[i];
				if(!projectIds.includes(newProject)) buildProjectPanel(newProject);
			}

			projectIds = projectData;
		},
		error: function (status)
		{
			M.toast({html: 'Failed to load projects: Status: ' + status.status + ' Message: ' + status.statusText});
		}
	});
}

function generateProjectPanelHtml(projPanelData)
{
	var panel = "<li id=\"" + projPanelData._id + "_item\" class=\"collection-item avatar\"><img src=\"logo.jpg\" alt=\"\" class=\"circle\" \"><span class=\"title\" style=\"font-weight: bold; cursor: pointer;\">" + projPanelData.name + "</span>";

	panel += "<p style=\"font-size: small;\">";
	panel += "<br>";
	panel += "</p>";

	panel += "<div class=\"card z-depth-0\" style=\"padding: 0px; margin: 0px;\"><div class=\"card-action\" style=\"padding: 0px; font-size: smaller;\"><a href=\"#\" onclick=\"viewProcessors('" + projPanelData.name + "', 'Admin/Projects')\">Edit</a><a href=\"#\" onclick=\"deleteProject('" + projPanelData.name + "')\">Delete Project</a></div></div>";
	panel += "<a href=\"#!\" class=\"secondary-content\" onclick=\"toggleFavorite('" + projPanelData._id + "_item_favorite')\"><i id=\"" + projPanelData._id + "_item_favorite\" class=\"small material-icons red-text\">favorite_border</i></a></li>";

	return panel;
}

function updateProjectPanel(id)
{
	$.ajax
	({
		url: serviceUrl + "/Admin/Projects/" + id,
        type: 'get',
        dataType: 'json',
        contentType:'application/json',
        success: function (projPanelData)
        {
        	var panel = generateProjectPanelHtml(projPanelData);
			$("#" + projPanelData._id + "_item").replaceWith(panel);
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to load project: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function buildProjectPanel(id)
{
	$.ajax
	({
		url: serviceUrl + "/Admin/Projects/" + id,
		type: 'get',
		dataType: 'json',
		contentType:'application/json',
		success: function (projPanelData)
		{
			var panel = generateProjectPanelHtml(projPanelData);
			$("#projectList").append(panel);
		},
		error: function (status)
		{
			M.toast({html: 'Failed to load project!: Status: ' + status.status + ' Message: ' + status.statusText});
		}
	});
}

function saveProject(name)
{
	// create or update? need to check if project exists?
	$.ajax
	({
		url: serviceUrl + "/Admin/Projects",
		type: 'get',
		dataType: 'json',
		contentType:'application/json',
		success: function (projectData)
		{
			var isCreate = true;

			for (var i in projectData)
			{
				 var project = projectData[i];
				 if(projectIds.includes(name))
				 {
					 // update
					 isCreate = false;
					 break;
				 }
			}

			// update x,y coords on processors by fetching top,left from 'flowchartWindow" + processor.processorID' elements
			for (var i in viewedTask.processors)
			{
				var processor = viewedTask.processors[i];
				processor.x = $("#flowchartWindow" + processor.processorID).css("left").replace("px", "");
				processor.y = $("#flowchartWindow" + processor.processorID).css("top").replace("px", "");
			}

			if(isCreate)
			{
				// strip out couchDb params (id and revision)
				// if this a clone, we don't want them preventing a create
				delete viewedTask._id;
				delete viewedTask._rev;
			}

			// clear out any dangling results, in case this was cloned from a request/task that
			// had persisted results returned to the UI. The service does this, but why send
			// garbage down the wire if we don't have to?
			for (var i in viewedTask.processors)
			{
				var processor = viewedTask.processors[i];

				for (var key in processor.outputNodes)
				{
					if (processor.outputNodes.hasOwnProperty(key))
					{
						processor.outputNodes[key] = [];
					}
				}
			}

			viewedTask.name = name;
			var jsonString = JSON.stringify(viewedTask);

			if(isCreate)
			{
				$.ajax
				({
					url: serviceUrl + "/Admin/Projects",
					type: 'post',
					dataType: 'json',
					contentType:'application/json',
					data: jsonString,
					success: function (savedProjectData)
					{
						$('#createProject').modal('close');
						$('#projectName').val('');
						M.toast({html: 'Project Saved'});
					},
					error: function (status)
					{
						M.toast({html: 'Failed to save project!: Status: ' + status.status + ' Message: ' + status.statusText});
					}
				});
			}
			else
			{
				$.ajax
				({
					url: serviceUrl + "/Admin/Projects",
					type: 'put',
					dataType: 'json',
					contentType:'application/json',
					data: jsonString,
					success: function (savedProjectData)
					{
						$('#createProject').modal('close');
						$('#projectName').val('');
						M.toast({html: 'Project Saved'});
					},
					error: function (status)
					{
						M.toast({html: 'Failed to save project: Status: ' + status.status + ' Message: ' + status.statusText});
					}
				});
			}
		},
		error: function (status)
		{
			M.toast({html: 'Failed to load projects: Status: ' + status.status + ' Message: ' + status.statusText});
		}
	});
}

function deleteProject(id)
{
	$.ajax
	({
		url: serviceUrl + "/Admin/Projects/" + id,
		type: 'delete',
		dataType: 'json',
		contentType:'application/json',
		success: function (reqPanelData)
		{
			M.toast({html: 'Project deleted'});
		},
		error: function (status)
		{
			M.toast({html: 'Failed to delete project: Status: ' + status.status + ' Message: ' + status.statusText});
		}
	});
}

function buildPanel(id)
{
	$.ajax
	({
		url: serviceUrl + "/TopologyProcess/" + id + "?verbose=true",
        type: 'get',
        dataType: 'json',
        contentType:'application/json',
        success: function (reqPanelData)
        {
        	var panel = generatePanelHtml(reqPanelData);
			$("#requestList").append(panel);
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to load request: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function updatePanel(id)
{
	$.ajax
	({
		url: serviceUrl + "/TopologyProcess/" + id + "?verbose=true",
        type: 'get',
        dataType: 'json',
        contentType:'application/json',
        success: function (reqPanelData)
        {
        	var panel = generatePanelHtml(reqPanelData);
			$("#" + reqPanelData.requestID + "_item").replaceWith(panel);
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to load request: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function generatePanelHtml(reqPanelData)
{
	var panel = "<li id=\"" + reqPanelData.requestID + "_item\" class=\"collection-item avatar\"><img src=\"logo.jpg\" alt=\"\" class=\"circle\" onclick=\"viewRequest('" + reqPanelData.requestID + "');\"><span onclick=\"viewRequest('" + reqPanelData.requestID + "');\" class=\"title\" style=\"font-weight: bold; cursor: pointer;\">" + reqPanelData.requestID + "</span>";


	panel += "<p style=\"font-size: small;\">" + (!reqPanelData.started ? "Queued" : !reqPanelData.completed ? "Processing" : "Completed");
	panel += "<br>";
	panel += "Completion time: " + new Date(reqPanelData.completionTime).toLocaleString() + "</p>";

	panel += "<div class=\"card z-depth-0\" style=\"padding: 0px; margin: 0px;\"><div class=\"card-action\" style=\"padding: 0px; font-size: smaller;\"><a href=\"#mapDialog\" onclick=\"setupMap('" + reqPanelData.requestID + "', 'TopologyProcess');\">View Results</a><a href=\"#\" class=\"hide-on-med-and-down\" onclick=\"viewProcessors('" + reqPanelData.requestID + "', 'TopologyProcess')\">View Processors</a><a href=\"#\" onclick=\"deleteRequest('" + reqPanelData.requestID + "')\">Delete Request</a></div></div>";

	panel += "<a href=\"#!\" class=\"secondary-content\" onclick=\"viewRequest('" + reqPanelData.requestID + "');\">";

	if(reqPanelData.completed && reqPanelData.successful) panel += "<i class=\"medium material-icons green-text\">check_circle_outline</i>";
	else if(!reqPanelData.completed) panel += "<i class=\"medium material-icons grey-text\">history</i>";
	else panel += "<i class=\"medium material-icons red-text\">close</i>";

	panel += "</a></li>";

	return panel;
}

function viewRequest(id)
{
	$.ajax
	({
		url: serviceUrl + "/TopologyProcess/" + id + "?verbose=true",
		type: 'get',
		dataType: 'json',
		contentType:'application/json',
		success: function (reqPopupData)
		{
			$("#taskInfoPanel").empty();

			var panel = "<div id=\"" + reqPopupData.requestID + "_panel\" class=\"col s12\">";
			panel += "<div class=\"card white z-depth-0\" style=\"border: 1px solid #e0e0e0;\">";
			panel += "<div class=\"card-content black-text\">";
			panel += "<div class=\"row\">";
			// title
			panel += "<div class=\"col s12\"><div class=\"card-title\"><i class=\"material-icons\">play_for_work</i>     " + reqPopupData.requestID + "</div></div></div>";
			panel += "<div class=\"row\" style=\"margin-bottom: 1px;\"><div class=\"col s6\">Started:</div>";
			panel += "<div class=\"col s6\">" + reqPopupData.started + "</div></div>";
			panel += "<div class=\"row\" style=\"margin-bottom: 1px;\"><div class=\"col s6\">Start time:</div>";
			panel += "<div class=\"col s6\">" + new Date(reqPopupData.startTime).toLocaleString() + "</div></div>";
			panel += "<div class=\"row\" style=\"margin-bottom: 1px;\"><div class=\"col s6\">Completed:</div>";
			panel += "<div class=\"col s6\">" + reqPopupData.completed + "</div></div>";
			panel += "<div class=\"row\" style=\"margin-bottom: 1px;\"><div class=\"col s6\">Completion time:</div>";
			panel += "<div class=\"col s6\">" + new Date(reqPopupData.completionTime).toLocaleString() + "</div></div>";
			panel += "<div class=\"row\" style=\"margin-bottom: 1px;\"><div class=\"col s6\">Last message:</div>";
			panel += "<div class=\"col s6\">" + reqPopupData.message + "</div></div>";
			panel += "</div><div class=\"card-action\"><a href=\"#mapDialog\" onclick=\"setupMap('" + reqPopupData.requestID + "', 'TopologyProcess');\">View Results</a><a href=\"#\" class=\"hide-on-med-and-down\" onclick=\"viewProcessors('" + reqPopupData.requestID + "', 'TopologyProcess')\">View Processors</a><a href=\"#\" onclick=\"deleteRequest('" + reqPopupData.requestID + "')\">Delete Request</a></div></div></div></div>";

			$("#taskInfoPanel").append(panel);

			$("#taskInfo").modal("open");
		},
		error: function (status)
		{
			M.toast({html: 'Failed to load request: Status: ' + status.status + ' Message: ' + status.statusText});
		}
});
}

function deletePanel(id)
{
	$("#" + id + "_item").hide();
	$("#" + id + "_item").remove();
}

function buildTaskPanel(id)
{
	$.ajax
	({
		url: serviceUrl + "/TopologyTask/" + id + "?verbose=true",
        type: 'get',
        dataType: 'json',
        contentType:'application/json',
        success: function (taskPanelData)
        {
        	var panel = generateTaskPanelHtml(taskPanelData);

        	$("#taskList").append(panel);
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to load task: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function updateTaskPanel(id)
{
	$.ajax
	({
		url: serviceUrl + "/TopologyTask/" + id + "?verbose=true",
        type: 'get',
        dataType: 'json',
        contentType:'application/json',
        success: function (taskPanelData)
        {
        	var panel = generateTaskPanelHtml(taskPanelData);

        	$("#" + taskPanelData.name.replace(/ /g, '') + "_item").replaceWith(panel);
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to load task: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function generateTaskPanelHtml(taskPanelData)
{
	var panel = "<li id=\"" + taskPanelData.name.replace(/ /g, '') + "_item\" class=\"collection-item avatar\"><img src=\"logo.jpg\" alt=\"\" class=\"circle\" onclick=\"viewTask('" + taskPanelData.name + "');\"><span onclick=\"viewTask('" + taskPanelData.name + "');\" class=\"title\" style=\"font-weight: bold; cursor: pointer;\">" + taskPanelData.name + "</span>";
	panel += "<p style=\"font-size: small;\">" + (!taskPanelData.halted ? "Currently Running every " + taskPanelData.interval + " " + taskPanelData.intervalUnit + "" : "Halted");
	panel += "<br>";
	panel += "Next Scheduled Run: " + new Date(taskPanelData.nextExecutionTimeEpoch * 1000).toLocaleString() + "</p>";

	panel += "<div class=\"card z-depth-0\" style=\"padding: 0px; margin: 0px;\"><div class=\"card-action\" style=\"padding: 0px; font-size: smaller;\"><a href=\"#mapDialog\" onclick=\"setupMap('" + taskPanelData.name + "', 'TopologyTask')\">View Results</a><a href=\"#\" class=\"hide-on-med-and-down\" onclick=\"viewProcessors('" + taskPanelData.name + "', 'TopologyTask')\">View Processors</a><a href=\"#\" onclick=\"deleteTask('" + taskPanelData.name + "')\">Delete Task</a>";
	if(taskPanelData.halted) panel += "<a href=\"#\" onclick=\"startTask('" + taskPanelData.name + "')\">Start Task</a></div></div>";
	else panel += "<a href=\"#\" onclick=\"haltTask('" + taskPanelData.name + "')\">Halt Task</a></div></div>";

	panel += "<a href=\"#!\" class=\"secondary-content\" onclick=\"viewTask('" + taskPanelData.name + "');\">";
	if(taskPanelData.completed && taskPanelData.successful) panel += "<i class=\"medium material-icons green-text\">check_circle_outline</i>";
	else if(taskPanelData.running) panel += "<i class=\"medium material-icons grey-text\">history</i>";
	else panel += "<i class=\"medium material-icons red-text\">close</i>";

	panel += "</a></li>";

	return panel;
}

function viewTask(id)
{
	$.ajax
	({
		url: serviceUrl + "/TopologyTask/" + id + "?verbose=true",
		type: 'get',
		dataType: 'json',
		contentType:'application/json',
		success: function (taskPopupData)
		{
			$("#taskInfoPanel").empty();

			var panel = "<div id=\"" + taskPopupData.name.replace(/ /g, '') + "_panel\" class=\"col s12\">";
				panel += "<div class=\"card white z-depth-0\" style=\"border: 1px solid #e0e0e0;\">";
				panel += "<div class=\"card-content black-text\">";
				panel += "<div class=\"row\">";
				// title
				panel += "<div class=\"col s12\"><div class=\"card-title\"><i class=\"material-icons\">schedule</i>     " + taskPopupData.name + "</div></div></div>";
				//row 1
				panel += "<div class=\"row\"><div class=\"col s12\">Scheduled task running every " + taskPopupData.interval + " " + taskPopupData.intervalUnit + "</div></div>";
				//row 2
				panel += "<div class=\"row\" style=\"margin-bottom: 1px;\"><div class=\"col s6\">Currently Active:</div>";
				panel += "<div class=\"col s6\">" + !taskPopupData.halted + "</div></div>";
				panel += "<div class=\"row\" style=\"margin-bottom: 1px;\"><div class=\"col s6\">Started:</div>";
				panel += "<div class=\"col s6\">" + taskPopupData.started + "</div></div>";
				panel += "<div class=\"row\" style=\"margin-bottom: 1px;\"><div class=\"col s6\">Last completion time:</div>";
				panel += "<div class=\"col s6\">" + new Date(taskPopupData.completionTime).toLocaleString() + "</div></div>";
				panel += "<div class=\"row\" style=\"margin-bottom: 1px;\"><div class=\"col s6\">Last failure date:</div>";
				panel += "<div class=\"col s6\">" + new Date(taskPopupData.lastFailureDate).toLocaleString() + "</div></div>";
				panel += "<div class=\"row\" style=\"margin-bottom: 1px;\"><div class=\"col s6\">Last message:</div>";
				panel += "<div class=\"col s6\">" + taskPopupData.message + "</div></div>";

				panel += "</div><div class=\"card-action\"><a href=\"#mapDialog\" onclick=\"setupMap('" + taskPopupData.name + "', 'TopologyTask')\">View Results</a><a href=\"#\" class=\"hide-on-med-and-down\" onclick=\"viewProcessors('" + taskPopupData.name + "', 'TopologyTask')\">View Processors</a><a href=\"#\" onclick=\"deleteTask('" + taskPopupData.name + "')\">Delete Task</a>";
				if(taskPopupData.halted) panel += "<a href=\"#\" onclick=\"startTask('" + taskPopupData.name + "')\">Start Task</a>";
				else panel += "<a href=\"#\" onclick=\"haltTask('" + taskPopupData.name + "')\">Halt Task</a>";

				panel += "</div></div></div></div>";

				$("#taskInfoPanel").append(panel);

				$("#taskInfo").modal("open");
		},
		error: function (status)
		{
			M.toast({html: 'Failed to load task: Status: ' + status.status + ' Message: ' + status.statusText});
		}
	});
}

function startTask(id)
{
	$.ajax
	({
		url: serviceUrl + "Admin/Jobs/" + id + "/Start",
        type: 'put',
        dataType: 'json',
        contentType:'application/json',
        success: function (haltData)
        {
        	M.toast({html: 'Task ' + id + ' started'});
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to start task ' + id + ': Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function haltTask(id)
{
	$.ajax
	({
		url: serviceUrl + "Admin/Jobs/" + id + "/Halt",
        type: 'put',
        dataType: 'json',
        contentType:'application/json',
        success: function (haltData)
        {
        	M.toast({html: 'Task ' + id + ' Halted'});
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to halt task ' + id + ': Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function deleteTask(id)
{
	$.ajax
	({
		url: serviceUrl + "TopologyTask/" + id,
        type: 'delete',
        dataType: 'json',
        contentType:'application/json',
        success: function (deleteData)
        {
        	M.toast({html: 'Request deleted'});
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to delete request ' + id + ': Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function deleteRequest(id)
{
	$.ajax
	({
		url: serviceUrl + "TopologyProcess/" + id,
        type: 'delete',
        dataType: 'json',
        contentType:'application/json',
        success: function (deleteData)
        {
        	M.toast({html: 'Request deleted'});
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to delete request ' + id + ': Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function serviceHealth()
{
	$.ajax
	({
		url: serviceUrl + "Health",
        type: 'get',
        dataType: 'json',
        contentType:'application/json',
        success: function (healthData)
        {
        	$("#serviceStatus").html(healthData.serviceStatus);

        	if(healthData.serviceStatus == "RUNNING") $("#serviceStatus").css('color', 'green');
        	else $("#serviceStatus").css('color', 'red');
        },
        error: function (status)
        {
        	$("#serviceStatus").html("OFFLINE");
        	$("#serviceStatus").css('color', 'red');
        }
	});
}

var filterText
function setFilterText()
{
	filterText = $("#filterLogTable").val().toUpperCase();
}

function clearLogs()
{
	$.ajax
		({
			url: serviceUrl + "Admin/Logs",
	        type: 'delete',
	        dataType: 'json',
	        contentType:'application/json',
	        success: function (logClearData)
	        {
				M.toast({html: 'Logs cleared'});
				loadLogs();
	        },
	        error: function (status)
	        {
	        	M.toast({html: 'Failed to clear logs: Status: ' + status.status + ' Message: ' + status.statusText});
	        }
	});
}

function loadLogs()
{
	$.ajax
	({
		url: serviceUrl + "Admin/Logs",
        type: 'get',
        dataType: 'json',
        contentType:'application/json',
        success: function (logData)
        {
			// create a log table, toss in each row.
			$("#logContent").empty();

			var newTable = "<table class=\"highlight responsive-table\"><thead><tr><th>Date</th><th>Process</th><th>Processor</th><th>Message</th></tr></thead><tbody>";

			for (var i in logData)
			{
				 var log = logData[i];

				if(filterText == null || (filterText.length <= 3 || (filterText.length > 3 && (new Date(log.timestamp).toLocaleString().toUpperCase().includes(filterText) || log.processID.toUpperCase().includes(filterText) || log.processorID.toUpperCase().includes(filterText) || log.message.toUpperCase().includes(filterText)))))
				{
					 newTable += "<tr>";
					 newTable += "<td>" + new Date(log.timestamp).toLocaleString() + "</td>";
					 newTable += "<td>" + log.processID + "</td>";
					 newTable += "<td>" + log.processorID + "</td>";
					 newTable += "<td>" + log.message + "</td>";
					 newTable += "</tr>";
				}
        	}

			newTable += "</tbody></table>";

        	$("#logContent").append(newTable);
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to load logs: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function loadRunningJobs(verbose)
{
	$.ajax
	({
		url: serviceUrl + "Admin/Jobs?verbose=" + verbose,
        type: 'get',
        dataType: 'json',
        contentType:'application/json',
        success: function (jobData)
        {
        	var parsedResults = JSON.parse(jobData);

        	// update or delete request panels
        	for (var i in requestIds)
        	{
        	     var existingID = requestIds[i];
        	     if(parsedResults.requests.includes(existingID)) updatePanel(existingID);
        	     else deletePanel(existingID);
        	}
        	// create new request panel
        	for (var i in parsedResults.requests)
    		{
        		var newID = parsedResults.requests[i];
        		if(!requestIds.includes(newID)) buildPanel(newID);
    		}

        	// update or delete task panels
        	for (var i in taskIds)
        	{
        	     var existingID = taskIds[i];
        	     if(parsedResults.scheduledTasks.includes(existingID)) updateTaskPanel(existingID);
        	     else deletePanel(existingID.replace(/ /g, ''));
        	}
        	// create new task panel
        	for (var i in parsedResults.scheduledTasks)
    		{
        		var newID = parsedResults.scheduledTasks[i];
        		if(!taskIds.includes(newID)) buildTaskPanel(newID);
    		}

        	requestIds = parsedResults.requests;
        	taskIds = parsedResults.scheduledTasks;
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to load queues: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function flushQueues()
{
	M.toast({html: 'Attempting queue flush...'});
	$.ajax
	({
		url: serviceUrl + "Admin/Jobs/Flush",
        type: 'delete',
        dataType: 'json',
        contentType:'application/json',
        success: function (flushData)
        {
        	var parsedResults = JSON.parse(flushData);
        	M.toast({html: 'Queues successfully flushed'});
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to flush queues: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function restartEngine()
{
	M.toast({html: 'Attempting Engine restart...'});
	$.ajax
	({
		url: serviceUrl + "Admin/Engine/Restart",
        type: 'post',
        dataType: 'json',
        contentType:'application/json',
        success: function (restartData)
        {
        	var parsedResults = JSON.parse(restartData);
        	M.toast({html: 'Engine successfully restarted'});
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to restart engine: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

// Results viewer
var map;
var layerControl;
var addedLayers = [];
var overlayMaps = {};

function setupMap(id, task)
{
	$('#mapDialog').modal('open');
	map.invalidateSize();

	// remove all layers
	for (var lyr in addedLayers)
    {
		map.removeLayer(addedLayers[lyr]);
	}

	if(layerControl) map.removeControl(layerControl);
	addedLayers = [];
	overlayMaps = {};

	$.ajax
	({
		url: serviceUrl + "/" + task + "/" + id + "?verbose=true",
        type: 'get',
        dataType: 'json',
        contentType:'application/json',
        success: function (taskData)
        {
        	// get taskData results and create a layer for each one


			var j = 0;
		    var xhr = [];
		    var layerNames = []
			for (var i in taskData.processors)
			{
				 var payload = taskData.processors[i];
                 var results = payload.outputNodes;

                 // loop through all output nodes.
				 // create a layer for each one.

				 for (var key in results)
				 {
				     if (results.hasOwnProperty(key))
				     {
						layerNames[j] = payload.type + '_' + payload.processorID + '_' + key;
						(function(idx, layerName, task, id)
						{
							xhr[idx] = new XMLHttpRequest();
							xhr[idx].onreadystatechange = function()
							{
								if (xhr[idx].readyState == 4 && xhr[idx].status == 200)
								{
									createLayer(JSON.parse(xhr[idx].responseText), layerNames[idx]);
								}
							};
							xhr[idx].open("GET", serviceUrl + "/" + task + "/" + id + "?fetchGeometryOnly=true&fetchSingleProcessorResults=" + payload.processorID, true);
							xhr[idx].send(null);
						})(j, payload.type + '_' + payload.processorID + '_' + key, task, id);

						j = j + 1;
				     }
				 }
        	}

        	map.invalidateSize();
        },
        error: function (status)
        {
        	M.toast({html: 'Failed to load task results: Status: ' + status.status + ' Message: ' + status.statusText});
        }
	});
}

function createLayer(featureCollection, layerName)
{
	 var myLayerData = [];

	 var features = featureCollection.features;
	 for (var x in features)
	 {
		 var feature = features[x];
		 var geometry = feature.geometry;

		 // add popup content
		 geometry.popupContent = "<div style='overflow: auto; height: 200px;'><table>";

		 for (var j in feature.properties)
		 {
			 if(feature.properties.hasOwnProperty(j))
			 {
			   geometry.popupContent += "<tr><td>" + j + "</td><td>" + feature.properties[j] + "</td></tr>"
			}
		 }

		 //define a popup
		 geometry.popupContent += "</table>";

		 // add geometry json to layer
		myLayerData.push(geometry);
	}

	var color = getRandomColor();
	var myLayer = L.geoJSON(myLayerData,
	{
		 style: function(feature)
		 {
		   return {
			   fillColor: color,
			   weight: 2,
			   opacity: 1,
			   color: color,
			   fillOpacity: 0.4
		   };
		 },
		  onEachFeature: onEachFeature
	 }).addTo(map);

	 overlayMaps[layerName] = myLayer;

	if(layerControl) map.removeControl(layerControl);
	layerControl = L.control.layers({}, overlayMaps).addTo(map);

	 addedLayers.push(myLayer);

	 try
	 {
		 var bounds = myLayer.getBounds();
		 map.fitBounds(myLayer.getBounds());
	 }
 catch(error) {}
}

function getRandomColor()
{
	var letters = '0123456789ABCDEF';
	var color = '#';

	for (var i = 0; i < 6; i++)
	{
		color += letters[Math.floor(Math.random() * 16)];
	}

	return color;
}

function onEachFeature(feature, layer)
{
    if (feature.popupContent)
    {
        layer.bindPopup(feature.popupContent);
    }
}

// Processor creator/viewer
var viewedTask;

function clearDiagram()
{
	viewedTask =
	{
		priority: 1,
		processors: []
	};

	$("#canvas").empty();

	jsPlumb.empty("canvas");
    jsPlumb.revalidate("canvas");
	jsPlumb.reset();

	setupJsPlumb();
}

function executeDiagram(endpoint)
{
	// remove the Param response objects, if they exists (in case we loaded this from a param resource)
	delete viewedTask.requestID;
	delete viewedTask.message;
	delete viewedTask.creationTime;
	delete viewedTask.startTime;
	delete viewedTask.completed;
	delete viewedTask.completionTime;
	delete viewedTask.lastFailureDate;
	delete viewedTask.started;
	delete viewedTask.links;

	for (var i in viewedTask.processors)
	{
		var processor = viewedTask.processors[i];

		for (var key in processor.outputNodes)
		{
			if (processor.outputNodes.hasOwnProperty(key))
			{
				processor.outputNodes[key] = [];
			}
		}
	}

	// strip couchdb params (force create a new request, don't update an existing one)
	delete viewedTask._id;
	delete viewedTask._rev;

	if(endpoint == 'TopologyTask')
	{
		// add in schedule info;
		viewedTask.name = $('#taskname').val();
		viewedTask.interval = $('#taskInterval').val();
		viewedTask.intervalUnit = $('#taskIntervalUnit').val();
	}

	var jsonString = JSON.stringify(viewedTask);

	$.ajax
		({
			url: serviceUrl + "/" + endpoint,
			type: 'post',
			dataType: 'json',
			contentType:'application/json',
			data: jsonString,
		    crossDomain: true,
			withCredentials: true,
			success: function (reqProcessResultData)
			{
				M.toast({html: 'Process request ' + reqProcessResultData.requestID + ' submitted! View requests to see when it completes.'});
			},
			error: function (status)
			{
				M.toast({html: 'Failed to submit process request: Status: ' + status.status + ' Message: ' + status.statusText});
			}
	});
}

function viewProcessors(id, endpoint)
{
	$("#taskInfo").modal("close");

	var serviceCall = serviceUrl + "/" + endpoint + "/" + id + "?verbose=true";

	$.ajax
	({
		url: serviceCall,
		type: 'get',
		dataType: 'json',
		contentType:'application/json',
		success: function (reqProcessData)
		{
			viewedTask = reqProcessData;

			// clear the current jsPlumb
			$("#canvas").empty();
			jsPlumb.empty("canvas");
			jsPlumb.revalidate("canvas");
			jsPlumb.reset();

			setupJsPlumb();
		},
		error: function (status)
		{
			M.toast({html: 'Failed to load request: Status: ' + status.status + ' Message: ' + status.statusText});
		}
	});
}

// jsPlumb for creator grid
var plumbInst;
function setupJsPlumb()
{
	$('#projectPanels').hide();
	$('#defaultPanel').hide();
	$('#requestPanels').hide();
	$('#taskPanels').hide();
	$('#logPanel').hide();
	$('#creatorPanel').show();

	// use viewedTask
	jsPlumb.ready(function ()
	{
		plumbInst = window.jsp = jsPlumb.getInstance(
		{
			// default drag options
			DragOptions: { cursor: 'pointer', zIndex: 2000 },

			// the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
			// case it returns the 'labelText' member that we set on each connection in the 'init' method below.
			ConnectionOverlays:
			[
				[ "Arrow", {
					location: 1,
					visible:true,
					width:11,
					length:11,
					id:"ARROW",
					events:{
						click:function() { /* Some function to run when an overlay is clicked on */ }
					}
				} ]/*,
				  [ "Label", {
					location: 0.1,
					id: "label",
					cssClass: "aLabel",
					events:{
						tap:function()
						{
							//Some function to run when a label is clicked on
						}
					}
				}]*/
			],
			Container: "canvas"
		});

		var basicType =
		{
			connector: "StateMachine",
			paintStyle: { stroke: "red", strokeWidth: 4 },
			hoverPaintStyle: { stroke: "blue" },
			overlays: [ "Arrow" ]
		};

		plumbInst.registerConnectionType("basic", basicType);

		// this is the paint style for the connecting lines..
		var connectorPaintStyle =
		{
				strokeWidth: 2,
				stroke: "#707070",
				joinstyle: "round",
				outlineStroke: "white",
				outlineWidth: 1
			},
		// .. and this is the hover style.
			connectorHoverStyle =
			{
				strokeWidth: 3,
				stroke: "#f44336",
				outlineWidth: 2,
				outlineStroke: "white"
			},
			endpointHoverStyle =
			{
				fill: "#f44336",
				stroke: "#f44336"
			},
		// the definition of source endpoints (the small blue ones)
			sourceEndpoint =
			{
				endpoint: "Dot",
				paintStyle:
				{
					stroke: "#f5f5f5",
					fill: "#474444",
					radius: 7,
					strokeWidth: 4
				},
				//anchor:[ "Perimeter", { shape:"Square" } ],
				isSource: true,
				connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
				connectorStyle: connectorPaintStyle,
				hoverPaintStyle: endpointHoverStyle,
				maxConnections: -1,
				connectorHoverStyle: connectorHoverStyle,
				dragOptions: {},
				overlays: [["Label", { location: [0.5, 1.5], label: "Drag", cssClass: "endpointSourceLabel", visible:false }]]
			},
		// the definition of writer endpoints (the small blue ones)
			writerTargetEndpoint =
			{
				endpoint: "Dot",
				paintStyle:
				{
					stroke: "#f5f5f5",
					fill: "#474444",
					radius: 7,
					strokeWidth: 4
				},
				//anchor:[ "Perimeter", { shape:"Square" } ],
				hoverPaintStyle: endpointHoverStyle,
				maxConnections: -1,
				dropOptions: { hoverClass: "hover", activeClass: "active" },
				isTarget: true,
				overlays: [[ "Label", { location: [0.5, -0.5], label: "Drop", cssClass: "endpointTargetLabel", visible:false } ]]
			},
		// the definition of target endpoints (will appear when the user drags a connection)
			targetEndpoint =
			{
				endpoint: "Dot",
				paintStyle:
				{
					stroke: "#f5f5f5",
					fill: "#474444",
					radius: 7,
					strokeWidth: 4
				},
				//anchor:[ "Perimeter", { shape:"Square" } ],
				hoverPaintStyle: endpointHoverStyle,
				maxConnections: -1,
				dropOptions: { hoverClass: "hover", activeClass: "active" },
				isTarget: true,
				overlays: [[ "Label", { location: [0.5, -0.5], label: "Drop", cssClass: "endpointTargetLabel", visible:false } ]]
			},
			readerSourceEndpoint =
			{
				endpoint: "Dot",
				paintStyle:
				{
					stroke: "#f5f5f5",
					fill: "#474444",
					radius: 7,
					strokeWidth: 4
				},
				//anchor:[ "Perimeter", { shape:"Square" } ],
				isSource: true,
				connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
				connectorStyle: connectorPaintStyle,
				hoverPaintStyle: endpointHoverStyle,
				maxConnections: -1,
				connectorHoverStyle: connectorHoverStyle,
				dragOptions: {},
				overlays: [["Label", { location: [0.5, 1.5], label: "Drag", cssClass: "endpointSourceLabel", visible:false }]]
			},
			writerSourceEndpoint =
			{
				endpoint: "Dot",
				paintStyle:
				{
					stroke: "#f5f5f5",
					fill: "#474444",
					radius: 7,
					strokeWidth: 4
				},
				//anchor:[ "Perimeter", { shape:"Square" } ],
				isSource: true,
				connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
				connectorStyle: connectorPaintStyle,
				hoverPaintStyle: endpointHoverStyle,
				maxConnections: -1,
				connectorHoverStyle: connectorHoverStyle,
				dragOptions: {},
				overlays: [["Label", { location: [0.5, 1.5], label: "Drag", cssClass: "endpointSourceLabel", visible:false }]]
			},
			init = function (connection)
			{
				connection.getOverlay("label").setLabel(connection.sourceId.substring(15) + "-" + connection.targetId.substring(15));
			};

			targetEP = targetEndpoint;
			sourceEP = sourceEndpoint;
			writerTargetEP = writerTargetEndpoint;
			writerSourceEP = writerSourceEndpoint;
			readerSourceEP = readerSourceEndpoint;

			plumbInst.batch(function ()
			{
				// create a window for each processor
				var screenHeight = window.innerHeight;
				var col = 0;

				for (var i in viewedTask.processors)
				{
					var payload = viewedTask.processors[i];

					// clean up extra data
					delete payload.messages;
					delete payload.result;
					delete payload.features;
					delete payload.processed;

					var top = 200 + (130 * i) - ((screenHeight - 320) * col);

					if(top > screenHeight - 160)
					{
						col += 1;
						top = 200 + (130 * i) - ((screenHeight - 320) * col);
					}

					var left = 400 + (350 * col);

					if(payload.hasOwnProperty("x") && payload.x > 200) left = payload.x;
					if(payload.hasOwnProperty("y") && payload.y > 100) top = payload.y;

					addProcessorToDiagram(payload, top, left, sourceEndpoint, targetEndpoint);
				}

				// listen for new connections; initialise them the same way we initialise the connections at startup.
				plumbInst.bind("connection", function (connInfo, originalEvent)
				{
					init(connInfo.connection);
				});

				// make all the window divs draggable
				//plumbInst.draggable(jsPlumb.getSelector(".flowchart-demo .window"), { grid: [20, 20] });
				plumbInst.draggable(document.querySelectorAll(".window"), // should probably define a specific class for these, in case of any issues...
				{
					grid: [5, 5],
					//containment: true, // used to contain to the container div. Need to set container sizes appropriately. Useful when zoom is implemented, otherwise too restrictive
					stop: function(event, ui)
					{
						var processorId = event.el.id.replace("flowchartWindow", "");
			            for (var i in viewedTask.processors)
						{
							var processor = viewedTask.processors[i];

							if(processor.processorID == processorId)
							{
								processor.x = $("#" + event.el.id).css("left").replace("px", "");
								processor.y = $("#" + event.el.id).css("top").replace("px", "");
								break;
							}
						}
            		}
				});

				// Connect any related windows
				// need to add handling for processors with multiple input sources (leftTop, leftBottom)
				for (var i in viewedTask.processors)
				{
					var processor = viewedTask.processors[i];

					for (var key in processor.inputNodes)
					{
						if (processor.inputNodes.hasOwnProperty(key))
						{
							var inputNodes = processor.inputNodes[key];
							for (var node in inputNodes)
							{
								var inputNode = inputNodes[node];

								plumbInst.connect({uuids: ["Window" + inputNode.processorID + "Source_" + inputNode.node, "Window" + processor.processorID + "Target_" + key], editable: true});

								jsPlumb.repaint("flowchartWindow" + inputNode.processorID);
								jsPlumb.repaint("flowchartWindow" + processor.processorID);
							}
						}
					}
				}

				// set up listeners
				// listeners for connection click, drag, dragStop, and moved
				plumbInst.bind("click", function (conn, originalEvent)
				{
					//conn.toggleType("basic");
					//console.log("connection " + conn.id + " is being clicked. suspendedElement is ", conn.suspendedElement, " of type ", conn.suspendedElementType);
				});

				plumbInst.bind("connectionDrag", function (connection)
				{
					//console.log("connection " + connection.id + " is being dragged. suspendedElement is ", connection.suspendedElement, " of type ", connection.suspendedElementType);
				});

				plumbInst.bind("connectionDragStop", function (connection)
				{
					//console.log("connection " + connection.id + " was dragged");
				});

				plumbInst.bind("connectionMoved", function (params)
				{
					//console.log("connection " + params.connection.id + " was moved");
				});

				plumbInst.bind("connection", function (info)
				{
					if(info.sourceId.includes("flowchartWindow") && info.targetId.includes("flowchartWindow"))
					{
						var sourceId = info.sourceId.replace('flowchartWindow','');
						var targetId = info.targetId.replace('flowchartWindow','');

						var sourceNode = info.sourceEndpoint._jsPlumb.uuid.replace('Window' + sourceId + 'Source_','');
						var targetNode = info.targetEndpoint._jsPlumb.uuid.replace('Window' + targetId + 'Target_','');

						for (var i in viewedTask.processors)
						{
							var processor = viewedTask.processors[i];
							if(processor.processorID == targetId)
							{
								for (var key in processor.inputNodes)
								{
									if (processor.inputNodes.hasOwnProperty(key))
									{
										var inputNodes = processor.inputNodes[targetNode];
										if(!inputNodes) inputNodes = [];
										inputNodes.push({ processorID: sourceId, node: sourceNode });
										break;
									}
								}
							}
						}
					}
				});

				plumbInst.bind("connectionDetached", function (info)
				{
					if(info.sourceId.includes("flowchartWindow") && info.targetId.includes("flowchartWindow"))
					{
						var sourceId = info.sourceId.replace('flowchartWindow','');
						var targetId = info.targetId.replace('flowchartWindow','');

						var sourceNode = info.sourceEndpoint._jsPlumb.uuid.replace('Window' + sourceId + 'Source_','');
						var targetNode = info.targetEndpoint._jsPlumb.uuid.replace('Window' + targetId + 'Target_','');

						for (var i in viewedTask.processors)
						{
							var processor = viewedTask.processors[i];
							if(processor.processorID == targetId)
							{
								for (var key in processor.inputNodes)
								{
									if (processor.inputNodes.hasOwnProperty(key))
									{
										var inputNodes = processor.inputNodes[key];
										for (var nodeInd in inputNodes)
										{
											var node = inputNodes[nodeInd];
											if(node.processorID == sourceId)
											{
												var index = inputNodes.indexOf(node);
												if (index > -1)
												{
													inputNodes.splice(index, 1);
												}
												break;
											}
										}
									}
								}
							}
						}
					}
				});
			});

			jsPlumb.fire("jsPlumbDemoLoaded", plumbInst);

			jsPlumb.repaintEverything();
	});
}

function updateProcessorColumn(id, attribute, value)
{
	for (var i in viewedTask.processors)
	{
		var processor = viewedTask.processors[i];
		if(processor.processorID == id)
		{
			processor[attribute] = value;
			break;
		}
	}
}

function deleteProcessor(id)
{
	// cleanup chart
	$("#canvas").empty();
	jsPlumb.empty("canvas");
	jsPlumb.revalidate("canvas");
	jsPlumb.reset();

	var i = 0;
	for (i = 0; i < viewedTask.processors.length; i++)
	{
		var processor = viewedTask.processors[i];

		if(processor.processorID == id)
		{
			// delete processor from viewedTask
			if (i > -1) viewedTask.processors.splice(i, 1);
			i--;
		}
		else
		{
			// delete references from any other processor
			for (var key in processor.inputNodes)
			{
				if (processor.inputNodes.hasOwnProperty(key))
				{
					var inputNodes = processor.inputNodes[key];
					for (var nodeInd in inputNodes)
					{
						var node = inputNodes[nodeInd];
						if(node.processorID == id)
						{
							var index = inputNodes.indexOf(node);
							if (index > -1)
							{
								inputNodes.splice(index, 1);
							}
							break;
						}
					}
				}
			}
		}
	}

	// rebuild flowchart
	setupJsPlumb();
}

function addNewProcessor()
{
	if(!viewedTask) viewedTask =
				    {
						priority: 3,
						processors: [],
					};

	var processorType = $("#newProcessorType").val();
	var processor =
	{
		type: processorType,
		x: 0,
		y: 0
	};

	setupProcessor(processor);

	//need to set a processorID
	var uniqueId = false;
	var processID = Math.floor(Math.random() * 1000) + 1;
	while(!uniqueId && viewedTask.processors.length > 0)
	{
		for (var x in viewedTask.processors)
		{
			if(viewedTask.processors[x].processorID == processID)
			{
				uniqueId = false;
				break;
			}
			else uniqueId = true;
		}
		processID = Math.floor(Math.random() * 1000) + 1;
	}

	processor.processorID = processID;
	viewedTask.processors.push(processor);

	// need placement options for new panels
	//var top = 100;
	//var left = 300;

	$("#canvas").empty();

	jsPlumb.empty("canvas");
	jsPlumb.revalidate("canvas");
	jsPlumb.reset();
	setupJsPlumb();
}

var targetEP;
var sourceEP;
var writerSourceEP;
var writerTargetEP;
var readerSourceEP;

function addProcessorToDiagram(processor, top, left, sourceEndpoint, targetEndpoint)
{
	/*
	*  Everything about this method is disgusting. I'll refactor and update if and when this code may actually get used. Until then
	*  it's a quick and horribly dirty way to get the flowchart container panels up on screen and databound.
	*/
	var procType = "";

	var result = processor.type.replace( /([A-Z])/g, " $1" );
	var title = result.charAt(0).toUpperCase() + result.slice(1);

	if(title.toLowerCase().includes("writer")) procType = "writer";
	else if(title.toLowerCase().includes("reader")) procType = "reader";
	else procType = "processor";

	getProcessorPanel(processor, top, left, "canvas");

	var inputNodes = 1;
	var outputNodes = 1;

	// main content, by type
	if(processor.type == "overlayOperator" ||
	   processor.type == "spatialRelationFilter") inputNodes = 2;

	if(processor.type == "spatialFilter" ||
	   processor.type == "spatialRelationFilter" ||
	   processor.type == "featureValidator" ||
	   processor.type == "conditionalFilter" ||
	   processor.type == "overlayOperator") outputNodes = 2;

	// technically, we don't need any of this logic. Just replace the hard coded node definitions
	// with some math to adjust node placement on the left or right according to how many nodes we have.

	if(procType == "writer")
	{
		// should writers have an output port?
		//plumbInst.addEndpoint("flowchartWindow" + processor.processorID, writerSourceEP, { anchor: "RightMiddle", uuid: "Window" + processor.processorID + "RightMiddle" });
		plumbInst.addEndpoint("flowchartWindow" + processor.processorID, writerTargetEP, { anchor: "LeftMiddle", uuid: "Window" + processor.processorID + "Target_features" });
	}
	else if(procType == "reader")
	{
		plumbInst.addEndpoint("flowchartWindow" + processor.processorID, readerSourceEP, { anchor: "RightMiddle", uuid: "Window" + processor.processorID + "Source_features" });
	}
	else
	{
		var outputNodeKeys = [];
		var inputNodeKeys = [];
		for (var key in processor.outputNodes)
		{
			outputNodeKeys.push(key);
		}

		for (var key in processor.inputNodes)
		{
			inputNodeKeys.push(key);
		}

		if(outputNodeKeys.length == 3)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, sourceEndpoint, { anchor: [ 0, 0.25, -1, -1 ], uuid: "Window" + processor.processorID + "Source_"  + outputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, sourceEndpoint, { anchor: "RightMiddle", uuid: "Window" + processor.processorID + "Source_"  + outputNodeKeys[1] });
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, sourceEndpoint, { anchor: [ 0, 0.75, -1, -1 ], uuid: "Window" + processor.processorID + "Source_"  + outputNodeKeys[2] });
		}
		else if(outputNodeKeys.length == 2)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, sourceEndpoint, { anchor: [ 1, 0.35, -1, -1 ], uuid: "Window" + processor.processorID + "Source_"  + outputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, sourceEndpoint, { anchor: [ 1, 0.65, -1, -1 ], uuid: "Window" + processor.processorID + "Source_" + outputNodeKeys[1] });
		}
		else if(outputNodeKeys.length == 1)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, sourceEndpoint, { anchor: "RightMiddle", uuid: "Window" + processor.processorID + "Source_" + outputNodeKeys[0] });
		}

		if(inputNodeKeys.length == 3)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, targetEndpoint, { anchor: [ 0, 0.25, -1, -1 ], uuid: "Window" + processor.processorID + "Target_" + inputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, targetEndpoint, { anchor: "LeftMiddle", uuid: "Window" + processor.processorID + "Target_" + inputNodeKeys[1] });
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, targetEndpoint, { anchor: [ 0, 0.75, -1, -1 ], uuid: "Window" + processor.processorID + "Target_" + inputNodeKeys[2] });
		}
		else if(inputNodeKeys.length == 2)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, targetEndpoint, { anchor: [ 0, 0.35, -1, -1 ], uuid: "Window" + processor.processorID + "Target_" + inputNodeKeys[0] });
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, targetEndpoint, { anchor: [ 0, 0.65, -1, -1 ], uuid: "Window" + processor.processorID + "Target_" + inputNodeKeys[1] });
		}
		else if(inputNodeKeys.length == 1)
		{
			plumbInst.addEndpoint("flowchartWindow" + processor.processorID, targetEndpoint, { anchor: "LeftMiddle", uuid: "Window" + processor.processorID + "Target_" + inputNodeKeys[0] });
		}
	}

	M.updateTextFields();
}