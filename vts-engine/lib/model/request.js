const Schema = require('mongoose').Schema;
const processorSchema = require('./processor').processorSchema;

module.exports.requestSchema = new Schema(
{
    priority: { type: Number, default: 3 },    // Request priority, from 1 through whatever
    name: { type: String, default: '' }, // name for the request, for searching
    public: { type: Boolean, default: true }, // Allow this request to be visible to any user
    processors: [{ type: processorSchema }], // The set of processors to run. One of these must contain some geometry!
    status: { type: String, enum: ['Created', 'Submitted', 'Queued', 'In Progress', 'Completed', 'Failed'], required: true },
    // for scheduled tasks, interval is a number, invernalUnit is the unit of measure
    // possible values are Seconds, Minutes, Hours, Days
    scheduledTask: { type: Boolean },
    description: { type: String },
    interval: { type: Number },
    intervalUnit: { type: String, enum: ['Seconds', 'Minutes', 'Hours', 'Days'] },
    nextRunTime: { type: Date, default: Date.now },
    messages: [{ message: String, sender: String, timestamp: { type: Date, default: Date.now }}], // Message log
    tags: [{ tag: String }], // Engine tags/chips, mainly for UI
    cachePurged: { type: Boolean, default: false },
    engine: { type: String, required: true },
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
{ collection: 'requests' });

module.exports.links = function(request)
{
    let links = 
    [
        { rel: 'self', title: 'Fetch Request', method: 'GET', href: '/Requests/' + request._id },
        { rel: 'delete', title: 'Delete Request', method: 'DELETE', href: '/Requests/' + request._id },
    ];

    request.links = links;
};