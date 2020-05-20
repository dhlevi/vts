const mongoose   = require('mongoose');
// Processors
const httpReader    = require('./processors/httpReader');
const fileReader    = require('./processors/fileReader');
const randomFeature = require('./processors/randomReader');
const projector     = require('./processors/projector');
const coordCleaner  = require('./processors/cleanCoords');
const buffer  = require('./processors/buffer');
// schemas
const engineModel   = require('../model/engine');
const engineSchema  = engineModel.engineSchema;
const Engine        = mongoose.model('Engine', engineSchema);
const requestModel  = require('../model/request');
const requestSchema = requestModel.requestSchema;
const Request       = mongoose.model('Request', requestSchema);

module.exports.requestProcessor = async function(request)
{
    // update request status
    request.status = 'In Progress';
    request.metadata.lastUpdatedDate = new Date();
    request.metadata.lastUpdatedBy = request.Engine;
    request.metadata.revision += 1;
    request.messages.push({ message: 'Started processing Request', sender: request.Engine, timestame: new Date() });
    request.metadata.history.push({ event: 'Request Dequeued', user: request.Engine, date: new Date() });
    request = await request.save();

    // cycle through processors
    let completedProcessors = 0;
    let failed = false;
    while (completedProcessors !== request.processors.length)
    {
        for (let idx in request.processors)
        {
            let processor = request.processors[idx];
            if (!processor.processed)
            {
                try
                {
                    await runProcessor(processor, request);
                }
                catch(error)
                {
                    console.log('Error occured during processing: ' + error);
                    failed = true;
                    completedProcessors = request.processors.length;
                    request.messages.push({ message: 'Error occured during processing of processor ' + processor.name + ':' + processor.type + '. Error: ' + error, sender: request.Engine, timestame: new Date()});
                    break;
                }
            }
            else
            {
                completedProcessors++;
            }
        }

        if (failed)
        {
            break;
        }
    }

    // we're done. Update and close off
    request.status = failed ? 'Failed' : 'Completed';
    request.metadata.lastUpdatedDate = new Date();
    request.metadata.lastUpdatedBy = request.Engine;
    request.metadata.revision += 1;
    request.messages.push({ message: failed ? 'Request processing failed due to errors' : 'Successfully processed Request', sender: request.Engine, timestame: new Date()});
    request.metadata.history.push({ event: 'Request completed', user: request.Engine, date: new Date() });
    request = request.save();
};

async function runProcessor(processor, request)
{
    // Are the input nodes complete? If not, run them first.
    let inputNodes = Object.keys(processor.inputNodes);
    inputNodes.forEach(key =>
    {

        // each input node (usually only one, 'features') will be an
        // array of their ID and type, so "23" and node "features"
        // So to check completion, we need to loop through input nodes
        // then for each key, loop through their processors
        // output nodes are just for holding feature ID's
        processor.inputNodes[key].forEach(node =>
        {
            // use node.name to find the node and check if it's complete?
            for(let idx in request.processors)
            {
                let inputProcessor = request.processors[idx];
                if (node.name === inputProcessor.name && !inputProcessor.processed)
                {
                    runProcessor(inputProcessor, request);
                }
            }
        });
    });

    // input nodes are complete, so now we can run this process

    // features is the array storing all resulting feature ID's for the process. This is attached to the processor output
    // This requires all processors to be very specific on their implementation
    // of the process method! processor file names must match type 100%
    await require('./processors/' + processor.type).process(request, processor);
    
    // not implemented types
    switch(processor.type)
    {
        case 'dbReader':
            // Not implemented yet!
            /*processor.attributes.connection = '';
            processor.attributes.source = 'oracle'; // oracle, postgres, mongo, couch, h2, mysql
            processor.attributes.user = '';
            processor.attributes.password = '';
            processor.attributes.sourceTable = '';
            processor.attributes.sourceProjection = '';*/
        break;
        case 'difference':
            processor.inputNodes['clipper'] = [];
        break;
        case 'dissolve':
            
        break;
        case 'intersect':
            processor.inputNodes['intersector'] = [];
        break;
        case 'simplify':
            
        break;
        case 'tesselate':
            
        break;
        case 'union':
            
        break;
        case 'scale':
            processor.attributes.factor = 1;
            processor.attributes.location = 'centroid'; // sw/se/nw/ne/center/centroid
        break;
        case 'rotate':
            processor.attributes.angle = 0;
        break;
        case 'translate':
            processor.attributes.distance = 0;
            processor.attributes.direction = 0;
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
        break;
        case 'bezierCurve':
            processor.outputNodes['curves'] = [];
        break;
        case 'lineChunk':
            processor.attributes.length = 0;
            processor.attributes.reverse = false;
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
        break;
        case 'sector':
            processor.outputNodes['sectors'] = [];
        break;
        case 'tin':
            processor.outputNodes['tin'] = [];
        break;
        case 'along':
            processor.attributes.length = 0;
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
            processor.outputNodes['points'] = [];
        break;
        case 'area':
            processor.attributes.fieldName = 'AREA_SQ_M';
        break;
        case 'bearing':
            processor.inputNodes['bearingPoints'] = [];
            processor.attributes.fieldName = 'BEARING';
        break;
        case 'donutExtractor':
            processor.outputNodes['donuts'] = [];
        break;
        case 'center':
            processor.outputNodes['centers'] = [];
        break;
        case 'centerOfMass':
            processor.outputNodes['centers'] = [];
        break;
        case 'centerAll':
            processor.outputNodes['centers'] = [];
        break;
        case 'centerOfMassAll':
            processor.outputNodes['centers'] = [];
        break;
        case 'centroid':
            processor.outputNodes['centroids'] = [];
        break;
        case 'destination':
            processor.attributes.dstance = 0;
            processor.attributes.bearing = 0;
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
            processor.inputNodes['destinations'] = [];
            processor.attributes.fieldName = 'DESTINATION';
        break;
        case 'length':
            processor.attributes.units = 'kilometers'; // see turf. kilo, meter, mile, feet etc
            processor.attributes.fieldName = 'LENGTH';
        break;
        case 'attributeCreator':
            processor.attributes.fieldName = 'NAME';
            processor.attributes.defaultValue = '';
        break;
        case 'attributeRemover':
            processor.attributes.fieldName = 'NAME';
        break;
        case 'attributeRenamer':
            processor.attributes.fromName = 'NAME';
            processor.attributes.toName = 'NEW_NAME';
        break;
        case 'attributeCalculator':
            processor.attributes.calculation = 'NAME + NAME2';
            processor.attributes.toName = 'CALC';
        break;
        case 'timestamper':
            processor.attributes.fieldName = 'TIMESTAMP';
        break;
        case 'filter':
            processor.attributes.query = 'NAME === "Test"';
            processor.outputNodes['false'] = [];
        break;
        case 'spatialFilter':
            processor.attributes.type = 'Polygon'; // point, line, poly, multi's
            processor.outputNodes['false'] = [];
        break;
        case 'spatialRelationFilter':
            processor.attributes.type = 'intersects'; // within, contains, intersects, touches
            processor.inputNodes['relator'] = [];
            processor.outputNodes['false'] = [];
        break;
        case 'fileWriter':
            processor.attributes.path = '';
            processor.attributes.dataType = 'json'; // json, shape, fgdb, csv, kml, kmz, wkt, gml
        break;
        case 'httpWriter':
            processor.attributes.url = '';
            processor.attributes.dataType = 'json'; // json, shape, fgdb, csv, kml, kmz, wkt, gml
            processor.attributes.upsert = false; // upsert means we'll put for existig, insert for new. If false, always post
        break;
        case 'dbWriter':
            processor.attributes.connection = '';
            processor.attributes.source = 'oracle'; // oracle, postgres, mongo, couch, h2, mysql
            processor.attributes.user = '';
            processor.attributes.password = '';
            processor.attributes.destinationTable = '';
            processor.attributes.upsert = false;
        break;
    }

    processor.processed = true;
}