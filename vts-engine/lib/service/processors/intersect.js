const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let clippers = [];
    let features = [];

    // load the clippers
    processor.inputNodes.intersector.forEach(clipperNode =>
    {
        let clippersPath = process.cwd() + '/cache/' + request.name + '/' + clipperNode.name + '/' + clipperNode.node + '/';
        let clipperFiles = fs.existsSync(clippersPath) ? fs.readdirSync(clippersPath) : [];

        clipperFiles.forEach(file =>
        {
            // load the feature geometry, push into inputFeatures
            let filePath = path.join(clippersPath, file);
            let featureString = fs.readFileSync(filePath, 'utf8');
            let feature = JSON.parse(featureString);
            
            clippers.push(feature);
        });
    });

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

    // clip each feature by each clipper
    clippers.forEach(clipper =>
    {
        features.forEach((feature, index) =>
        {
            let difference = turf.intersect(feature, clipper);
            features[index] = difference;
        });
    });

    // cache the features
    features.forEach(feature =>
    {
        // create a new feature cache
        // generate an ID
        let id = uuidv4();
        processor.outputNodes.features.push(id);
        // shove the feature on the disk
        let data = JSON.stringify(feature);

        let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
        // create the directory structure
        await fs.promises.mkdir(cachePath, { recursive: true }, function(err) 
        {
            if (err && err.code != 'EEXIST') throw err;
        });

        await fs.promises.writeFile(cachePath + '/' + id + '.json', data, (err) => 
        {
            if (err) throw err;
        });
    });
};