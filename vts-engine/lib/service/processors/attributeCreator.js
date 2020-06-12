const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let fieldName = processor.attributes.fieldName; // support comma seperated list?
    let defaultValue = processor.attributes.defaultValue;
    let type = processor.attributes.type; //string, number, date, boolean

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

            // inject new attribute
            let fields = fieldName.split(',');
            let values = defaultValue.split(',');
            let types = type.split(',');

            fields.forEach(async (field, index) =>
            {
                let fieldValue = values.length > index ? values[index] : '';
                let fieldType  = types.length  > index ? types[index]  : types[0];

                try
                {
                    feature.properties[field.trim()] = fieldType.toLowerCase() === 'number'  ? Number(fieldValue) :
                                                       fieldType.toLowerCase() === 'boolean' ? fieldValue === 'true' :
                                                       fieldType.toLowerCase() === 'date'    ? new Date(fieldValue) :
                                                       fieldValue;
                }
                catch(err)
                {
                    feature.properties[field.trim()] = fieldValue;
                }
            });

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