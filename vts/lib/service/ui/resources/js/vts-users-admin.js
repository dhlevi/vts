function loadUsers()
{
    $.ajax
	({
		url: serviceUrl + 'Users',
        type: "get",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + app.user);
        },
		success: function (users)
		{
            app.users = users;
        },
        error: function (status)
		{   
            M.toast({ html: 'ERROR: Couldnt load users'});
		}
    });
}

function getUser(user)
{
    $.ajax
	({
		url: serviceUrl + 'Users/' + user,
        type: "get",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + app.user);
        },
		success: function (selectedUser)
		{
            app.selectedUser = selectedUser;
        },
        error: function (status)
		{   
            M.toast({ html: 'ERROR: Couldnt load users'});
		}
    });
}

function saveUser()
{
    refresh = true;

    $.ajax
	({
		url: serviceUrl + 'Users' + (app.selectedUser._id ? ('/' + app.selectedUser._id) : ''),
        type: app.selectedUser._id ? "put" : "post",
        data: JSON.stringify(app.selectedUser),
        dataType: 'json',
        contentType:'application/json',
        crossDomain: true,
        withCredentials: true,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + app.user);
        },
		success: function (selectedUser)
		{
            app.selectedUser = selectedUser;
            app.tabSwitch('users');
        },
        error: function (status)
		{   
            M.toast({ html: 'ERROR: Couldnt save user'});
		}
    });
}

function deleteUser(user)
{
    $.ajax
	({
		url: serviceUrl + 'Users/' + user,
        type: "delete",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + app.user);
        },
		success: function (status)
		{
            M.toast({ html: 'User deleted'});
        },
        error: function (status)
		{   
            M.toast({ html: 'ERROR: Couldnt load users'});
		}
    });
}

function editUser(user)
{
    $.ajax
	({
		url: serviceUrl + 'Users/' + user,
        type: "get",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + app.user);
        },
		success: function (selectedUser)
		{
            refresh = false;
            delete selectedUser.password;
            app.selectedUser = selectedUser;
            app.tabSwitch('edit-user');
        },
        error: function (status)
		{   
            M.toast({ html: 'ERROR: Couldnt load users'});
		}
    });
}

function createUser()
{
    refresh = false;
    app.selectedUser = { name: '', password: '', email: '', role: 'public'};
    app.tabSwitch('edit-user');
}