const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

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

            // this won't work. Should not be collapsing/flattening geom collections!
            turf.flattenEach(feature, function (currentFeature, featureIndex, multiFeatureIndex) 
            {
                // extract polygon interior rings, make into geoms
                if (currentFeature.geometry.type === 'Polygon')
                {
                    let exteriorRing = currentFeature.geometry.coordinates[0];
                    currentFeature.geometry.coordinates = [ exteriorRing ];
                }

                // create a new feature cache
                // generate an ID
                let id = uuidv4();
                processor.outputNodes.features.push(id);
                // shove the feature on the disk
                let data = JSON.stringify(currentFeature);

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
            });
        });
    });
};