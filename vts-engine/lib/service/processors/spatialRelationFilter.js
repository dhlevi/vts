const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');
const turf           = require('@turf/turf');

module.exports.process = async function(request, processor)
{
    processor.outputNodes.features = [];
    processor.outputNodes.false = [];

    let type = processor.attributes.relationType;

    let relators = [];

    processor.inputNodes.relator.forEach(inputNode =>
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

            relators.push(feature);
        });
    });
    
    // load the features
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

            relators.forEach(relator =>
            {
                // there should only be one relator feature at a time!
                // maybe throw an error if a user links multiple relators?

                let passed = false;

                if (type.toLowerCase() === 'crosses')
                {
                    passed = turf.booleanCrosses(relator, feature);
                }
                else if (type.toLowerCase() === 'contains')
                {
                    passed = turf.booleanContains(relator, feature);
                }
                else if (type.toLowerCase() === 'disjoint')
                {
                    passed = turf.booleanDisjoint(relator, feature);
                }
                else if (type.toLowerCase() === 'equal')
                {
                    passed = turf.booleanEqual(relator, feature);
                }
                else if (type.toLowerCase() === 'overlap')
                {
                    passed = turf.booleanOverlap(relator, feature);
                }
                else if (type.toLowerCase() === 'parallel')
                {
                    passed = turf.booleanParallel(relator, feature);
                }
                else if (type.toLowerCase() === 'pointinpolygon')
                {
                    passed = turf.booleanPointInPolygon(relator, feature);
                }
                else if (type.toLowerCase() === 'pointonline')
                {
                    passed = turf.booleanPointOnLine(relator, feature);
                }
                else if (type.toLowerCase() === 'within')
                {
                    passed = turf.booleanWithin(relator, feature);
                }
    
                // write to the appropriate outputNode
                let id = uuidv4();
                let cachePath = process.cwd() + '/cache/' + request.name + '/' + processor.name;
                if (passed)
                {
                    processor.outputNodes.features.push(id);
                    cachePath += '/features/';
                }
                else
                {
                    processor.outputNodes.false.push(id);
                    cachePath += '/false/';
                }
    
                let data = JSON.stringify(feature);
    
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
        });
    });
};