const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let features = [];

    // load the features
    processor.inputNodes.features.forEach(inputNode =>
    {
        // get the files in the disk cache
        let tempPath = process.cwd() + '/cache/' + request.name + '/' + inputNode.name + '/' + inputNode.node + '/';
        let files = fs.existsSync(tempPath) ? fs.readdirSync(tempPath) : [];

        files.forEach(file =>
        {
            // load the feature geometry, push into inputFeatures
            let filePath = path.join(tempPath, file);
            let featureString = fs.readFileSync(filePath, 'utf8');
            let feature = JSON.parse(featureString);

            features.push(feature);
        });
    });

    // dissolve features
    let dissolved = turf.dissolve(turf.featureCollection(features));

    for (let i = 0; i < dissolved.features.length; i++)
    {
        let dissolvedFeature = dissolved.features[i];
        // create a new feature cache
        // generate an ID
        let id = uuidv4();
        processor.outputNodes.features.push(id);
        // shove the feature on the disk
        let data = JSON.stringify(dissolvedFeature);

        let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
        // create the directory structure
        await fs.promises.mkdir(cachePath, { recursive: true });
        await fs.promises.writeFile(cachePath + '/' + id + '.json', data);
    }
};