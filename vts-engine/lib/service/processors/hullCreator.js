const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];

    let isConvex = processor.attributes.isConvex === 'true';
    let points = [];

    // cycle through each input node (data should be loaded by now)
    processor.inputNodes.features.forEach(inputNode =>
    {
        // get the files in the disk cache
        let tempPath = process.cwd() + '/cache/' + request.name + '/' + inputNode.name + '/' + inputNode.node + '/';
        let files = fs.readdirSync(tempPath);

        files.forEach(file =>
        {
            // load the feature geometry, push into inputFeatures
            let filePath = path.join(tempPath, file);
            let featureString = fs.readFileSync(filePath, 'utf8');
            let feature = JSON.parse(featureString);

            // add all feature points into the points array
            // we may have a geom collection, so assume collections
            
            let features = [];
            if (feature.geometry.type === 'GeometryCollection')
            {
                features.push(feature.geometry.geometries);
            }
            else
            {
                features.push(feature);
            }

            features.forEach(feat =>
            {
                let coords = turf.getCoords(feat);
                if (feat.geometry.type === 'Point')
                {
                    points.push(turf.point(coords));
                }
                else if (feat.geometry.type === 'LineString')
                {
                    coords.forEach(coord =>
                    {
                        points.push(turf.point(coord));
                    })
                }
                else if (feat.geometry.type === 'Polygon')
                {
                    coords.forEach(ring =>
                    {
                        ring.forEach(coord =>
                        {
                            points.push(turf.point(coord));
                        })
                    })
                }
            });
        });
    });

    // Now that we have all of the points from all input sources, we can
    // create a hull. This will go on the hull output node
    let hull = isConvex ? turf.convex(turf.featureCollection(points)) : turf.concave(turf.featureCollection(points));

    // cache the hull
    let id = uuidv4();
    processor.outputNodes.features.push(id);
    // shove the feature on the disk
    let data = JSON.stringify(hull);

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
};