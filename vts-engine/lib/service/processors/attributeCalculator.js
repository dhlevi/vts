const { v4: uuidv4 }  = require('uuid');
const fs              = require('fs');
const path            = require('path');
const { parse, eval } = require('expression-eval');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let fieldName = processor.attributes.fieldName;
    let calculation = processor.attributes.calculation;

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

            // inject new attribute, run calculation
            let value = null;
            try
            {
                const ast = parse(calculation);
                value = eval(ast, feature.properties);
            }
            catch(err)
            {
                console.log('Expression parse failed: ' + err);
            }

            feature.properties[fieldName] = value;

            // create a new feature cache
            // generate an ID
            let id = uuidv4();
            processor.outputNodes.features.push(id);
            // shove the feature on the disk
            let data = JSON.stringify(feature);

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