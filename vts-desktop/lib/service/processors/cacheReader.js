const { v4: uuidv4 } = require('uuid');
const path           = require('path');
const fs             = require('fs');
const mongoose       = require('mongoose');
const cacheModel     = require('../../model/cache');
const cacheSchema    = cacheModel.cacheSchema;
const Cache          = mongoose.model('Cache', cacheSchema);


module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];
    let requestName = processor.attributes.request;
    let processorName = processor.attributes.processor;

    // Need to init mongodb connection here as we're in a worker thread.
    mongoose.connect(request.mongodbConnection, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        autoReconnect: true,
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: 500,           // Reconnect every 500ms
        poolSize: 10,                     // Maintain up to 10 socket connections
        // If not connected, return errors immediately rather than waiting for reconnect
        bufferMaxEntries: 0,
        connectTimeoutMS: 10000,          // Give up initial connection after 10 seconds
        socketTimeoutMS: 45000           // Close sockets after 45 seconds of inactivity
    });

    let query = { request: requestName };
    if (processorName && processorName.length > 0)
        query['processor'] = processorName;

    let result = await Cache.find(query).exec();
    result.forEach(async cache => 
    {
        let feature = cache.feature;
        // generate an ID
        let id = uuidv4();
        processor.outputNodes.features.push(id);
        // shove the feature on the disk
        let data = JSON.stringify(feature);

        let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
        // create the directory structure
        await fs.promises.mkdir(cachePath, { recursive: true });
        await fs.promises.writeFile(cachePath + '/' + id + '.json', data);
    });
};