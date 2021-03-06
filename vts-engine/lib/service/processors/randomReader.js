const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    let items = Number(processor.attributes.items);
    let type = processor.attributes.featureType;
    let results = type.toLowerCase() === 'point'        ? turf.randomPoint(items) :
                  type.toLowerCase().startsWith('line') ? turf.randomLineString(items) :
                  type.toLowerCase() === 'polygon'      ? turf.randomPolygon(items) : 
                  null;

    // attach resulting blob to the processor 'features' output node.    
    // and/or write all features to the cache, and attach only the "id"
    processor.outputNodes.features = [];
    results.features.forEach(async feature => 
    {
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