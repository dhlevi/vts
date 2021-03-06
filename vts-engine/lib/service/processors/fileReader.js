const { v4: uuidv4 } = require('uuid');
const path           = require('path');
const fs             = require('fs');
const DOMParser      = require("xmldom").DOMParser;
const kmlToGeoJson   = require('@tmcw/togeojson');
const shapefile      = require('shapefile');
const gml2json       = require('gml2json');
const fgdb           = require('fgdb');
const unzipper       = require('unzipper');
const Projector      = require('../projector');
const rimraf         = require('rimraf');
const { parentPort } = require('worker_threads');

module.exports.process = async function(request, processor)
{
    let filePath = processor.attributes.path;
    let dataType = processor.attributes.dataType;
    let projection = processor.attributes.sourceProjection;
    // open the file at the path.
    let result = []

    if (dataType === 'json')
    {
        result = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    else if (dataType === 'kml')
    {
        result = await convertKML(fs.readFileSync(filePath, 'utf8'));
    }
    else if (dataType === 'kmz')
    {
        result = await convertKMZ(filePath, request.name);
    }
    else if (dataType === 'gml')
    {
        result = await convertGML(fs.readFileSync(filePath, 'utf8'), projection);
    }
    else if (dataType.startsWith('shape'))
    {
        result = await convertShape(filePath, request.name, projection);
    }
    else if (dataType === 'fgdb')
    {
        result = await convertFGDB(filePath, request.name, projection);
    }

    // clear processors path (if it exists)
    let processorDir = process.cwd() + '/processing/' + request.name;
    await rimraf(processorDir, function () { parentPort.postMessage('Cleared cache for ' + processorDir); });

    // after extracting the data, validate we have a geojson blob. If its a parse from
    // a different type, it should be fine, just external GeoJSON needs a check really
    if (!result || !result.hasOwnProperty('type') || result.type.toLowerCase() !== 'featurecollection')
    {
        throw Error('not a feature collection');
    }

    // attach resulting blob to the processor 'features' output node.    
    // and/or write all features to the cache, and attach only the "id"
    processor.outputNodes.features = [];
    for(let i = 0; i < result.features.length; i++) 
    {
        let feature = result.features[i];
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

async function convertKMZ(path, processDir) 
{
    let result = null;
    let tempPath = process.cwd() + '/processing/' + processDir;
    // unzip. Make processing dir if it doesn't exist
    await fs.promises.mkdir(tempPath, { recursive: true });

    await fs.createReadStream(path)
    .pipe(unzipper.Extract({ path: tempPath })
                  .on('close', finish => { parentPort.postMessage('Finished unzipping'); })
    ).promise().then(res =>
    {
        parentPort.postMessage('Pipe exited');
        return res;
    });

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

async function convertShape(path, processDir, projection) 
{
    let json = { type: "FeatureCollection", features: [] };
    let tempPath = process.cwd() + '/processing/' + processDir;
    // unzip. Make processing dir if it doesn't exist
    await fs.promises.mkdir(tempPath, { recursive: true });

    parentPort.postMessage('Zip file: ' + path);
    parentPort.postMessage('Unzipping to: ' + tempPath);

    await fs.createReadStream(path)
            .pipe(unzipper.Extract({ path: tempPath })
                          .on('close', finish => { parentPort.postMessage('Finished unzipping'); })
            ).promise().then(res =>
            {
                parentPort.postMessage('Pipe exited');
                return res;
            });

    parentPort.postMessage('Stream complete, process shapefile.');

    // convert
    let files = fs.existsSync(tempPath) ? fs.readdirSync(tempPath) : [];

    let shp, dbf, prj, shx, cpg, qpj, sbn, sbx;

    // locate the shapefile params
    parentPort.postMessage('Scanning files.');
    files.forEach(function (file) 
    {
        parentPort.postMessage(file);
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
        parentPort.postMessage('Shapefile found in zip. Converting...');
        // parse the shape
        
        parentPort.postMessage('opening shape ' + tempPath + '/' + shp);
        parentPort.postMessage('opening dbf ' + tempPath + '/' + dbf);

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

    parentPort.postMessage('Process exit');
    parentPort.postMessage(json);
    return json;
}

async function convertFGDB(filePath, processDir, projection) 
{
    let json = null;
    let tempPath = process.cwd() + '/processing/' + processDir;
    // unzip. Make processing dir if it doesn't exist
    await fs.promises.mkdir(tempPath, { recursive: true });

    await fs.createReadStream(filePath)
    .pipe(unzipper.Extract({ path: tempPath })
                  .on('close', finish => { parentPort.postMessage('Finished unzipping'); })
    ).promise().then(res =>
    {
        parentPort.postMessage('Pipe exited');
        return res;
    });

    // process files extracted to tempPath
    json = await fgdb(tempPath)
    .then(function(objectOfGeojson)
    {
        parentPort.postMessage('Successfully processed FGDB!');
        
        // there may be multiple feature classes, and we may need to do some projection...
        let featureClassKeys = Object.keys(objectOfGeojson);
        for(let i = 0; i < featureClassKeys.length; i++)
        {
            let key = featureClassKeys[i];
            let featureClass = objectOfGeojson[key];

            if(featureClass.bbox[0] > 180 || featureClass.bbox[0] < 180)
            {
                parentPort.postMessage('Reprojecting feature: ' + key);
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

        parentPort.postMessage('Sending geojson response...');
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
        parentPort.postMessage('cleaning temp files');
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