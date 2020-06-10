const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    // cycle through each input node (data should be loaded by now)
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
            let points = turf.explode(feature);

            // write each feature in the collection
            let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
            points.features.forEach(pointFeature =>
            {
                // create a new feature cache
                // generate an ID
                let id = uuidv4();
                processor.outputNodes.features.push(id);
                // shove the feature on the disk
                let data = JSON.stringify(pointFeature);

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