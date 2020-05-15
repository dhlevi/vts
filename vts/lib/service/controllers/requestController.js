const mongoose = require('mongoose');
const rp       = require('request-promise-native');

let RequestController = function(app)
{
    this.app = app;
    this.totalRequests = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    this.runningRequests = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
};

RequestController.prototype.init = function()
{
    this.app.get("/Requests", (req, res, next) => 
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

    this.app.post("/Requests", (req, res, next) => 
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

    this.app.get("/Requests/:id", (req, res, next) => 
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

    this.app.delete("/Requests/:id", (req, res, next) => 
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

RequestController.prototype.links = function()
{
    let links = 
    [
        { rel: 'fetch', title: 'Find Requests', method: 'GET', href: '/Requests' },
        { rel: 'create', title: 'Create Request', method: 'POST', href: '/Requests' }
    ];

    return links;
}

module.exports = RequestController;