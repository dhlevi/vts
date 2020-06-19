const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const shpwrite       = require('shp-write');
const tokml          = require('tokml');
const togml          = require('geojson-to-gml-3');
const turf           = require('@turf/turf');
const AdmZip         = require('adm-zip');
const Projector      = require('../projector');


module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let destinationPath = processor.attributes.path;
    let dataType = processor.attributes.dataType;
    let projection = processor.attributes.projection;

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

            // reproject if a projection was supplied
            if (projection && projection.length > 0)
            {
                let sourceProj = feature.crs ? feature.crs.properties.name : 'EPSG:4326';
                let projector = new Projector(sourceProj, projection);
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
            }

            features.push(feature);
        });
    });

    let data;
    let featureCollection = turf.featureCollection(features);

    // fgdb currently not supported, and shapefile is buggy
    // Might move these functions out entirely and only include
    // 'advanced' read/write types in Java engine

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
        // shpwrite library doesn't honour CRS from geojson
        // makes sense, as technically it's no longer valid
        // in the spec, but we kinda need this. May need to
        // customize
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