const Schema = require('mongoose').Schema;

module.exports.engineSchema = new Schema(
{
    id: { type: String, required: true },    // name of the Engine
    route: { type: String }, // URL of the desired route (may be different than local, if it's through WS02, etc.)
    acceptsRequests: { type: Boolean, default: true }, // does the engine request ad hoc requests
    acceptsScheduledTasks: { type: Boolean, default: true }, // does the engine accept scheduled tasks
    currentState: { type: String, default: 'Running', required: true, enum: ['Running', 'Stopped', 'Flushing'] }, // the engines current state
    requestedState: { type: String, default: 'Running',  enum: ['Running', 'Stopped', 'Flushing'] }, // the state VTS has requested the engine to transition into
    messages: [{ message: String, sender: String, timestamp: { type: Date, default: Date.now }}], // Message log
    tags: [{ tag: String }], // Engine tags/chips, mainly for UI
    metadata: 
    {
        createdBy: { type: String, default: 'VTS' },
        lastUpdatedBy: { type: String, default: 'VTS' },
        createdDate: { type: Date, default: Date.now },
        lastUpdatedDate: { type: Date, default: Date.now },
        history: [{ user: String, date: { type: Date, default: Date.now }, event: String}],
        revision: { type: Number, default: 0 }
    }
},
{ collection: 'engines' });

module.exports.links = function(engine)
{
    let links = 
    [
        { rel: 'self', title: 'Fetch Engine', method: 'GET', href: '/Engines/' + engine._id },
        { rel: 'update', title: 'Update Engine', method: 'PUT', href: '/Engines/' + engine._id },
        { rel: 'delete', title: 'Delete Engine', method: 'DELETE', href: '/Engines/' + engine._id },
        { rel: 'update', title: 'Send general message to Engine', method: 'PUT', href: '/Engines/' + engine._id + '/Message' },
        { rel: 'update', title: 'Start Engine', method: 'PUT', href: '/Engines/' + engine._id + '/Start' },
        { rel: 'update', title: 'Halt Engine', method: 'PUT', href: '/Engines/' + engine._id + '/Stop' },
        { rel: 'update', title: 'Flush Engine Queue', method: 'PUT', href: '/Engines/' + engine._id + '/Flush' }
    ];

    engine.links = links;
};