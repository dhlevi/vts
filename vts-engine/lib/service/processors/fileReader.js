const { v4: uuidv4 } = require('uuid');
const path           = require('path');
const fs             = require('fs');
const DOMParser      = require("xmldom").DOMParser;
const kmlToGeoJson   = require('@tmcw/togeojson');
const shapefile      = require('shapefile');
const fgdb           = require('fgdb');
const unzipper       = require('unzipper');
const Projector      = require('../projector');

module.exports.process = async function(request, processor)
{
    let filePath = processor.attributes.path;
    let dataType = processor.attributes.dataType;
    let projection = processor.attributes.sourceProjection;
    // open the file at the path.
    let result;

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
    else if (dataType === 'wkt')
    {
        result = await convertWKT(fs.readFileSync(filePath, 'utf8'));
    }
    else if (dataType === 'gml')
    {
        result = await convertGML(fs.readFileSync(filePath, 'utf8'));
    }
    else if (dataType === 'shape')
    {
        result = await convertShape(filePath, request.name);
    }
    else if (dataType === 'fgdb')
    {
        result = await convertFGDB(filePath, request.name, projection);
    }

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
};

// Move all of these into a seperate import!

function convertWKT(result) { return result; }

function convertGML(result) { return result; }

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
    fs.mkdirSync(tempPath, { recursive: true });
    result = await fs.createReadStream(path).pipe(unzipper.Extract({ path: tempPath }).on('close', async function(finish)
    {
        // convert
        let files = fs.readdirSync(tempPath);

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
    })).promise().then(res => 
    { 
        return res; 
    });

    return result;
}

async function convertShape(path, processDir) 
{
    let json = null;
    let tempPath = process.cwd() + '/processing/' + processDir;
    // unzip. Make processing dir if it doesn't exist
    fs.mkdirSync(tempPath, { recursive: true });

    // unzip
    json = await fs.createReadStream(path).pipe(unzipper.Extract({ tempPath: './processing' }).on('close', async function(finish)
    {
        // convert
        let files = fs.readdirSync(tempPath);

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
            console.log('Shapefile found in zip. Converting...');
            // parse the shape
            let convertedJson = { type: "FeatureCollection", features: []};
            
            await shapefile.open(tempPath + '/' + shp, tempPath + '/' + dbf)
            .then(source => source.read()
            .then(function log(result) 
            {
                if (result.done) 
                {
                    console.log('Completed, returning geojson response...');
                    cleanupTempFiles(tempPath);

                    return convertedJson;
                }

                // project the feature if it's not in wgs84
                // however, if there is no prj file specified, we have to assume it's ok
                if(prj)
                {
                    console.log('Reprojecting feature...');
                    
                    let fromProj = '' + fs.readFileSync(tempPath + '/' + prj) + '';
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
                cleanupTempFiles(tempPath);
                throw new Error(error);
            });
        }
        else
        {
            console.error('Shapefile not found in zip');
            cleanupTempFiles(tempPath);
        }
    })).promise().then(res => 
    { 
        return res; 
    });

    return json;
}

async function convertFGDB(path, projection) 
{
    let json = null;
    let tempPath = process.cwd() + '/processing/' + processDir;
    // unzip. Make processing dir if it doesn't exist
    fs.mkdirSync(tempPath, { recursive: true });

    console.log('Unzipping FGDB...');
    json = await fs.createReadStream(path).pipe(unzipper.Extract({ path: tempPath }).on('close', function(finish)
    {
        // find a directory with a .gdb extension
        let files = fs.readdirSync(tempPath);

        if (err) 
        {
            console.error('Error during FGDB convert...');
            console.error(error);
            console.log('cleaning temp files');
            cleanupTempFiles(tempPath);
            throw new Error(error);
        }

        let gdbPath = '';

        for(let i = 0 ; i < files.length; i++)
        {
            let fromPath = path.join(tempPath, files[i]);
            if(fromPath.includes('.gdb')) gdbPath = fromPath;
        }
        
        console.log('Found FGDB in path: ' + gdbPath);
        console.log('Processing FGDB...');

        let convertedJson = fgdb(gdbPath)
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
    }))
    .promise().then(res => 
    { 
        return res; 
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