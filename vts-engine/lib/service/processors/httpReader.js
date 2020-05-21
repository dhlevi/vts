const rp             = require('request-promise-native');
const request        = require('request');
const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const DOMParser      = require("xmldom").DOMParser;
const kmlToGeoJson   = require('@tmcw/togeojson');
const shapefile      = require('shapefile');
const fgdb           = require('fgdb');
const unzipper       = require('unzipper');
const Projector      = require('../projector');

module.exports.process = async function(request, processor)
{
    let url = processor.attributes.url;
    let dataType = processor.attributes.dataType;
    let projection = processor.attributes.sourceProjection;

    // Execute a get from the requested URL
    let results = await rp(url)
                        .then(async function (result) 
                        {
                            // type may be json, kml, kmz, wkt, gml, or a zip
                            // containing a shapefile or fgdb
                            // if it is any other type then JSON, parse the result
                            // out into json and return
                            if (dataType === 'kml')
                            {
                                result = await convertKML(result);
                            }
                            else if (dataType === 'kmz')
                            {
                                result = await convertKMZ(result);
                            }
                            else if (dataType === 'wkt')
                            {
                                result = convertWKT(result);
                            }
                            else if (dataType === 'gml')
                            {
                                result = convertGML(result);
                            }
                            else if (dataType === 'shape')
                            {
                                result = convertShape(result);
                            }
                            else if (dataType === 'fgdb')
                            {
                                result = convertFGDB(result);
                            }

                            return JSON.parse(result);
                        })
                        .catch(err => 
                        {
                            throw Error(err)
                        });
    // after extracting the data, validate we have a geojson blob. If its a parse from
    // a different type, it should be fine, just external GeoJSON needs a check really
    if (!result || (!results.hasOwnProperty('type') && !results.type.toLowerCase() === 'Featurecollection'))
    {
        throw Error('not a feature collection');
    }

    // attach resulting blob to the processor 'features' output node.    
    // and/or write all features to the cache, and attach only the "id"
    processor.outputNodes.features = [];
    results.features.forEach(feature => 
    {
        // generate an ID
        let id = uuidv4();
        processor.outputNodes.features.push(id);
        // shove the feature on the disk
        let data = JSON.stringify(feature);

        let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name;
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
};

// Move all of these into a seperate import!

function convertWKT() {}

function convertGML() {}

async function convertKML(result) 
{
    try
    {
        let kml = new DOMParser().parseFromString(result);
        let converted = kmlToGeoJson.kml(kml, { styles: true });

        return converted;
    }
    catch(err)
    {
        throw new Error(err);
    }
}

async function convertKMZ(result) 
{
    // unzip
    fs.createReadStream('./processing/kmz.zip').pipe(unzipper.Extract({ path: './processing' }).on('close', function(finish)
    {
        // convert
        fs.readdir('./processing/', function (err, files) 
        {
            if(err)
            {
                console.error(err);
                throw err;
            }
            else
            {
                let kml;
                // locate the shapefile params
                files.forEach(function (file) 
                {
                    if(file.endsWith('.kml')) kml = file;
                });

                if(kml)
                {
                    let kmlFile = '' + fs.readFileSync('./processing/' + prj);
                    let kml = new DOMParser().parseFromString(kmlFile);
                    let json = kmlToGeoJson.kml(kml, { styles: true });

                    return json;
                }
                else
                {
                    console.error('KML not found in zip');
                }
                //cleanupTempFiles('./processing', ['temp.zip', kml]);
            }
        });
    }));
}

/*function convertShape() 
{
    // unzip
    fs.createReadStream('./processing/shape.zip').pipe(unzipper.Extract({ path: './processing' }).on('close', function(finish)
    {
        // convert
        fs.readdir('./processing/', function (err, files) 
        {
            if(err)
            {
                console.error(err);
                throw err;
            }
            else
            {
                let shp;
                let dbf;
                let prj;
                let shx;
                let cpg;
                let qpj;
                let sbn;
                let sbx;
                // locate the shapefile params
                files.forEach(function (file) 
                {
                    if(file.endsWith('.shp')) shp = file;
                    if(file.endsWith('.dbf')) dbf = file;
                    if(file.endsWith('.prj')) prj = file;
                    if(file.endsWith('.shx')) shx = file;
                    if(file.endsWith('.cpg')) cpg = file;
                    if(file.endsWith('.qpj')) qpj = file;
                    if(file.endsWith('.sbn')) sbn = file;
                    if(file.endsWith('.sbx')) sbx = file;
                });

                if(shp)
                {
                    console.log('Shapefile found in zip. Converting...');
                    // parse the shape
                    let json = { type: "FeatureCollection", features: []};
                    
                    shapefile.open('./processing/' + shp, './processing/' + dbf)
                    .then(source => source.read()
                    .then(function log(result) 
                    {
                        if (result.done) 
                        {
                            console.log('Completed, returning geojson response...');
                            res.json(json);
                            
                            console.log('cleaning temp files');
                            cleanupTempFiles('./processing', ['temp.zip', shp, dbf, prj, shx, cpg, qpj, sbn, sbx]);

                            return;
                        }

                        // project the feature if it's not in wgs84
                        // however, if there is no prj file specified, we have to assume it's ok
                        if(prj)
                        {
                            console.log('Reprojecting feature...');
                            
                            let fromProj = '' + fs.readFileSync('./processing/' + prj) + '';
                            let toProj = 'EPSG:4326';

                            //console.log('Projecting from: ' + fromProj);
                            //console.log('             to: ' + toProj);

                            let projector = new Projector(fromProj, toProj);
                            projector.project(result.value.geometry)
                        }

                        json.features.push(result.value);
                        source.read().then(log);
                    })).catch(() => 
                    { 
                        console.error('Error during shapefile convert...');
                        console.log('cleaning temp files');
                        cleanupTempFiles('./processing', ['temp.zip', shp, dbf, prj, shx, cpg, qpj, sbn, sbx]);
                        throw new Error(error);
                    });
                }
                else
                {
                    console.error('Shapefile not found in zip');
                    res.writeHead(500);
                    res.end();
                    console.log('cleaning temp files');
                    cleanupTempFiles('./processing', ['temp.zip', shp, dbf, prj, shx, cpg, qpj, sbn, sbx]);
                }
            }
        });
    }));
}

function convertFGDB() 
{
    console.log('Unzipping FGDB...');
    fs.createReadStream('./processing/fgdb.zip').pipe(unzipper.Extract({ path: './processing' }).on('close', function(finish)
    {
        // find a directory with a .gdb extension
        fs.readdir('./processing', function (err, files) 
        {
            if (err) 
            {
                console.error('Error during FGDB convert...');
                console.error(error);
                console.log('cleaning temp files');
                cleanupTempFiles('./processing', ['temp.zip']);
                throw new Error(error);
            }

            let gdbPath = '';

            for(let i = 0 ; i < files.length; i++)
            {
                let fromPath = path.join('./processing', files[i]);
                if(fromPath.includes('.gdb')) gdbPath = fromPath;
            }
            
            console.log('Found FGDB in path: ' + gdbPath);
            console.log('Processing FGDB...');
            fgdb(gdbPath)
            .then(function(objectOfGeojson)
            {
                console.log('Successfully processed FGDB!');
                
                // there may be multiple feature classes, and we may need to do some projection...
                let featureClassKeys = Object.keys(objectOfGeojson);
                for(let i = 0; i < featureClassKeys.length; i++)
                {
                    let key = featureClassKeys[i];
                    let featureClass = objectOfGeojson[key];

                    if(featureClass.bbox[0] > 180 || featureClass.bbox[0] < 180)
                    {
                        console.log('Reprojecting feature: ' + key);
                        // not WGS84, reproject
                        // we don't know the source projection, so assume BCAlbers?
                        let projector = new Projector('EPSG:3005', 'EPSG:4326');
                        for(let featureIdx = 0; featureIdx < featureClass.features.length; featureIdx++)
                        {
                            let feature = featureClass.features[featureIdx];
                            projector.project(feature.geometry);
                        }
                    }
                }

                console.log('Sending geojson response...');
                // send the feature classes back. The Processor will create layers
                // for each feature class
                res.json(objectOfGeojson);

                cleanupTempFiles('./processing', ['temp.zip']);
                // cleanup temp folder too!
            },
            function(error)
            {
                console.error('Error during FGDB convert...');
                console.error(error);
                console.log('cleaning temp files');
                cleanupTempFiles('./processing', ['temp.zip']);
                throw new Error(error);
            });
        });
    }));
}*/