// Note: Electron doesn't currently support worker threads... :(
let requestWorker = require(process.cwd() + '/lib/service/requestWorker.js');
let rimraf = require('rimraf');

module.exports.requestProcessor = async function(request)
{
    // clear cache
    let cacheDir = process.cwd() + '/cache/';
    return await rimraf(cacheDir, async function () 
    { 
        request = JSON.parse(JSON.stringify(request));
        request.metadata = {};
        request.metadata.history = [];
       return await requestWorker.processRequest(request);
    });
};