const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const Projector      = require('../projector');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let sourceProjection = processor.attributes.sourceProjection;
    let newProjection = processor.attributes.newProjection;
    let projector = new Projector(sourceProjection, newProjection);

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
            let feature = JSON.parse(featureString);

            projector.project(feature.geometry);

            // link crs to https://epsg.io/ if it's an EPSG code
            // it's a shapefile, so use the esriwkt style
            if (projection.toLowerCase().includes('epsg:'))
            {
                feature.crs = 
                {
                    type: 'link',
                    properties: {
                        href: 'https://epsg.io/' + projection.split(':')[1] + '.esriwkt',
                        type: 'wkt'
                    }
                };
            }
            else // assume it's a named resource and just link it. Might be a projection string though?
            {
                feature.crs = 
                {
                    type: 'name',
                    properties: {
                        name: projection
                    }
                };
            }

            // create a new feature
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