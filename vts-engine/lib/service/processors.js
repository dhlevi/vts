const mongoose      = require('mongoose');
const requestModel  = require('../model/request');
const requestSchema = requestModel.requestSchema;
const Request       = mongoose.model('Request', requestSchema);

const { Worker } = require('worker_threads');

module.exports.requestProcessor = async function(request)
{
    return new Promise((resolve, reject) =>
    {
        request = JSON.parse(JSON.stringify(request));

        let worker = new Worker('./lib/service/requestWorker.js');

        worker.on('online', () => console.log(`Request Worker ${request.name} started...`) );
        worker.on('error', code =>
        {
            reject(new Error(`Worker error with exit code ${code}`));
        });
        worker.on('message', (data) =>
        {
            // update the request

            if (data && data.hasOwnProperty('_id'))
            {
                Request.findById(data._id).then(req =>
                {
                    if (data.status === 'In Progress' && (req.status === 'Complete' || req.status === 'Failed'))
                    {
                        console.log(`Request Worker ${request.name} update requested out of sync. Ignoring`);
                    }
                    else
                    {
                        console.log(`Request Worker ${request.name} updated request to DB. State: ${data.status}`)
                        req.update(data).catch(err => console.log(err));
                    }
                });
            }
            else
            {
                console.log(data);
            }
        });
        worker.on('exit', code =>
        {
            console.log(`Request Worker ${request.name} stopped with exit code ${code}`);
            resolve(code);
        });
    
        worker.postMessage(request);
    });
};