const Queue      = require('./queue');
const mongoose   = require('mongoose');

const requestModel  = require('../model/request');
const requestSchema = requestModel.requestSchema;
const Request       = mongoose.model('Request', requestSchema);
const engineModel   = require('../model/engine');
const engineSchema  = engineModel.engineSchema;
const Engine        = mongoose.model('Engine', engineSchema);

let EngineController = function(engine)
{
    this.engine = engine;
    this.queue = new Queue();
    this.flushing = false;
};

EngineController.prototype.enqueue = function(request)
{
    this.queue.enqueue(request);

    Engine.findById(this.engine._id).then(refreshedEngine =>
    {
        this.engine = refreshedEngine;
        this.engine.messages.push({message: 'Queued request ' + request.name, sender: 'VTS', timestamp: new Date()});
        this.engine.save();
    });
}

EngineController.prototype.flush = function()
{
    this.flushing = true;
    // if there is a running process
    // kill the worker thread

    // empty the queue if anything is on it
    // make sure to update the requests so
    // they're pushed back to VTS to reassign
    while (!queue.isEmpty())
    {
        let request = queue.dequeue();
        request.status = "Submitted";
        request.engine = '';
        request.metadata.revision += 1;
        request.metadata.history.push({ user: 'VTS', date: new Date(), event: 'Request flushed and De-Queued by engine ' + engine.name });
        // refetch request, in case it's out of sync
        request.save();
    }

    queue = new Queue();

    this.flushing = false;
}

module.exports = EngineController;