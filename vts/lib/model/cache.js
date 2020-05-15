const Schema = require('mongoose').Schema;
const geojsonSchemas = require('./geojson');

module.exports.cacheSchema = new Schema(
{
    request: { type: require('mongoose').Types.ObjectId, required: true},
    processor: { type: String, required: true },
    geometry: { type: Object, required: true },
    metadata: 
    {
        createdBy: { type: String, default: 'VTS' },
        createdDate: { type: Date, default: Date.now }
    }
},
{ collection: 'cache' });