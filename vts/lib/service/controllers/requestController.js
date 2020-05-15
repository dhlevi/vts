const mongoose = require('mongoose');
const rp       = require('request-promise-native');

// schemas
const engineModel   = require('../../model/engine');
const engineSchema  = engineModel.engineSchema;
const Engine        = mongoose.model('Engine', engineSchema);
const requestModel  = require('../../model/request');
const requestSchema = requestModel.requestSchema;
const Request       = mongoose.model('Request', requestSchema);

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
            Request.find({ scheduledTask: false }).then(requests =>
            {
                let results = JSON.parse(JSON.stringify(requests));

                requests.forEach(request =>
                {
                    requestModel.links(request);
                });

                res.json(results);
            })
            .catch(err =>
            {
                console.error(err);
                res.writeHead(500);
                res.end();
            });
        }
        catch(err)
        {
            console.error(err);
            res.writeHead(500);
            res.end();
        }
    });

    this.app.get("/Requests/Counts", async (req, res, next) => 
    {
        try
        {
            let now = new Date();
            let dateFilter = 
            {
                $gte: new Date(new Date().getFullYear(),new Date().getMonth() , new Date().getDate())
            }

            Promise.all([Request.count({ 'metadata.createdDate': dateFilter }), 
                         Request.count({ status: 'Submitted', 'metadata.createdDate': dateFilter }), 
                         Request.count({ status: 'Queued', 'metadata.createdDate': dateFilter }), 
                         Request.count({ status: 'In Progress', 'metadata.createdDate': dateFilter }),
                         Request.count({ status: 'Completed', 'metadata.createdDate': dateFilter }),
                         Request.count({ status: 'Failed', 'metadata.createdDate': dateFilter })])
            .then((vals) => 
            {
                res.json(vals);
            });
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
            let requestData = req.body;
            // validate request

            // find an elidgable engine
            Engine.find({ acceptsRequests: true })
            .then(existingEngines => 
            {
                // send to mongo
                let newRequest = new Request(requestData);
                newRequest.status = 'Submitted';
                newRequest.engine = existingEngines[0].id;

                newRequest.save().then(savedRequest =>
                {
                    requestModel.links(savedRequest);
                    res.json(savedRequest);
                })
                .catch(err =>
                {
                    console.error(err);
                    res.writeHead(500);
                    res.end();
                });
            })
            .catch(err =>
            {
                console.error(err);
                res.writeHead(500);
                res.end();
            });
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
            Request.findById(req.params.id).then(request =>
            {
                if (request) 
                {
                    let results = JSON.parse(JSON.stringify(request));
                    requestModel.links(results);
                    res.json(results);
                }
                else
                {
                    res.writeHead(404);
                    res.end();
                }
            })
            .catch(err =>
            {
                console.error(err);
                res.writeHead(500);
                res.end();
            });
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
            Request.findById(req.params.id).then(request =>
            {
                if (request) 
                {
                    request.delete().then(deletedResult =>
                    {
                        res.json(deletedResult);
                    })
                    .catch(err =>
                    {
                        console.error(err);
                        res.writeHead(500);
                        res.end();
                    });
                }
                else
                {
                    res.writeHead(404);
                    res.end();
                }
            })
            .catch(err =>
            {
                console.error(err);
                res.writeHead(500);
                res.end();
            });
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
        { rel: 'create', title: 'Create Request', method: 'POST', href: '/Requests' },
        { rel: 'stats', title: 'Counts of current request status', method: 'GET', href: '/Requests/Counts' }
    ];

    return links;
}

module.exports = RequestController;