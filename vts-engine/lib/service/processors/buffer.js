const { v4: uuidv4 }  = require('uuid');
const fs              = require('fs');
const path            = require('path');
const turf            = require('@turf/turf');
const { parse, eval } = require('expression-eval');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let distance = processor.attributes.distance;
    let units = processor.attributes.units;

    // cycle through each input node (data should be loaded by now)
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

            let bufferDistance = 0;
            if (distance.startsWith('$')) 
            {
                let expression = distance.slice(2,-1);
                const ast = parse(expression);
                bufferDistance = eval(ast, feature.properties);
            } 
            else
            {
                bufferDistance = Number(distance);
            }

            // apply the buffer. Check for null feature.geometry?
            let bufferedFeature;
            try
            {
                bufferedFeature = turf.buffer(feature, bufferDistance, {units: units});
            }
            catch(err)
            {
                console.log(err);
                bufferedFeature = feature;
            }

            // create a new feature
            // generate an ID
            let id = uuidv4();
            processor.outputNodes.features.push(id);
            // shove the feature on the disk
            let data = JSON.stringify(bufferedFeature);

            let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
            // create the directory structure
            await fs.promises.mkdir(cachePath, { recursive: true });
            await fs.promises.writeFile(cachePath + '/' + id + '.json', data);
        }
    }
};