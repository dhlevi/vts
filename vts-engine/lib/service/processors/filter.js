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

            if (passed)
            {
                processor.outputNodes.features.push(id);
            }
            else
            {
                processor.outputNodes.false.push(id);
            }

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
        });
    });
};