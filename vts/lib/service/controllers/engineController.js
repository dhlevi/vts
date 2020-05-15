const mongoose = require('mongoose');
const rp       = require('request-promise-native');
const request  = require('request');

// schemas
const engineModel = require('../../model/engine');
const engineSchema = engineModel.engineSchema;
const Engine = mongoose.model('Engine', engineSchema);

let EngineController = function(app)
{
    this.app = app;
};

EngineController.prototype.init = async function()
{
    this.app.get("/Engines", async (req, res, next) => 
    {
        try
        {
            Engine.find()
            .then(async existingEngines => 
            {
                // poor mans clone
                let result = JSON.parse(JSON.stringify(existingEngines));
                // fetch engine stats if route exists
                for(let idx in result)
                {
                    let engine = result[idx];
                    engineModel.links(engine);

                    if (engine.route && engine.route.length > 0)
                    {
                        let engineData = await rp(engine.route)
                                               .then(function (result) {
                                                    return JSON.parse(result);
                                               })
                                               .catch(function (err) {
                                               });

                        engine['runningRequests'] = engineData.runningRequests;
                        engine['queuedRequests'] = engineData.queuedRequests;
                        engine['uptime'] = engineData.uptime;
                        engine['totalRequests'] = engineData.totalRequests;
                        engine['maxMemory'] = engineData.maxMemory;
                        engine['usedMemory'] = engineData.usedMemory;
                    }
                }

                res.json(result);
            })
            .catch(err =>
            {
                console.log('Failed to fetch engines from Database');
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

    this.app.get("/Engines/:id", (req, res, next) => 
    {
        try
        {
            Engine.findById(req.params.id)
            .then(engine =>
            {
                if (engine)
                {
                    // fetch the engine toplevel stats as well?

                    engineModel.links(engine);
                    res.json(engine);
                }
                else
                {
                    res.writeHead(404);
                    res.end();
                }
            })
            .catch(err =>
            {
                console.log('Failed to fetch engine from Database');
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

    this.app.put("/Engines/:id", (req, res, next) => 
    {
        try
        {
            // can only update route, acceptsRequests, acceptsScheduledTasks and tags
            Engine.findById(req.params.id)
            .then(engine =>
            {
                if (engine && engine.metadata.revision === req.body.metadata.revision)
                {
                    if (engine.route && !req.body.route)
                    {
                        engine.messages.push({ sender: 'VTS', message: 'The engines route has been updated to ' + req.body.route + '. This engine is now registered.', timestamp: new Date()});
                    }

                    engine.route = req.body.route;
                    
                    if (engine.acceptsRequests && !req.body.acceptsRequests)
                    {
                        engine.messages.push({ sender: 'VTS', message: 'The engine will no longer accept Ad-Hoc requests', timestamp: new Date()});
                    }
                    else if (!engine.acceptsRequests && req.body.acceptsRequests)
                    {
                        engine.messages.push({ sender: 'VTS', message: 'The engine will now accept Ad-Hoc requests', timestamp: new Date()});
                    }

                    engine.acceptsRequests = req.body.acceptsRequests;

                    if (engine.acceptsScheduledTasks && !req.body.acceptsScheduledTasks)
                    {
                        engine.messages.push({ sender: 'VTS', message: 'The engine will no longer accept scheduled task requests', timestamp: new Date()});
                    }
                    else if (!engine.acceptsScheduledTasks && req.body.acceptsScheduledTasks)
                    {
                        engine.messages.push({ sender: 'VTS', message: 'The engine will now accept scheduled task requests', timestamp: new Date()});
                    }

                    engine.acceptsScheduledTasks = req.body.acceptsScheduledTasks;

                    // metadata
                    engine.metadata.revision = req.body.metadata.revision + 1;
                    engine.metadata.lastUpdatedBy = 'VTS';
                    engine.metadata.lastUpdatedDate = new Date();
                    engine.metadata.history.push({ user: 'VTS', date: new Date(), event: 'Engine Updated' });

                    engine.save().then(updatedEngine =>
                    {
                        engineModel.links(updatedEngine);
                        res.json(updatedEngine);
                    })
                    .catch(error =>
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
            .catch(error =>
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

    this.app.put("/Engines/:id/Message", (req, res, next) => 
    {
        try
        {
            let sender = req.body.sender;
            let message = req.body.message;

            Engine.findById(req.params.id).then(engine => 
            {
                if (engine)
                {
                    engine.messages.push({ message: message, sender: sender, timestamp: new Date() });
                    engine.save().then(updatedEngine => 
                    {
                        engineSchema.links(updatedEngine);
                        res.json(updatedEngine);
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

    this.app.delete("/Engines/:id", (req, res, next) => 
    {
        try
        {
            Engine.findById(req.params.id)
            .then(engine =>
            {
                if (engine)
                {
                    engine.delete();

                    // should also delete any engine related cache
                    // and update any scheduled tasks or requests that
                    // are set to use this engine to use another one?

                    // This process may cause the engine API to crash
                    // and shut down the pod

                    res.json(engine);
                }
                else
                {
                    res.writeHead(404);
                    res.end();
                }
            })
            .catch(err =>
            {
                console.log('Failed to fetch engine from Database');
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

    this.app.put("/Engines/:id/Start", (req, res, next) => 
    {
        try
        {
            Engine.findById(req.params.id)
            .then(engine =>
            {
                if (engine)
                {
                    engine.requestedState = 'Running';
                    engine.save();

                    engineModel.links(engine);
                    res.json(engine);
                }
                else
                {
                    res.writeHead(404);
                    res.end();
                }
            })
            .catch(err =>
            {
                console.log('Failed to fetch engine from Database');
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

    this.app.put("/Engines/:id/Stop", (req, res, next) => 
    {
        try
        {
            Engine.findById(req.params.id)
            .then(engine =>
            {
                if (engine)
                {
                    engine.requestedState = 'Stopped';
                    engine.save();

                    // if we have the engine's route, we can send a direct API request to halt?
                    engineModel.links(engine);
                    res.json(engine);
                }
                else
                {
                    res.writeHead(404);
                    res.end();
                }
            })
            .catch(err =>
            {
                console.log('Failed to fetch engine from Database');
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

    this.app.put("/Engines/:id/Flush", (req, res, next) => 
    {
        try
        {
            Engine.findById(req.params.id)
            .then(engine =>
            {
                if (engine)
                {
                    engine.requestedState = 'Flushing';
                    engine.save();
                    
                    engineModel.links(engine);
                    res.json(engine);
                }
                else
                {
                    res.writeHead(404);
                    res.end();
                }
            })
            .catch(err =>
            {
                console.log('Failed to fetch engine from Database');
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

EngineController.prototype.links = function()
{
    let links = 
    [
        { rel: 'fetch', title: 'Find Engines', method: 'GET', href: '/Engines' }
    ];

    return links;
}

module.exports = EngineController;