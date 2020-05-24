const { v4: uuidv4 }  = require('uuid');
const fs              = require('fs');
const path            = require('path');
const turf            = require('@turf/turf');
const { parse, eval } = require('expression-eval');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let units = processor.attributes.units;

    // load the features
    processor.inputNodes.features.forEach(inputNode =>
    {
        // get the files in the disk cache
        let tempPath = process.cwd() + '/cache/' + request.name + '/' + inputNode.name + '/' + inputNode.node + '/';
        let files = fs.readdirSync(tempPath);

        files.forEach(file =>
        {
            // load the feature geometry, push into inputFeatures
            let filePath = path.join(tempPath, file);
            let featureString = fs.readFileSync(filePath, 'utf8');
            let feature = JSON.parse(featureString);

            let distance = processor.attributes.distance;
            if (distance.startsWith('$')) 
            {
                let expression = distance.slice(2,-1);
                const ast = parse(expression);
                distance = eval(ast, feature.properties);
            } 
            else
            {
                distance = Number(distance);
            }

            let direction = processor.attributes.direction;
            if (direction.startsWith('$')) 
            {
                let expression = direction.slice(2,-1);
                const ast = parse(expression);
                direction = eval(ast, feature.properties);
            } 
            else
            {
                direction = Number(direction);
            }

            let transformed = turf.transformTranslate(feature, distance, direction, { units: units });

            // create a new feature cache
            // generate an ID
            let id = uuidv4();
            processor.outputNodes.features.push(id);
            // shove the feature on the disk
            let data = JSON.stringify(transformed);

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
    });
};