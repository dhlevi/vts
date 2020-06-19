const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const Projector      = require('../projector');
const utils          = require('../../helpers/utils');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let newProjection = processor.attributes.newProjection;

    if (newProjection.toLowerCase().includes('http'))
    {
        newProjection = await utils.getHttpRequest(newProjection);
    }
    else if (newProjection.toLowerCase().includes('EPSG:'))
    {
        newProjection = await utils.getHttpRequest('https://epsg.io/' + newProjection.split(':')[1] + '.esriwkt');
    }

    // cycle through each input node (data should be loaded by now)
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

            let sourceProjection = 'EPSG:4326';

            if (feature.crs)
            {
                if (feature.crs.type === 'link')
                {
                    sourceProjection = await utils.getHttpRequest(feature.crs.properties.href);
                }
                else if (feature.crs.type === 'name' && feature.crs.properties.name.toLowerCase().includes('EPSG:'))
                {
                    sourceProjection = await utils.getHttpRequest('https://epsg.io/' + feature.crs.properties.name.split(':')[1] + '.esriwkt');
                }
                else
                {
                    // we have a crs without a type, so stick with the default?
                }
            }

            let projector = new Projector(sourceProjection, newProjection);
            projector.project(feature.geometry);

            // link crs to https://epsg.io/ if it's an EPSG code
            // it's a shapefile, so use the esriwkt style
            if (newProjection.toLowerCase().includes('epsg:'))
            {
                feature.crs = 
                {
                    type: 'link',
                    properties: {
                        href: 'https://epsg.io/' + newProjection.split(':')[1] + '.js',
                        type: 'proj4'
                    }
                };
            }
            else // assume it's a named resource and just link it. Might be a projection string though?
            {
                feature.crs = 
                {
                    type: 'name',
                    properties: {
                        name: newProjection
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
            await fs.promises.mkdir(cachePath, { recursive: true });
            await fs.promises.writeFile(cachePath + '/' + id + '.json', data);
        }
    }
};