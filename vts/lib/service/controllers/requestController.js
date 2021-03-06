const mongoose   = require('mongoose');
const rp         = require('request-promise-native');
const Projector  = require('../../helpers/projector')
const utils      = require('../../helpers/utils');
const validation = require('../middleware/auth.validation.middleware');
// schemas
const engineModel   = require('../../model/engine');
const engineSchema  = engineModel.engineSchema;
const Engine        = mongoose.model('Engine', engineSchema);
const requestModel  = require('../../model/request');
const requestSchema = requestModel.requestSchema;
const Request       = mongoose.model('Request', requestSchema);
const cacheModel     = require('../../model/cache');
const cacheSchema    = cacheModel.cacheSchema;
const Cache          = mongoose.model('Cache', cacheSchema);

let RequestController = function(app)
{
    this.app = app;
    this.totalRequests = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    this.runningRequests = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
};

RequestController.prototype.init = function()
{
    this.app.get("/Requests", [validation.validJWTNeeded, validation.requiredRole('public')], (req, res, next) => 
    {
        try
        {
            let text     = req.query.text             || null;
            let page     = Number(req.query.page)     || 0;
            let pageSize = Number(req.query.pageSize) || 10;
            let status   = req.query.status           || ['Submitted', 'Queued', 'In Progress', 'Completed', 'Failed'];
            let tasks    = req.query.tasks === 'true' || false;

            let aggregate = [];
            let match = 
            {
                $match: 
                {
                    scheduledTask: tasks,
                    status: Array.isArray(status) ? { $in: status } : status
                }
            };

            if(req.jwt.role === 'public')
            {
                match.$match['metadata.createdBy'] = req.jwt.name;
            }

            aggregate.push(match);

            if (text)
            {
                match.$match.$text = { $search: text, $caseSensitive: false };

                aggregate.push({
                    $addFields: { score: { $meta: 'textScore' } }
                });

                aggregate.push(
                {
                    $sort: { 'score': -1 }
                });
            }
            else
            {
                aggregate.push(
                {
                    $sort: { 'nextRunTime': 1 }
                });
            }

            aggregate.push(
            {
                $facet: 
                {
                    searchResults: [ { $skip: page * pageSize }, { $limit: pageSize }],
                    meta: [ { $count: 'searchResultsTotal' } ]
                }
            });

            Request.aggregate(aggregate).exec().then(requests =>
            {
                let results = JSON.parse(JSON.stringify(requests[0].searchResults));

                results.forEach(request =>
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

    this.app.get("/Requests/Counts", [validation.validJWTNeeded, validation.requiredRole('public')], async (req, res, next) => 
    {
        try
        {
            let dateFilter = 
            {
                $gte: new Date(new Date().getFullYear(),new Date().getMonth() , new Date().getDate())
            }

            Promise.all([Request.count({ scheduledTask: false, 'metadata.createdDate': dateFilter }), 
                         Request.count({ scheduledTask: false, status: 'Submitted', 'metadata.createdDate': dateFilter }), 
                         Request.count({ scheduledTask: false, status: 'Queued', 'metadata.createdDate': dateFilter }), 
                         Request.count({ scheduledTask: false, status: 'In Progress', 'metadata.createdDate': dateFilter }),
                         Request.count({ scheduledTask: false, status: 'Completed', 'metadata.createdDate': dateFilter }),
                         Request.count({ scheduledTask: false, status: 'Failed', 'metadata.createdDate': dateFilter })])
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

    this.app.post("/Requests", [validation.validJWTNeeded, validation.requiredRole('public')], (req, res, next) => 
    {
        try
        {
            let requestData = req.body;
            // validate request

            let search = { acceptsRequests: true, currentState: 'Running', requestedState: 'Running' };

            if (requestData.scheduledTask)
            {
                search.acceptsScheduledTasks = true;
                delete search.acceptsRequests;
                delete search.currentState;
                delete search.requestedState;
            }
            Engine.find(search)
            .then(existingEngines => 
            {
                // send to mongo
                delete requestData._id;
                let newRequest = new Request(requestData);
                newRequest.metadata.createdBy = req.jwt.name;
                newRequest.status = !newRequest.status ? newRequest.status = 'Submitted' : newRequest.status;
                // name cannot contain special chars, spaces, etc. Lower case, remove special, and replace space with dash
                newRequest.name = newRequest.name.replace(/[^a-zA-Z0-9 -]/g, '').toLowerCase().replace(/\s+/g, '-');
                // pick the least busy engine, not a random one...
                
                newRequest.engine = existingEngines.length === 1 ? existingEngines[Math.floor(Math.random() * Math.floor(existingEngines.length - 1))].id
                                                                 : existingEngines[0];

                newRequest.save().then(savedRequest =>
                {
                    requestModel.links(savedRequest);
                    res.status(201).send(savedRequest);
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

    this.app.get("/Requests/:id", [validation.validJWTNeeded, validation.requiredRole('public')], (req, res, next) => 
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

    this.app.put("/Requests/:id", [validation.validJWTNeeded, validation.requiredRole('public')], async (req, res, next) => 
    {
        try
        {
            Request.findById(req.params.id).then(async request =>
            {
                if (request) 
                {
                    let updatedRequest = new Request(req.body);
                    updatedRequest.metadata.revision += 1;
                    updatedRequest.metadata.lastUpdatedDate = new Date();
                    updatedRequest.metadata.lastUpdatedBy = req.jwt.name;

                    updatedRequest = await request.update(updatedRequest);

                    let results = JSON.parse(JSON.stringify(updatedRequest));
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

    this.app.delete("/Requests/:id", [validation.validJWTNeeded, validation.requiredRole('public')], (req, res, next) => 
    {
        try
        {
            Request.findById(req.params.id).then(request =>
            {
                if (request) 
                {
                    request.remove().then(deletedResult =>
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

    this.app.get("/Cache/:name/:node", (req, res, next) => 
    {
        try
        {
            let query = { request: req.params.name, processor: req.params.node };
            let bbox = [-180, -90, 180, 90];

            // bbox &BBOX=-180,-90,180,90
            if (req.query.bbox)
            {
                let coords = req.query.bbox.split(','); // [-180, -90, 180, 90]
                bbox = [Number(coords[0].trim()), Number(coords[1].trim()), Number(coords[2].trim()), Number(coords[3].trim())];
                query['feature.geometry'] =
                {
                    $geoWithin: {
                        $geometry: {
                            type: 'Polygon',
                            coordinates: [[
                              [bbox[0], bbox[1]],
                              [bbox[2], bbox[1]],
                              [bbox[2], bbox[3]],
                              [bbox[0], bbox[3]],
                              [bbox[0], bbox[1]]
                            ]]
                        }
                    }
                };
            }

            Cache.find(query).then(async cacheFeatures =>
            {
                let features = [];

                for (let i = 0; i < cacheFeatures.length; i++)
                {
                    let cache = cacheFeatures[i];

                    if (cache && cache.feature && cache.feature.geometry)
                    {
                        // CRS=epsg:4326
                        if (req.query.crs && req.query.crs.includes(':'))
                        {
                            let sourceProjection = cache.feature.crs ? cache.feature.crs.properties.name : 'EPSG:4326';
                            let destProjection = await utils.getHttpRequest('https://epsg.io/' + req.query.crs.split(':')[1] + '.esriwkt');
                            let projector = new Projector(sourceProjection, destProjection);
                            // project!
                            if (sourceProjection.toLowerCase() !== req.query.crs.toLowerCase())
                            {
                                projector.project(cache.feature.geometry);
                                
                                cache.feature.crs = 
                                {
                                    type: 'link',
                                    properties: {
                                        href: 'https://epsg.io/' + req.query.crs.split(':')[1] + '.esriwkt',
                                        type: 'wkt'
                                    }
                                };
                            }
                        }

                        features.push(cache.feature);
                    }
                }

                let featureCollection = 
                {
                    type: 'FeatureCollection',
                    bbox: bbox,
                    features: features
                }

                res.json(featureCollection);
            })
            .catch(err =>
            {
                console.error(err);
                res.writeHead(404);
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
        { rel: 'stats', title: 'Counts of current request status', method: 'GET', href: '/Requests/Counts' },
        { rel: 'fetch', title: 'Cache writer values', method: 'GET', href: '/Cache/:name/:node' }
    ];

    return links;
}

module.exports = RequestController;