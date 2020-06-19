const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');
const Projector      = require('../projector');
const oracledb       = require('oracledb');


module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let connString = processor.attributes.connection;
    let source     = processor.attributes.source;
    let user       = processor.attributes.user;
    let password   = processor.attributes.password;
    let query      = processor.attributes.query;

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

    if (source.toLowerCase() === 'oracle')
    {
        await processOracle(
        {
            user          : user,
            password      : password,
            connectString : connString
        },
        features, query, request, processor);
    }
};

async function processOracle(connOptions, features, query, request, processor)
{
    let connection;

    try
    {
        connection = await oracledb.getConnection(connOptions);

        features.forEach(feature =>
        {
            // to bind values, include ':<property>' in the query
            // all properties will be passed in so it should find any bound value
            const queryResult = await connection.execute(query, 
                                                         feature.properties,
                                                         { maxRows: 1, outFormat: oracledb.OUT_FORMAT_OBJECT });

            // there will only be one (maxRows: 1)
            for (let row of queryResult.rows) 
            {
                for (let val of row) 
                {
                    feature.properties[val] = row[val];
                }
            }

            // write the polygon to disk
            let id = uuidv4();
            processor.outputNodes.features.push(id);
            // shove the feature on the disk
            let data = JSON.stringify(feature);

            let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
            // create the directory structure
            await fs.mkdir(cachePath, { recursive: true });
            await fs.writeFile(cachePath + '/' + id + '.json', data);
        });
    }
    catch(err)
    {
        console.error(err);
    }

    if (connection)
        await connection.close();
}