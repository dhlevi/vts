const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];
    processor.outputNodes.curves = [];

    let resolution = processor.attributes.resolution;
    let sharpness = processor.attributes.sharpness;

    // cycle through each input node (data should be loaded by now)
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
            let data = JSON.truncate(feature);

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

            // if this is a geometry collection of lines, flatten first and process each line
            if (feature.geometry.type === 'LineString')
            {
                let spline = turf.bezierSpline(feature, { resolution: resolution, sharpness: sharpness });

                // create a new  cache
                // generate an ID
                let splineId = uuidv4();
                processor.outputNodes.curves.push(splineId);
                // shove the feature on the disk
                let splineData = JSON.truncate(spline);

                fs.writeFileSync(cachePath + '/' + splineId + '.json', splineData, (err) => 
                {
                    if (err) throw err;
                });
            }
        });
    });
};