module.exports.processRequest = async function(request)
{
    // update request status
    request.status = 'In Progress';
    request.metadata.lastUpdatedDate = new Date();
    request.metadata.revision += 1;
    request.messages.push({ message: 'Started processing Request', sender: 'vts', timestame: new Date() });
    request.metadata.history.push({ event: 'Request Dequeued', user: 'vts', date: new Date() });


    // cycle through processors
    let completedProcessors = 0;
    let failed = false;
    let attempts = 0;
    while (completedProcessors !== request.processors.length)
    {
        attempts++;
        for (let idx in request.processors)
        {
            let processor = request.processors[idx];
            if (!processor.processed)
            {
                try
                {
                    await runProcessor(processor, request);
                }
                catch(error)
                {
                    console.log('Error occured during processing: ' + error);
                    failed = true;
                    completedProcessors = request.processors.length;
                    request.messages.push({ message: 'Error occured during processing of processor ' + processor.name + ':' + processor.type + '. Error: ' + error, sender: 'vts', timestame: new Date()});
                    break;
                }
            }
            else
            {
                completedProcessors++;
            }

            // if we've run more times then we have processors, something went wrong
            // so just fail out.
            if (attempts > request.processors.length + 1)
            {
                failed = true;
            }
        }

        if (failed)
        {
            break;
        }
    }

    // we're done. Update and close off
    request.status = failed ? 'Failed' : 'Completed';
    request.metadata.lastUpdatedDate = new Date();
    request.metadata.revision += 1;
    request.messages.push({ message: failed ? 'Request processing failed due to errors' : 'Successfully processed Request', sender: 'vts', timestame: new Date()});
    request.metadata.history.push({ event: 'Request completed', user: 'vts', date: new Date() });

    return request;
}

async function runProcessor(processor, request)
{
    // Are the input nodes complete? If not, run them first.
    let inputNodes = Object.keys(processor.inputNodes);
    inputNodes.forEach(key =>
    {

        // each input node (usually only one, 'features') will be an
        // array of their ID and type, so "23" and node "features"
        // So to check completion, we need to loop through input nodes
        // then for each key, loop through their processors
        // output nodes are just for holding feature ID's
        processor.inputNodes[key].forEach(node =>
        {
            // use node.name to find the node and check if it's complete?
            for(let idx in request.processors)
            {
                let inputProcessor = request.processors[idx];
                if (node.name === inputProcessor.name && !inputProcessor.processed)
                {
                    runProcessor(inputProcessor, request);
                }
            }
        });
    });

    // input nodes are complete, so now we can run this process

    // features is the array storing all resulting feature ID's for the process. This is attached to the processor output
    // This requires all processors to be very specific on their implementation
    // of the process method! processor file names must match type 100%
    await require(process.cwd() + '/lib/service/processors/' + processor.type).process(request, processor);
    
    processor.processed = true;

    let countOfFeatures = 0;
    for(const node in processor.outputNodes)
    {
        countOfFeatures + processor.outputNodes[node].length;
    }

    request.messages.push({ message: 'Finished processing ' + countOfFeatures + ' features from ' + processor.name + ' - ' + processor.type, sender: 'vts', timestame: new Date()});

    return request;
}