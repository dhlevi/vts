const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];
    processor.outputNodes.tin = [];

    let points = [];
    // load the features
    processor.inputNodes.features.forEach(inputNode =>
    {
        // get the files in the disk cache
        let tempPath = process.cwd() + '/cache/' + request.name + '/' + inputNode.name;
        let files = fs.readdirSync(tempPath);

        files.forEach(file =>
        {
            // load the feature geometry, push into inputFeatures
            let filePath = path.join(tempPath, file);
            let featureString = fs.readFileSync(filePath, 'utf8');
            let feature = JSON.parse(featureString);

            // create a new feature cache
            // generate an ID
            let id = uuidv4();
            processor.outputNodes.features.push(id);
            // shove the feature on the disk
            let data = JSON.stringify(feature);

            let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name;
            // create the directory structure
            fs.mkdirSync(cachePath, { recursive: true }, function(err) 
            {
                if (err && err.code != 'EEXIST') throw err;
            });

            fs.writeFileSync(cachePath + '/' + id + '.json', data, (err) => 
            {
                if (err) throw err;
            });

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
        processor.outputNodes.tin.push(tinId);
        // shove the feature on the disk
        let tinData = JSON.stringify(poly);

        let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name;
        fs.writeFileSync(cachePath + '/' + tinId + '.json', tinData, (err) => 
        {
            if (err) throw err;
        });
    });
};