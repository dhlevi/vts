const { v4: uuidv4 }  = require('uuid');
const fs              = require('fs');
const path            = require('path');
const { parse, eval } = require('expression-eval');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];
    processor.outputNodes.false = [];

    let query = processor.attributes.query;

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

            let passed = true;

            // run the query, determine true or false
            try
            {
                const ast = parse(query);
                passed = eval(ast, feature.properties);
            }
            catch(err)
            {
                console.log('Expression parse failed: ' + err);
            }

            // write to the appropriate outputNode
            let id = uuidv4();
            let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name;

            if (passed)
            {
                processor.outputNodes.features.push(id);
                cachePath += '/features/';
            }
            else
            {
                processor.outputNodes.false.push(id);
                cachePath += '/false/';
            }

            let data = JSON.stringify(feature);
            // create the directory structure
            await fs.promises.mkdir(cachePath, { recursive: true });
            await fs.promises.writeFile(cachePath + '/' + id + '.json', data);
        }
    }
};