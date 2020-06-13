function login()
{
    let user = $('#name').val();
    let password = $('#password').val();

    $.ajax
    ({
        url: '../Users/Login',
        type: "post",
        data: JSON.stringify({ name: user, password: password }),
        dataType: 'json',
        contentType:'application/json',
        crossDomain: true,
        withCredentials: true,
        success: function (authenticatedUser)
        {
            // go to appropriate page with authenticated user info
            if (authenticatedUser.role === 'admin')
            {
                window.location.replace("./index.html?token=" + authenticatedUser.accessToken);
            }
            else
            {
                window.location.replace("./public.html?token=" + authenticatedUser.accessToken);
            }
        },
        error: function (status)
        {   
            M.toast({ html: 'ERROR: Could not authenticate!'});
        }
    });
}