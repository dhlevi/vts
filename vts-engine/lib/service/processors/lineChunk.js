const { v4: uuidv4 }  = require('uuid');
const fs              = require('fs');
const path            = require('path');
const turf            = require('@turf/turf');
const { parse, eval } = require('expression-eval');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let reverse = processor.attributes.reverse === 'true';
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

            let length = processor.attributes.length;

            if (length.startsWith('$')) 
            {
                let expression = length.slice(2,-1);
                const ast = parse(expression);
                length = eval(ast, feature.properties);
            } 
            else
            {
                length = Number(length);
            }

            let line = turf.lineChunk(feature, length, { reverse: reverse, units: units });

            // create a new feature cache
            // generate an ID
            let id = uuidv4();
            processor.outputNodes.features.push(id);
            // shove the feature on the disk
            let data = JSON.stringify(line);

            let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
            // create the directory structure
            await fs.promises.mkdir(cachePath, { recursive: true });
            await fs.promises.writeFile(cachePath + '/' + id + '.json', data);
        }
    });
};