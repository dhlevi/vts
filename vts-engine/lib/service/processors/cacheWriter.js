const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const mongoose       = require('mongoose');
const cacheModel     = require('../../model/cache');
const cacheSchema    = cacheModel.cacheSchema;
const Cache          = mongoose.model('Cache', cacheSchema);
const { parentPort } = require('worker_threads');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

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

    await Cache.deleteMany({ request: request.name }).exec();
    // cycle through each input node (data should be loaded by now)
    for (let idx = 0; idx < processor.inputNodes.features.length; idx++)
    {
        let inputNode = processor.inputNodes.features[idx];
        // get the files in the disk cache
        let tempPath = process.cwd() + '/cache/' + request.name + '/' + inputNode.name + '/' + inputNode.node + '/';
        let files = fs.existsSync(tempPath) ? fs.readdirSync(tempPath) : [];

        for (let i = 0; i < files.length; i++)
        {
            let file = files[i];
            // load the feature geometry, push into inputFeatures
            let filePath = path.join(tempPath, file);
            let featureString = fs.readFileSync(filePath, 'utf8');
            let feature = JSON.parse(featureString);

            // write the feature to the mongodb cache collection
            let cache = new Cache(
            {
                request: request.name,
                processor: inputNode.name,
                feature: feature,
                metadata: { createdBy: 'VTS', createdDate: new Date() }
            });
            
            cache.save();
        }
    }
};