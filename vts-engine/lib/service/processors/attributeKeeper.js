const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let fieldName = processor.attributes.fieldName;

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

            let fieldsToKeep = [];
            // check for csv
            let fields = fieldName.split(',');
            fields.forEach(field =>
            {
                fieldsToKeep.push(field.trim());
                // if the property doesn't exist on the object, add it.
                if (!feature.properties.hasOwnProperty(field.trim()))
                {
                    feature.properties[field.trim()] = null;
                }
            });

            for(let property in feature.properties)
            {
                if (!fieldsToKeep.includes(property))
                {
                    delete feature.properties[property];
                }
            }

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
        }
    }
};