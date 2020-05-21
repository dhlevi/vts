const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    let type = processor.attributes.dataType;
    let results = type.toLowerCase() === 'point'        ? turf.randomPoint(1) :
                  type.toLowerCase().startsWith('line') ? turf.randomLineString(1) :
                  type.toLowerCase() === 'polygon'      ? turf.randomPolygon(1) : 
                  null;

    // attach resulting blob to the processor 'features' output node.    
    // and/or write all features to the cache, and attach only the "id"
    processor.outputNodes.features = [];
    results.features.forEach(feature => 
    {
        // generate an ID
        let id = uuidv4();
        processor.outputNodes.features.push(id);
        // shove the feature on the disk
        let data = JSON.stringify(feature);

        let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
        // create the directory structure
        fs.mkdirSync(cachePath, { recursive: true }, function(err) 
        {
            if (err && err.code != 'EEXIST') throw err;
        });

        fs.writeFileSync(cachePath + '/' + id + '.json', data, (err) => 
        {
            if (err) throw err;
        });
    });
};