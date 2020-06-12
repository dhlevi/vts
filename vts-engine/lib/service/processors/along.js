const { v4: uuidv4 }  = require('uuid');
const fs              = require('fs');
const path            = require('path');
const turf            = require('@turf/turf');
const { parse, eval } = require('expression-eval');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];
    processor.outputNodes.points = [];

    let length = processor.attributes.length;
    let units = processor.attributes.units;

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

            // create a new feature cache
            // generate an ID
            let id = uuidv4();
            processor.outputNodes.features.push(id);
            // shove the feature on the disk
            let data = JSON.stringify(feature);

            let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
            // create the directory structure
            await fs.promises.mkdir(cachePath, { recursive: true }, function(err) 
            {
                if (err && err.code != 'EEXIST') throw err;
            });

            await fs.promises.writeFile(cachePath + '/' + id + '.json', data, (err) => 
            {
                if (err) throw err;
            });

            turf.flattenEach(feature, function (currentFeature, featureIndex, multiFeatureIndex) 
            {
                // extract polygon interior rings, make into geoms
                if (currentFeature.geometry && currentFeature.geometry.type === 'LineString')
                {
                    // if length is a calc, get the value from properties
                    let along = 0;

                    if (length.startsWith('$')) 
                    {
                        let expression = length.slice(2,-1);;
                        const ast = parse(expression);
                        along = eval(ast, feature.properties);
                    } 
                    else 
                    {
                        along = Number(length);
                    }

                    let point = turf.along(currentFeature, along, {units: units});

                    // create a new feature cache
                    // generate an ID
                    let pointId = uuidv4();
                    processor.outputNodes.points.push(pointId);
                    // shove the feature on the disk
                    let pointData = JSON.stringify(point);

                    let pointsPath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/points/';

                    await fs.promises.mkdir(pointsPath, { recursive: true }, function(err) 
                    {
                        if (err && err.code != 'EEXIST') throw err;
                    });

                    await fs.promises.writeFile(pointsPath + '/' + pointId + '.json', pointData, (err) => 
                    {
                        if (err) throw err;
                    });
                }
            });
        });
    });
};