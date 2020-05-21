const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let destinationPath = processor.attributes.path;
    let type = processor.attributes.dataType;

    let features = [];

    // cycle through each input node (data should be loaded by now)
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

            features.push(feature);
        });
    });

    // use json as the default
    let featureCollection = turf.featureCollection(features);

    let data = JSON.stringify(featureCollection);

    fs.writeFile(destinationPath, data, (err) => 
    {
        if (err) throw err;
    });
};