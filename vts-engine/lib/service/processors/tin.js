const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let points = [];
    // load the features
    processor.inputNodes.features.forEach(inputNode =>
    {
        // get the files in the disk cache
        let tempPath = process.cwd() + '/cache/' + request.name + '/' + inputNode.name + '/' + inputNode.node + '/';
        let files = fs.existsSync(tempPath) ? fs.readdirSync(tempPath) : [];

        files.forEach(file =>
        {
            // load the feature geometry, push into inputFeatures
            let filePath = path.join(tempPath, file);
            let featureString = fs.readFileSync(filePath, 'utf8');
            let feature = JSON.parse(featureString);

            // explode into a feature collection of points
            // only works on poly/line/multipoint!
            if (feature.geometry.type === 'Point')
            {
                points.push(feature);
            }
            else
            {
                let exploded = turf.explode(feature);
                exploded.features.forEach(point =>
                {
                    points.push(point);
                });
            }
        });
    });

    let tin = turf.tin(turf.featureCollection(points));
    
    tin.features.forEach(poly =>
    {
        // generate an ID
        let tinId = uuidv4();
        processor.outputNodes.features.push(tinId);
        // shove the feature on the disk
        let tinData = JSON.stringify(poly);

        let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';

        await fs.promises.mkdir(cachePath, { recursive: true }, function(err) 
        {
            if (err && err.code != 'EEXIST') throw err;
        });
        
        await fs.promises.writeFile(cachePath + '/' + tinId + '.json', tinData, (err) => 
        {
            if (err) throw err;
        });
    });
};