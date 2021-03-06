const rp             = require('request-promise-native');
const request        = require('request');
const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const DOMParser      = require("xmldom").DOMParser;
const kmlToGeoJson   = require('@tmcw/togeojson');
const gml2json       = require('gml2json');
const shapefile      = require('shapefile');
const fgdb           = require('fgdb');
const unzipper       = require('unzipper');
const Projector      = require('../projector');
const rimraf         = require('rimraf');
const { parentPort } = require('worker_threads');

module.exports.process = async function(request, processor)
{
    let url = processor.attributes.url;
    let dataType = processor.attributes.dataType;
    let projection = processor.attributes.sourceProjection;
    let result;

    if (dataType.startsWith('shape'))
    {
        result = await convertShape(url, request.name, projection);
    }
    else if (dataType === 'fgdb')
    {
        parentPort.postMessage('Reading an FGDB');
        result = await convertFGDB(url, request.name, projection);
    }
    else if (dataType === 'kmz')
    {
        result = await convertKMZ(url, request.name);
    }
    else
    {
        // Execute a get from the requested URL
        result = await rp(url)
                        .then(async function (data) 
                        {
                            // type may be json, kml, kmz, wkt, gml, or a zip
                            // containing a shapefile or fgdb
                            // if it is any other type then JSON, parse the result
                            // out into json and return
                            if (dataType === 'kml')
                            {
                                result = await convertKML(data);
                            }
                            else if (dataType === 'gml')
                            {
                                result = convertGML(data);
                            }
                            else
                            {
                                result = JSON.parse(data);
                            }

                            return result;
                        })
                        .catch(err => 
                        {
                            throw Error(err)
                        });
    }


    // clear processors path (if it exists)
    let processorDir = process.cwd() + '/processing/' + request.name;
    await rimraf(processorDir, function () { console.log('Cleared cache for ' + processorDir); });

    // after extracting the data, validate we have a geojson blob. If its a parse from
    // a different type, it should be fine, just external GeoJSON needs a check really
    if (!result || !result.hasOwnProperty('type') || result.type.toLowerCase() !== 'featurecollection')
    {
        throw Error('not a feature collection');
    }

    // attach resulting blob to the processor 'features' output node.    
    // and/or write all features to the cache, and attach only the "id"
    processor.outputNodes.features = [];
    for (let i = 0; i < result.features.length; i++)
    {
        let feature = result.features[i];
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
};

// Move all of these into a seperate import!

function convertGML(result, projection)
{
    let json = gml2json.parse(result);
    
    // reproject
    if (projection && projection.length > 0)
    {
        let projector = new Projector(projection, 'EPSG:4326');
        projector.project(json);
    }

    return json;
}

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

async function convertKMZ(url, processDir) 
{
    let result = null;
    let tempPath = process.cwd() + '/processing/' + processDir;
    // unzip. Make processing dir if it doesn't exist
    await fs.promises.mkdir(tempPath, { recursive: true });

    // call the URL zip location and extract the files
    const directory = await unzipper.Open.url(request, url);
    for(let idx in directory.files)
    {
        let file = directory.files[idx];
        const content = await file.buffer();
        // write the raw content to the temp path
        await fs.promises.writeFile(tempPath + '/' + file.path, content);
    };

    // convert
    let files = fs.existsSync(tempPath) ? fs.readdirSync(tempPath) : [];

    let kml;
    // locate the kml file
    files.forEach(function (file) 
    {
        if (file.endsWith('.kml')) kml = file;
    });

    if (kml)
    {
        let kmlFile = '' + fs.readFileSync(tempPath + '/' + kml);
        let parsedKml = new DOMParser().parseFromString(kmlFile);

        return kmlToGeoJson.kml(parsedKml, { styles: true });
    }
    else
    {
        console.error('KML not found in zip');
    }

    cleanupTempFiles(tempPath);

    return result;
}

async function convertShape(url, processDir, projection) 
{
    let json = { type: "FeatureCollection", features: [] };
    let tempPath = process.cwd() + '/processing/' + processDir;

    // unzip. Make processing dir if it doesn't exist
    await fs.promises.mkdir(tempPath, { recursive: true });

    // call the URL zip location and extract the files
    const directory = await unzipper.Open.url(request, url);
    for(let idx in directory.files)
    {
        let file = directory.files[idx];
        const content = await file.buffer();
        // write the raw content to the temp path
        await fs.promises.writeFile(tempPath + '/' + file.path, content);
    };

    // convert
    let files = fs.existsSync(tempPath) ? fs.readdirSync(tempPath) : [];

    let shp, dbf, prj, shx, cpg, qpj, sbn, sbx;

    // locate the shapefile params
    files.forEach(function (file) 
    {
        if(file.endsWith('.shp')) shp = file;
        else if(file.endsWith('.dbf')) dbf = file;
        else if(file.endsWith('.prj')) prj = file;
        else if(file.endsWith('.shx')) shx = file;
        else if(file.endsWith('.cpg')) cpg = file;
        else if(file.endsWith('.qpj')) qpj = file;
        else if(file.endsWith('.sbn')) sbn = file;
        else if(file.endsWith('.sbx')) sbx = file;
    });

    if(shp)
    {
        // parse the zip
        await shapefile.open(tempPath + '/' + shp, tempPath + '/' + dbf)
        .then(async source => 
        {
            return await source.read().then(function log(result) 
            {
                if (result.done)
                {
                    parentPort.postMessage('Done parsing shape.');
                }

                if (prj)
                {
                    let fromProj = '' + fs.readFileSync(tempPath + '/' + prj) + '';

                    let projector = new Projector(fromProj, 'EPSG:4326');
                    projector.project(result.value.geometry)
                }
                else if (!prj && projection && projection.length > 0)
                {
                    let projector = new Projector(projection, 'EPSG:4326');
                    projector.project(result.value.geometry)
                }

                json.features.push(result.value);
                source.read().then(log);
            }).catch(error =>
            {
                throw new Error(error);    
            });
        }).catch(error => 
        { 
            parentPort.postMessage('Error during shapefile convert...' + error);
            parentPort.postMessage('cleaning temp files');
            cleanupTempFiles(tempPath);
            throw new Error(error);
        });
    }
    else
    {
        parentPort.postMessage('Shapefile not found in zip');
        cleanupTempFiles(tempPath);
    }

    return json;
}

async function convertFGDB(url, processDir, projection) 
{
    let json = null;
    let tempPath = process.cwd() + '/processing/' + processDir;
    // unzip. Make processing dir if it doesn't exist
    await fs.promises.mkdir(tempPath, { recursive: true });

    // call the URL zip location and extract the files
    // fgdb may be in folder?

    parentPort.postMessage('Unzipping FGDB...');
    const directory = await unzipper.Open.url(request, url);
    parentPort.postMessage('Done, looping files.');
    parentPort.postMessage(directory.files);
    for(let idx in directory.files)
    {
        let file = directory.files[idx];
        parentPort.postMessage('found a file');
        const content = await file.buffer();
        // write the raw content to the temp path
        await fs.promises.writeFile(tempPath + '/' + file.path, content);
    };

    json = await fgdb(tempPath)
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

                if (!projection) projection = 'EPSG:3005';

                let projector = new Projector(projection, 'EPSG:4326');
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
        cleanupTempFiles(tempPath);
        // cleanup temp folder too!

        return objectOfGeojson;
    },
    function(error)
    {
        console.error('Error during FGDB convert...');
        console.error(error);
        console.log('cleaning temp files');
        cleanupTempFiles(tempPath);
        throw new Error(error);
    });

    return json;
}

function cleanupTempFiles(directory)
{
    let files = fs.readdirSync(directory);

    for (const file of files) 
    {
        fs.unlinkSync(path.join(directory, file));
    }

    fs.rmdir(directory);
}