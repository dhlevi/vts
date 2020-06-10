const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');
const turf     = require('@turf/turf');

// schemas
const engineModel   = require('../model/engine');
const engineSchema  = engineModel.engineSchema;
const Engine        = mongoose.model('Engine', engineSchema);
const requestModel  = require('../model/request');
const requestSchema = requestModel.requestSchema;
const Request       = mongoose.model('Request', requestSchema);

let DataController = function(app, logPath)
{
    this.app = app;
    this.logPath = logPath;
};

DataController.prototype.init = function()
{
    // get the cached geojson from a completed request processor node
    this.app.get("/Requests/:id/Features/:processorId/:node", (req, res, next) => 
    {
        try
        {
            Request.find({ name: req.params.id }).then(request =>
            {
                if (request) 
                {
                    
                    let featurePath = process.cwd() + '/cache/' + req.params.id + '/' + req.params.processorId + '/' + req.params.node;
                    let files = fs.existsSync(featurePath) ? fs.readdirSync(featurePath) : [];
                    let features = [];

                    files.forEach(file =>
                    {
                        // load the feature geometry, push into inputFeatures
                        let filePath = path.join(featurePath, file);
                        let featureString = fs.readFileSync(filePath, 'utf8');
                        let feature = JSON.parse(featureString);

                        features.push(feature);
                    });

                    let featureCollection = turf.featureCollection(features);

                    res.json(featureCollection);
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

    // Get the engines logs, for viewing in the admin UI
    this.app.get("/Logs", (req, res, next) => 
    {
        try
        {
            let logFiles = fs.readdirSync(this.logPath);
            let logs = [];

            logFiles.forEach(log =>
            {
                // load the feature geometry, push into inputFeatures
                let filePath = path.join(this.logPath, log);
                let logString = fs.readFileSync(filePath, 'utf8');

                logs.push(logString);
            });

            res.json(logs);
        }
        catch(err)
        {
            console.error(err);
            res.writeHead(500);
            res.end();
        }
    });
};

DataController.prototype.links = function()
{
    let links = 
    [
    ];

    return links;
};

module.exports = DataController;