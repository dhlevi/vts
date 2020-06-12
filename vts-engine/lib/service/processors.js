const mongoose      = require('mongoose');
const requestModel  = require('../model/request');
const requestSchema = requestModel.requestSchema;
const Request       = mongoose.model('Request', requestSchema);

const { Worker } = require('worker_threads');

module.exports.requestProcessor = async function(request, engineRoute, mongodbConnection)
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
                    console.log(`Request Worker ${request.name} updated request to DB. State: ${data.status}`)
                    req.update(data, updatedReq => req = updatedReq).catch(err => console.log(err));
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

            Request.findById(request._id).then(req =>
            {
                if (req.status === 'In Progress')
                {
                    req.status = 'Completed';
                    req.save();
                }
            });

            resolve(code);
        });
    
        // set forwarded virtuals
        request['engineRoute'] = engineRoute;
        request['mongodbConnection'] = mongodbConnection;
        
        worker.postMessage(request);
    });
};