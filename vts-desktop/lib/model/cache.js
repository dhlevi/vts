const Schema = require('mongoose').Schema;
const geojsonSchemas = require('./geojson');

module.exports.cacheSchema = new Schema(
{
    request: { type: String, required: true},
    processor: { type: String, required: true },
    feature: { type: Object, required: true },
    metadata: 
    {
        createdBy: { type: String, default: 'VTS' },
        createdDate: { type: Date, default: Date.now }
    }
},
{ collection: 'cache' });