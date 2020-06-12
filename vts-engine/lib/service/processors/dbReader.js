const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const Projector      = require('../projector');
const utils          = require('../../helpers/utils');
const oracledb       = require('oracledb');
const { parentPort } = require('worker_threads');
module.exports.process = async function(request, processor)
{
    let connString = processor.attributes.connection;
    let source     = processor.attributes.source;
    let user       = processor.attributes.user;
    let password   = processor.attributes.password;
    let query      = processor.attributes.query;
    let geomColumn = processor.attributes.geometryColumn;
    let projection = processor.attributes.sourceProjection;

    // setup the source projection
    if (projection && projection.toLowerCase().includes('http'))
    {
        projection = await utils.getHttpRequest(projection);
    }
    else if (projection && projection.toLowerCase().includes('EPSG:'))
    {
        projection = await utils.getHttpRequest('https://epsg.io/' + projection.split(':')[1] + '.esriwkt');
    }

    processor.outputNodes.features = [];

    // just oracle for now
    if (source.toLowerCase() === 'oracle')
    {
        await processOracle(
        {
            user          : user,
            password      : password,
            connectString : connString
        }, 
        query, geomColumn, projection, request, processor);
    }
};

async function processOracle(connOptions, query, geomColumn, request, processor)
{
    let connection;

    try
    {
        connection = await oracledb.getConnection(connOptions);

        // SDO_UTIL.TO_JSON_VARCHAR ?
        // support binding? Probably not needed in the reader
        // but will be valuable in a SQL Executer
        const queryResult = await connection.execute(query, [],  { outFormat: oracledb.OUT_FORMAT_OBJECT });

        for (let row of queryResult.rows) 
        {
            parentPort.postMessage(row);

            // if the geomColumn is null/empty, we can probably iterate
            // over the results and find the type
            // We can handle multiple geom columns in the same way
            // if there is no geom column, then create a null geometry feature
            // and process standard data ETL

            let geometry = null;
            if(geomColumn && geomColumn.length > 0)
            {
                // grab the geom
                const oraGeom = row[geomColumn];
                // remove from row
                delete row[geomColumn];
                // geojson-ify the geometry object

                if (!projection || projection.length === 0) 
                {
                    // determine projection from SDO_SRID, otherwise 
                    // we have to assume it's 4326
                    if (oraGeom.SDO_SRID && oraGeom.SDO_SRID.length !== 0)
                    {
                        projection = await utils.getHttpRequest('https://epsg.io/' + oraGeom.SDO_SRID + '.js');
                    }
                    else 
                    {
                        projection = 'EPSG:4326';
                    }
                }

                geometry = 
                {
                    type: oraGeom.SDO_GTYPE.toString().endsWith('1') ? 'Point' :
                          oraGeom.SDO_GTYPE.toString().endsWith('2') ? 'LineString' :
                          oraGeom.SDO_GTYPE.toString().endsWith('3') ? 'Polygon' :
                          oraGeom.SDO_GTYPE.toString().endsWith('4') ? 'GeometryCollection' :
                          oraGeom.SDO_GTYPE.toString().endsWith('5') ? 'MultiPoint' :
                          oraGeom.SDO_GTYPE.toString().endsWith('6') ? 'MultiLineString' : 
                                                                       'MultiPolygon',
                    // Need to reformat sdo ordinates to geojson coordinate arrays
                    coordinates: processSdoOrinates(oraGeom)
                };

                if (projection != 'EPSG:4326')
                {
                    new Projector(projection, 'EPSG:4326').project(geometry);
                }

            }

            // push on a new feature
            let feature =
            {
                type: 'Feature',
                geometry: geometry,
                properties: row
            };

            // write the polygon to disk
            let id = uuidv4();
            processor.outputNodes.features.push(id);
            // shove the feature on the disk
            let data = JSON.stringify(feature);

            let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name + '/features/';
            // create the directory structure
            await fs.mkdir(cachePath, { recursive: true });
            await fs.writeFile(cachePath + '/' + id + '.json', data);
        }
    }
    catch(err)
    {
        console.error(err);
    }

    if (connection)
        await connection.close();
}

function processSdoOrinates(oraGeom)
{
    if (oraGeom.SDO_GTYPE.toString().endsWith('1')) // point
    {
        return [oraGeom.SDO_ORDINATES[0], oraGeom.SDO_ORDINATES[1]];
    } 
    else if (oraGeom.SDO_GTYPE.toString().endsWith('2')) // linestring
    {
        let coords = [];
        // fine for 2D, but 3d should be +3 and a Z coord?
        for(let i = 0; i < oraGeom.SDO_ORDINATES.length; i + 2)
        {
            coords.push([oraGeom.SDO_ORDINATES[i], oraGeom.SDO_ORDINATES[i + 1]]);
        }

        return coords;
    }
    else if (oraGeom.SDO_GTYPE.toString().endsWith('3'))
    {
        // polygons may have interior rings

        // SDO_ELEM_INFO = (1,1003,1, 19,2003,1). There are two triplet elements: 1,1003,1 and 19,2003,1.
        // 1003 indicates that the element is an exterior polygon ring; 2003 indicates that the element is an interior polygon ring.
        // 19 indicates that the second element (the interior polygon ring) ordinate specification starts at the 19th number in the SDO_ORDINATES array (that is, 7, meaning that the first point is 7,5).
        // SDO_ORDINATES = (2,4, 4,3, 10,3, 13,5, 13,9, 11,13, 5,13, 2,11, 2,4, 7,5, 7,10, 10,10, 10,5, 7,5).

        let rings = [];
        let thisIndex = 0;
        for(let i = 0; i < oraGeom.SDO_ELEM_INFO.length; i + 3)
        {
            let elemInfo = [oraGeom.SDO_ELEM_INFO[i], oraGeom.SDO_ELEM_INFO[i + 1], oraGeom.SDO_ELEM_INFO[i + 2]];
            
            // get the next rings location (if we have a next ring)
            // note, ordinate arrays are one long array of values, so the index will keep getting higher
            let nextIndex = oraGeom.SDO_ELEM_INFO.length < (i + 3) ? oraGeom.SDO_ELEM_INFO[i + 3] : oraGeom.SDO_ORDINATES.length;
            
            let ring = [];

            // next index will be the next coordinate start point, or the length
            // of the coord array if we're at the last ring
            // loop from the last known index to the next index
            for(let i = thisIndex; i < (nextIndex - 1); i + 2)
            {
                ring.push([oraGeom.SDO_ORDINATES[i], oraGeom.SDO_ORDINATES[i + 1]]);
            }

            // our next ring will be at nextIndex
            thisIndex = nextIndex - 1;

            rings.push(ring);
        }

        // should have all possible rings, so just return
        return rings;
    }
    else if (oraGeom.SDO_GTYPE.toString().endsWith('4'))
    {
        // GeometryCollection... unsupported for now
        // but need to figure out how to push this through.
        // Should be the same as polygon with rings, just need
        // to test the elem info array
        return [];
    } 
    else if (oraGeom.SDO_GTYPE.toString().endsWith('5'))  // MultiPoint
    {
        let coords = [];
        // fine for 2D, but 3d should be +3 and a Z coord?
        for(let i = 0; i < oraGeom.SDO_ORDINATES.length; i + 2)
        {
            coords.push([oraGeom.SDO_ORDINATES[i], oraGeom.SDO_ORDINATES[i + 1]]);
        }

        return coords;
    }
    else if (oraGeom.SDO_GTYPE.toString().endsWith('6'))
    {
        let lines = [];
        let thisIndex = 0;
        for(let i = 0; i < oraGeom.SDO_ELEM_INFO.length; i + 3)
        {
            let elemInfo = [oraGeom.SDO_ELEM_INFO[i], oraGeom.SDO_ELEM_INFO[i + 1], oraGeom.SDO_ELEM_INFO[i + 2]];
            
            // get the next lines location (if we have a next line)
            // note, ordinate arrays are one long array of values, so the index will keep getting higher
            let nextIndex = oraGeom.SDO_ELEM_INFO.length < (i + 3) ? oraGeom.SDO_ELEM_INFO[i + 3] : oraGeom.SDO_ORDINATES.length;
            
            let line = [];

            // next index will be the next coordinate start point, or the length
            // of the coord array if we're at the last ring
            // loop from the last known index to the next index
            for(let i = thisIndex; i < (nextIndex - 1); i + 2)
            {
                line.push([oraGeom.SDO_ORDINATES[i], oraGeom.SDO_ORDINATES[i + 1]]);
            }

            // our next line will be at nextIndex
            thisIndex = nextIndex - 1;

            lines.push(ring);
        }

        // should have all possible lines, so just return
        return lines;
    }
    else
    {
        // MultiPolygon, polygon, but in another bounding array

        // Multipolygons work the same as polygons, which may have interior rings
        // however, we need to check the elemInfo array to determine if the next set of coordinates
        // is a new exterior ring, or the interior ring for the previous polygon...
        // 1003 === exterior ring ie New Polygon
        // 2003 === interior ring of the polygon

        // SDO_ELEM_INFO = (1,1003,1, 19,2003,1). There are two triplet elements: 1,1003,1 and 19,2003,1.
        // 1003 indicates that the element is an exterior polygon ring; 2003 indicates that the element is an interior polygon ring.
        // 19 indicates that the second element (the interior polygon ring) ordinate specification starts at the 19th number in the SDO_ORDINATES array (that is, 7, meaning that the first point is 7,5).
        // SDO_ORDINATES = (2,4, 4,3, 10,3, 13,5, 13,9, 11,13, 5,13, 2,11, 2,4, 7,5, 7,10, 10,10, 10,5, 7,5).

        let polygons = [];
        let rings = [];
        let thisIndex = 0;
        for(let i = 0; i < oraGeom.SDO_ELEM_INFO.length; i + 3)
        {
            let elemInfo = [oraGeom.SDO_ELEM_INFO[i], oraGeom.SDO_ELEM_INFO[i + 1], oraGeom.SDO_ELEM_INFO[i + 2]];
            
            if (i > 0 && elemInfo[1] === 1003) // exterior ring, this is a new polygon
            {
                // add the rings to the polygon output
                polygons.push(rings);
                // reset rings array
                rings = [];
            }
            
            // get the next rings location (if we have a next ring)
            // note, ordinate arrays are one long array of values, so the index will keep getting higher
            let nextIndex = oraGeom.SDO_ELEM_INFO.length < (i + 3) ? oraGeom.SDO_ELEM_INFO[i + 3] : oraGeom.SDO_ORDINATES.length;
            
            let ring = [];

            // next index will be the next coordinate start point, or the length
            // of the coord array if we're at the last ring
            // loop from the last known index to the next index
            for(let i = thisIndex; i < (nextIndex - 1); i + 2)
            {
                ring.push([oraGeom.SDO_ORDINATES[i], oraGeom.SDO_ORDINATES[i + 1]]);
            }

            // our next ring will be at nextIndex
            thisIndex = nextIndex - 1;

            rings.push(ring);
        }

        // we're done, so make sure we push the last rings onto the poly array
        polygons.push(rings);

        // should have all possible rings, so just return
        return polygons;
    }
}