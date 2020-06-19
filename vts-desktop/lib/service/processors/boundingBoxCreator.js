const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];
    processor.outputNodes.bbox = [];

    let minx = Number(processor.attributes.minx);
    let miny = Number(processor.attributes.miny);
    let maxx = Number(processor.attributes.maxx);
    let maxy = Number(processor.attributes.maxy);

    // cycle through each input node (data should be loaded by now)
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
            
            let id = uuidv4();
            processor.outputNodes.features.push(id);
            let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
            // create the directory structure
            await fs.promises.mkdir(cachePath, { recursive: true });
            await fs.promises.writeFile(cachePath + '/' + id + '.json', featureString);
        });
    });

    let bbox = turf.bboxPolygon(minx, miny, maxx, maxy);

    // cache the hull
    let id = uuidv4();
    processor.outputNodes.bbox.push(id);
    // shove the feature on the disk
    let data = JSON.stringify(bbox);

    let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/bbox/';
    // create the directory structure
    await fs.promises.mkdir(cachePath, { recursive: true });
    await fs.promises.writeFile(cachePath + '/' + id + '.json', data);
};