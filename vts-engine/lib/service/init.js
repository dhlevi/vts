const express    = require("express");
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const mongoose   = require('mongoose');
const bodyParser = require('body-parser');
const winston    = require('winston');
const expWinston = require('express-winston');
const os         = require('os');
const rimraf     = require('rimraf');
const fs         = require('fs');
// controllers, helpers, etc.
const EngineController = require('./engineController');
const DataController   = require('./dataController');
const processors       = require('./processors');
// schemas
const engineModel   = require('../model/engine');
const engineSchema  = engineModel.engineSchema;
const Engine        = mongoose.model('Engine', engineSchema);
const requestModel  = require('../model/request');
const requestSchema = requestModel.requestSchema;
const Request       = mongoose.model('Request', requestSchema);
const cacheModel     = require('../model/cache');
const cacheSchema    = cacheModel.cacheSchema;
const Cache          = mongoose.model('Cache', cacheSchema);

// configure express app

let app = express();
// Express logging, security, etc.
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// set body parse size
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));

// configuration for cors, headers
app.disable('x-powered-by');
app.use(function (req, res, next) 
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization,responseType');
    res.setHeader('Access-Control-Expose-Headers', 'x-total-count,x-pending-comment-count,x-next-comment-id');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Cache-Control', 'max-age=4');
    next();
});

// mongodb connect (move configs int process.env)
let dbOptions = 
{
    useUnifiedTopology: true,
    useNewUrlParser: true,
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500,           // Reconnect every 500ms
    poolSize: 10,                     // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000,          // Give up initial connection after 10 seconds
    socketTimeoutMS: 45000           // Close sockets after 45 seconds of inactivity
};

mongoose.Promise = global.Promise;

// default configurations
let id = null;
let port = 1338;
let route = null;
let mongoString = 'mongodb://localhost/vts';
let adminEmail = '';
let logpath = './logs/';

//let engineController = new EngineController(app);
let startTime = Date.now();
let engine;
let totalRequests = 0;
let currentRunningRequests = 0;
let queuedRequests = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
let runningRequests = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

let engineController;
let dataController;

let dequeuing = false;

// server launch point
exports.launch = async function (args) 
{
    // parse through the args
    args.forEach((arg, index) => {
        if (arg && arg.startsWith('-')) 
        {
            switch (arg)
            {
                case '-id':
                    id = args[index + 1];
                break;
                case '-port':
                    port = parseInt(args[index + 1], 10);
                break;
                case '-route':
                    route = args[index + 1];
                break;
                case '-email':
                    adminEmail = args[index + 1];
                break;
                case '-logpath':
                    logpath = args[index + 1];
                    if (!logpath.endsWith('/'))
                    {
                        logpath += '/';
                    }
                break;
                case '-mongo_connection':
                    mongoString = args[index + 1];
                break;
            }
        }
    });

    // start the mongoose mongo connection
    mongoose.connect(mongoString, dbOptions);

    if (!id)
    {
        console.log('The ID for the engine was invalid. Shutting down...');
        process.exit(0);
    }

    // When an engine starts, it needs to register itself.
    // All that we need to do is make sure a records exists in the shared DB instance
    // If the ID doesn't exist, we create a new one. If an ID does exist, we don't have to do
    // anything. If a user has configured 2 engines with the same ID... well, nothing
    // should break, but it would act as an unmonitored cluster, so requests could
    // go to whichever processor triggers first. Probably not a good idea.
    // The main VTS service communicates with the engines via the DB. There is 
    // no direct communication. This way, we don't have to worry about configuring
    // urls, etc.

    // register engine
    await Engine.find({ id: id })
    .then(existingEngines => 
    {
        if (existingEngines.length === 0) 
        {
            engine = new Engine();
            engine.id = id;
            engine.route = route;
            engine.currentState = 'Stopped';
            engine.requestedState = 'Running';
            engine.metadata.history.push({ user: 'VTS', date: new Date(), event: 'Engine Registered'});

            engine.save();
        }
        else
        {
            engine = existingEngines[0];
            engine.currentState = 'Stopped';
            engine.requestedState = 'Running';
            // flush the message buffer
            engine.messages = [];
            engine.metadata.history.push({ user: 'VTS', date: new Date(), event: 'Engine Starting...'});

            engine.save();
        }

        engineController = new EngineController(engine);
    })
    .catch(err =>
    {
        console.log('Engine registration failed. Shutting down...');
        console.error(err);
        process.exit(0);
    });

    dataController = new DataController(app, logpath);
    dataController.init();

    app.get("/", (req, res, next) => 
    {
        res.json(
        {
            message: "Welcome to the VTS Engine. You're probably looking for the VTS Rest Service.",
            uptime: Math.ceil((Date.now() - startTime) / 60000),
            totalRequests: totalRequests,
            queuedRequests: queuedRequests,
            runningRequests: runningRequests,
            maxMemory: Math.ceil(os.totalmem() / 1000000),
            usedMemory: Math.ceil((os.totalmem() - os.freemem()) / 1000000),
            links: 
            [
                { rel: 'self', title: 'API Top Level', method: 'GET', href: '/' },
                { rel: 'self', title: 'API Ping', method: 'GET', href: '/Ping' }
            ],
            dataLinks: dataController.links()
        });
    });

    app.get("/Ping", (req, res, next) => 
    {
        res.json(['Pong']);
    });

    // register UI components
    app.use(express.static(__dirname + '/ui/'));

    // setup winston logging

    app.use(expWinston.logger(
    {
        // new winston.transports.Console()
        transports: [ new winston.transports.File({
            level: 'debug',
            filename: logpath + 'vts-engine.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            colorize: false,
            }) ],
        format: winston.format.combine(winston.format.colorize(), winston.format.json()),
        meta: true,
        msg: "HTTP {{req.method}} {{req.url}} Status {{res.statusCode}} responded in {{res.responseTime}}ms",
        expressFormat: true,
        colorize: true
    }));

    // start server
    server = app.listen(port, () =>
    {
        console.log('VTS engine started correctly!');

        // state change listener
        setInterval(function () 
        {
            Engine.find({ id: engine.id })
            .then(engines => 
            {
                engine = engines[0];
                
                if (engine.currentState !== engine.requestedState) 
                {
                    engine.messages.push({ sender: 'VTS', timestamp: new Date(), message: 'Received request to transition from ' + engine.currentState + ' to ' + engine.requestedState});

                    if (engine.requestedState === 'Running')
                    {
                        engine.currentState = 'Running';
                    }
                    else if (engine.requestedState === 'Stopped')
                    {
                        engine.currentState = 'Stopped';
                    }
                    else if (engine.requestedState === 'Flushing')
                    {
                        engine.requestedState = engine.currentState;
                        engine.currentState = 'Flushing';
                        engine.save();
                        
                        // run the flush, reset to running
                        engineController.flush();

                        engine.currentState = engine.requestedState;
                        engine.save();
                    }

                    engine.save();
                }
            })
            .catch(err =>
            {
                console.log('Engine registration failed. Shutting down...');
                process.exit(0);
            });
        }, 5000);

        // request submission check
        setInterval(function ()
        {
            // get all requests that are in a submitted state for this engine (ignore any other state)
            Request.find({ engine: engine.id, status: 'Submitted' }).then(requests =>
            {
                totalRequests += requests.length;
                queuedRequests = queuedRequests.splice(1);
                queuedRequests.push(engineController.queue.getLength());
                runningRequests = runningRequests.splice(1);
                runningRequests.push(currentRunningRequests);
                // increment running requests when a request is dequeued
                requests.forEach(request =>
                {
                    if (!engineController.flushing)
                    {
                        request.status = 'Queued';
                        request.metadata.revision += 1;
                        request.metadata.history.push({ user: 'VTS', date: new Date(), event: 'Request Queued by engine ' + engine.name });
                        request.save().then(updatedRequest =>
                        {
                            // Add the updated request to the queue.
                            // The queue process will dequeue and spin off
                            // worker threads as needed.
                            engineController.enqueue(updatedRequest);
                        })
                        .catch(error =>
                        {
                            console.log('Faild to update request status: ' + error);
                        });
                    }
                })
            })
            .catch(error =>
            {
                console.log('Faild to fetch requests: ' + error);
            });
        }, 5000);

        // queue check. Process next queued item
        setInterval(async function()
        {
            // 'if' method spaces out workers, 'while' method gets smaller tasks done sooner...
            if (engineController.queue && !engineController.queue.isEmpty())
            {
                // dequeue
                let dequeuedRequest = engineController.queue.dequeue();
                // refresh request, in case of any changes
                Request.findById(dequeuedRequest._id).then(async request =>
                {
                    currentRunningRequests++;

                    processors.requestProcessor(request, engine.route, mongoString).then(code =>
                    {
                        currentRunningRequests--;
                    });
                })
                .catch(error =>
                {
                    console.error('Error occured refreshing request: ' + error);
                });
            }
        }, 10000);

        // cache cleanup
        setInterval(function()
        {
            let cacheDir = process.cwd() + '/cache/';
            fs.readdir(cacheDir, (err, dirs) =>
            {
                // does ID exists in request? if not, delete everything.
                dirs.forEach(dir =>
                {
                    Request.find({ name: dir }).then(requests =>
                    {
                        // that ID doesn't exist anymore... so cleanup!
                        if (requests.length === 0)
                        {
                            rimraf(process.cwd() + '/cache/' + dir, function () { console.log('Cleared cache for ' + dir); });
                        }

                        // also check the MongoDB cache collection, in case a cache was used
                        Cache.deleteMany({ request: dir });

                    })
                    .catch(error =>
                    {
                        console.log('Faild to fetch requests: ' + error);
                    });
                });
            });
        }, 1000 * 60 * 30); // 30 minute cleanup cycle

        // scheduled task checker
        setInterval(async function ()
        {
            let now = new Date();
            Request.find({  scheduledTask: true, engine: engine.id }).then(requests =>
            {
                // Find out if any tasks need execution
                requests.forEach(async request =>
                {
                    if ((now - request.nextRunTime) > 0)
                    {
                        // clear out last run messages
                        request.messages = [];

                        // reset processor state
                        request.processors.forEach(processor =>
                        {
                            processor.processed = false;
                        });

                        // delete any existing cache
                        let cacheDir = process.cwd() + '/cache/' + request.name;
                        await rimraf(cacheDir, function () { console.log('Cleared cache for ' + cacheDir); });
                        Cache.deleteMany({ request: request.name });
                        
                        // queue the request

                        // Convert the interval to milliseconds
                        let interval = request.interval * (request.intervalUnit === 'Seconds' ? 1000 :
                                                           request.intervalUnit === 'Minutes' ? (1000 * 60) :
                                                           request.intervalUnit === 'Hours'   ? (1000 * 60 * 60) :
                                                           (1000 * 60 * 60 * 24));
                        request.nextRunTime = new Date(new Date().getTime() + interval);
                        
                        request.save().then(updatedRequest =>
                        {
                            // Just fire the request. We could use the queue mechanism
                            // but we don't want scheduled tasks to get bogged down
                            // in the wait if the server is under heavy load
                            currentRunningRequests++;
                            
                            processors.requestProcessor(request, engine.route, mongoString).then(code =>
                            {
                                currentRunningRequests--;
                            });
                            //engineController.enqueue(updatedRequest);
                        })
                    }
                });
            })
            .catch(error =>
            {
                console.log('Faild to fetch requests: ' + error);
            });
        }, 10000);
    });
};