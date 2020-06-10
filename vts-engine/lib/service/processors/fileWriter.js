const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const shpwrite       = require('shp-write');
const tokml          = require('tokml');
const togml          = require('geojson-to-gml-3');
const turf           = require('@turf/turf');
const AdmZip         = require('adm-zip');
const { parentPort } = require('worker_threads');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let destinationPath = processor.attributes.path;
    let dataType = processor.attributes.dataType;

    let features = [];

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

            features.push(feature);
        });
    });

    let data;
    let featureCollection = turf.featureCollection(features);

    if (dataType === 'kml')
    {
        fs.writeFile(destinationPath, tokml(featureCollection), (err) => 
        {
            if (err) throw err;
        });
    }
    else if (dataType === 'kmz')
    {
        let kml = tokml(featureCollection);
        // zip and write
        let kmz = new AdmZip();
        kmz.addFile('doc.kml', Buffer.alloc(kml.length, kml));
        kmz.writeZip(destinationPath);
    }
    else if (dataType === 'gml')
    {
        fs.writeFile(destinationPath, togml.geomToGml(featureCollection), (err) => 
        {
            if (err) throw err;
        });
    }
    else if (dataType.startsWith('shape'))
    {
        fs.writeFile(destinationPath, shpwrite.zip(featureCollection), (err) => 
        {
            if (err) throw err;
        });
    }
    else
    {
        data = JSON.stringify(featureCollection);
        
        fs.writeFile(destinationPath, data, (err) => 
        {
            if (err) throw err;
        });
    }
};