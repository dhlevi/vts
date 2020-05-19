const mongoose = require('mongoose');
const rp       = require('request-promise-native');

// schemas
const engineModel   = require('../../model/engine');
const engineSchema  = engineModel.engineSchema;
const Engine        = mongoose.model('Engine', engineSchema);
const requestModel  = require('../../model/request');
const requestSchema = requestModel.requestSchema;
const Request       = mongoose.model('Request', requestSchema);

module.exports.requestProcessor = async function()
{
    // every x minuts, cycle through all requests.
    
    // If a request is stalled (not queued for an excessive period)
    // move it to a new engine

    // if a request is expired (completed/failed for x minutes)
    // delete the request. Delete cache. Delete any disk cache

    setInterval(async function ()
    {
        Request.find({  scheduledTask: false }).then(requests =>
        {
            // increment running requests when a request is dequeued
            requests.forEach(request =>
            {
                // stalled requests. Submitted, but not queued for 5 minutes, so move it to a live engine
                if (request.status === 'Submitted' && request.engine && request.engine !== '' && Math.abs(new Date() - request.metadata.createdDate) > 300000)
                {
                    request.engine = '';
                    request.save(updatedRequest =>
                    {
                        Engine.find({ acceptsRequests: true, currentState: 'Running', requestedState: 'Running' })
                        .then(existingEngines => 
                        {
                            updatedRequest.status = 'Submitted';
                            updatedRequest.engine = existingEngines[0].id; // change to get least busy engine, not first on the list

                            updatedRequest.save()
                            .catch(error =>
                            {
                                console.log('Faild to update request engine: ' + error);
                            });
                        })
                        .catch(error =>
                        {
                            console.log('Faild to find engines: ' + error);
                        });
                    })
                    .catch(error =>
                    {
                        console.log('Faild to update request: ' + error);
                    });
                }
                // Request was completed, and it's now 30 minutes+ old since we last saw an update, so delete it
                else if ((request.status === 'Completed' || request.status === 'Failed') && Math.abs(new Date() - request.metadata.lastUpdatedDate) > 1800000)
                {
                    request.remove();
                    // delete cache objects
                }
            });
        })
        .catch(error =>
        {
            console.log('Faild to fetch requests: ' + error);
        });
    }, 300000); // five mins cycle
};