const mongoose = require('mongoose');
const rp       = require('request-promise-native');

let TaskController = function(app)
{
    this.app = app;
    this.totalScheduledTasks = 0;
};

TaskController.prototype.init = function()
{
    this.app.get("/Tasks", (req, res, next) => 
    {
        try
        {
            res.json(['Not Implemented']);
        }
        catch(err)
        {
            console.error(err);
            res.writeHead(500);
            res.end();
        }
    });

    this.app.post("/Tasks", (req, res, next) => 
    {
        try
        {
            res.json(['Not Implemented']);
        }
        catch(err)
        {
            console.error(err);
            res.writeHead(500);
            res.end();
        }
    });

    this.app.get("/Tasks/:id", (req, res, next) => 
    {
        try
        {
            let id = req.params.id;
            res.json(['Not Implemented']);
        }
        catch(err)
        {
            console.error(err);
            res.writeHead(500);
            res.end();
        }
    });

    this.app.put("/Tasks/:id", (req, res, next) => 
    {
        try
        {
            let id = req.params.id;
            res.json(['Not Implemented']);
        }
        catch(err)
        {
            console.error(err);
            res.writeHead(500);
            res.end();
        }
    });

    this.app.delete("/Tasks/:id", (req, res, next) => 
    {
        try
        {
            let id = req.params.id;
            res.json(['Not Implemented']);
        }
        catch(err)
        {
            console.error(err);
            res.writeHead(500);
            res.end();
        }
    });
}

TaskController.prototype.links = function()
{
    let links = 
    [
        { rel: 'fetch', title: 'Find Scheduled Tasks', method: 'GET', href: '/Tasks' },
        { rel: 'create', title: 'Create Scheduled Task', method: 'POST', href: '/Tasks' }
    ];

    return links;
}

module.exports = TaskController;