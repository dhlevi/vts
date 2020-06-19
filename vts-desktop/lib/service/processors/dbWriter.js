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
    let drop       = processor.attributes.dropTable;
    let truncate   = processor.attributes.emptyTable;
    let table      = processor.attributes.table;
    let geomColumn = processor.attributes.geometryColumn;
    let projection = processor.attributes.sourceProjection;

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

    if (source.toLowerCase() === 'oracle')
    {
        await processOracle(
        {
            user          : user,
            password      : password,
            connectString : connString
        },
        features, drop, truncate, table, geomColumn, projection, request, processor);
    }
};

async function processOracle(connOptions, features, drop, truncate, table, geomColumn, request, processor)
{
    let connection;

    try
    {
        connection = await oracledb.getConnection(connOptions);

        // pre-processing
        const stmts = [];

        
        if (drop)
        {
            stmts.push(`DROP TABLE ${table}`);
            stmts.push(`CREATE TABLE ${table} (id NUMBER, geometry MDSYS.SDO_GEOMETRY)`);
        }
        else if (truncate)
        {
            stmts.push(`DELETE FROM ${table}`);
        }

        for (const s of stmts) 
        {
            try 
            {
                await connection.execute(s);
            } 
            catch(e) 
            {
                if (e.errorNum != 942)
                    throw Error(e);
            }
        }

        // loop through each feature, insert as needed

        const GeomType = await connection.getDbObjectClass('MDSYS.SDO_GEOMETRY');
        features.forEach(feature =>
        {
            if (feature.geometry)
            {
                const geometry = new GeomType(
                {
                    SDO_GTYPE: feature.geometry.type === 'Point'              ? 2001 :
                               feature.geometry.type === 'LineString'         ? 2002 :
                               feature.geometry.type === 'Polygon'            ? 2003 :
                               feature.geometry.type === 'GeometryCollection' ? 2004 :
                               feature.geometry.type === 'MultiPoint'         ? 2005 :
                               feature.geometry.type === 'MultiLineString'    ? 2006 :
                                                                                2007,
                    SDO_SRID: null,
                    SDO_POINT: null,
                    SDO_ELEM_INFO: [],
                    SDO_ORDINATES: []
                });

                processElemOrdinates(feature, geometry);
            }

            // we have a feature geometry converted, now map in the rest of the
            // insert statement

            let columns = '';
            let values = '';

            for(const property in feature.properties)
            {
                columns += property + ',';
                values += ':' + property + ',';
            }

            if (geometry) {
                feature.properties[geomColumn] = geometry;
                columns += geomColumn + ',';
                values += ':' + geomColumn + ',';
            }

            columns = columns.substring(0, columns.length - 1);
            values = values.substring(0, values.length - 1);

            // Check a feature property flag for insert/update?
            await connection.execute(
                `INSERT INTO ${table} (${columns}) VALUES (${values})`,
                feature.properties,
                { autoCommit: true }
            );
        });
    }
    catch(err)
    {
        console.error(err);
    }

    if (connection)
        await connection.close();
}

function processElemOrdinates(feature, geometry)
{
    let elemInfo = [];
    let ordinates = [];

    if (feature.geometry.type === 'Point')
    {
        elemInfo = [1, 1, 1];
        ordinates = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
    }
    else if (feature.geometry.type === 'LineString')
    {
        elemInfo = [1, 2, 1];
        feature.geometry.coordinates.forEach(point =>
        {
            ordinates.push(point[0]);
            ordinates.push(point[1]);
        });
    }
    else if (feature.geometry.type === 'Polygon')
    {
        elemInfo = [1, 1003, 1]; // plus interior rings (2003)
        feature.geometry.coordinates.forEach((ring, index) =>
        {
            if (index > 0) {
                elemInfo = elemInfo.concat([ordinates.length + 1, 2003, 1]);
            }

            ring.forEach(point =>
            {
                ordinates.push(point[0]);
                ordinates.push(point[1]);
            });
        });
    }
    else if (feature.geometry.type === 'MultiPoint')
    {
        feature.geometry.coordinates.forEach(point =>
        {
            elemInfo = [ordinates.length + 1, 1, 1];
            ordinates.push(point[0]);
            ordinates.push(point[1]);
        });
    }
    else if (feature.geometry.type === 'MultiLineString')
    {
        feature.geometry.coordinates.forEach(line =>
        {
            line.forEach(point =>
            {
                elemInfo = [ordinates.length + 1, 2, 1];
                ordinates.push(point[0]);
                ordinates.push(point[1]);
            });
        });
    }
    else if (feature.geometry.type === 'MultiPolygon')
    {
        feature.geometry.coordinates.forEach(polygon =>
        {
            elemInfo = elemInfo.concat([ordinates.length + 1, 1003, 1]);
            polygon.forEach((ring, index) =>
            {
                if (index > 0) {
                    elemInfo.concat([ordinates.length, 2003, 1]);
                }

                ring.forEach(point =>
                {
                    ordinates.push(point[0]);
                    ordinates.push(point[1]);
                });
            });
        });
    }
    // geom collection???

    geometry.SDO_ELEM_INFO = elemInfo;
    geometry.SDO_ORDINATES = ordinates;
}