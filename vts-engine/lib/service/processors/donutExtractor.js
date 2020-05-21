const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];
    processor.outputNodes.donuts = [];

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

            turf.flattenEach(feature, function (currentFeature, featureIndex, multiFeatureIndex) 
            {
                // extract polygon interior rings, make into geoms
                if (currentFeature.geometry.type === 'Polygon')
                {
                    currentFeature.geometry.coordinates.forEach((ring, index) =>
                    {
                        if (index > 0)
                        {
                            let donut = turf.feature(
                            {
                                type: 'Polygon',
                                coordinates: ring
                            });
                            
                            // generate an ID
                            let donutId = uuidv4();
                            processor.outputNodes.tin.push(donutId);
                            // shove the feature on the disk
                            let donutData = JSON.stringify(donut);
        
                            fs.writeFileSync(cachePath + '/' + donutId + '.json', donutData, (err) => 
                            {
                                if (err) throw err;
                            });
                        }
                    });
                }
            });
        });
    });
};