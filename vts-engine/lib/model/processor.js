const Schema = require('mongoose').Schema;

module.exports.processorSchema = new Schema(
{
    type: { type: String }, 
    processed: { type: Boolean },
    name: { type: String }, 
    // ignorable x,y values. Used by the workflow designer in the UI only
    x: { type: Number }, 
    y: { type: Number },
    messages: [{ message: String, sender: String, timestamp: { type: Date, default: Date.now }}],
    inputNodes: { type: Object, required: true }, // the UUID's for the input nodes (where do we get our Geometry from?)
    outputNodes: { type: Object, required: true }, // the UUID's for the output nodes (Where do we send it when we're done?)
    attributes: { type: Object, required: false }
});