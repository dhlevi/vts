const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];
    processor.outputNodes.donuts = [];

    // load the features
    for (let idx = 0; idx < processor.inputNodes.features.length; idx++)
    {
        let inputNode = processor.inputNodes.features[idx];
        // get the files in the disk cache
        let tempPath = process.cwd() + '/cache/' + request.name + '/' + inputNode.name + '/' + inputNode.node + '/';
        let files = fs.existsSync(tempPath) ? fs.readdirSync(tempPath) : [];

        for (let i = 0; i < files.length; i++)
        {
            let file = files[i];
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

            let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
            // create the directory structure
            await fs.promises.mkdir(cachePath, { recursive: true });
            await fs.promises.writeFile(cachePath + '/' + id + '.json', data);

            turf.flattenEach(turf.featureCollection([feature]), async function (currentFeature, featureIndex, multiFeatureIndex) 
            {
                // extract polygon interior rings, make into geoms
                if (currentFeature.geometry.type === 'Polygon')
                {
                    for (let i = 1; i < currentFeature.geometry.coordinates.length; i++) 
                    {
                        let ring = turf.feature(
                        {
                            type: 'Polygon',
                            coordinates: [currentFeature.geometry.coordinates[i]]
                        });

                        // generate an ID
                        let donutId = uuidv4();
                        processor.outputNodes.donuts.push(donutId);
                        // shove the feature on the disk
                        let donutData = JSON.stringify(ring);

                        let donutPath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/donuts/';

                        await fs.promises.mkdir(donutPath, { recursive: true }, function(err) 
                        {
                            if (err && err.code != 'EEXIST') throw err;
                        });

                        await fs.promises.writeFile(donutPath + '/' + donutId + '.json', donutData, (err) => 
                        {
                            if (err) throw err;
                        });
                    }
                }
            });
        }
    }
};