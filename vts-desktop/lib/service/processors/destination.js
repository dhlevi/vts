const { v4: uuidv4 }  = require('uuid');
const fs              = require('fs');
const path            = require('path');
const turf            = require('@turf/turf');
const { parse, eval } = require('expression-eval');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];
    processor.outputNodes.destinations = [];

    let units = processor.attributes.units;

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

            let distance = processor.attributes.distance;
            let bearing = processor.attributes.bearing;

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

            if (bearing.startsWith('$')) 
            {
                let expression = bearing.slice(2,-1);
                const ast = parse(expression);
                bearing = eval(ast, feature.properties);
            } 
            else
            {
                bearing = Number(bearing);
            }

            // get the center (for lines/poly etc.)
            let center = turf.centerOfMass(feature);

            // get the destination point
            let destination = turf.destination(center, distance, bearing, { units: units });

            // generate an ID
            let destId = uuidv4();
            processor.outputNodes.destinations.push(destId);
            // shove the feature on the disk
            let destData = JSON.stringify(destination);

            let destinationPath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/destinations/';

            await fs.promises.writeFile(destinationPath + '/' + destId + '.json', destData, (err) => 
            {
                if (err) throw err;
            });
        }
    }
};