const express    = require("express");
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const mongoose   = require('mongoose');
const bodyParser = require('body-parser');
const winston    = require('winston');
const expWinston = require('express-winston');
const os         = require('os');
const Queue      = require('./queue');

// schemas
const engineModel = require('../model/engine');
const engineSchema = engineModel.engineSchema;
const Engine = mongoose.model('Engine', engineSchema);

// controllers
//const EngineController = require('./controllers/engineController');

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
    socketTimeoutMS: 45000,           // Close sockets after 45 seconds of inactivity
    user: '',
    pass: ''
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
// initialize processing queue
let queue = new Queue();

// server launch point
exports.launch = function (args) 
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
    Engine.find({ id: id })
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
            engine.metadata.history.push({ user: 'VTS', date: new Date(), event: 'Engine Starting...'});

            engine.save();
        }
    })
    .catch(err =>
    {
        console.log('Engine registration failed. Shutting down...');
        process.exit(0);
    });

    // set up minio or defaults? Probably controller specific
    // maybe store all of these configs in the DB so they can be shared with engines
    
    // register endpoints
    //engineController.init();

    app.get("/", (req, res, next) => 
    {
        res.json(
        {
            message: "Welcome to the VTS Engine. You're probably looking for the VTS Rest Service.",
            uptime: Math.ceil((Date.now() - startTime) / 60000),
            totalRequests: 0,
            runningRequests: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            maxMemory: Math.ceil(os.totalmem() / 1000000),
            usedMemory: Math.ceil((os.totalmem() - os.freemem()) / 1000000),
            links: 
            [
                { rel: 'self', title: 'API Top Level', method: 'GET', href: '/' },
                { rel: 'self', title: 'API Ping', method: 'GET', href: '/Ping' }
            ]
            //engineLinks: engineController.links()
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
    });

    // state change listener
    setInterval(function () 
    {
        Engine.find({ id: engine.id })
        .then(engines => 
        {
            engine = engines[0];
            
            if (engine.currentState !== engine.requestedState) 
            {
                engine.metadata.history.push({ user: 'VTS', date: new Date(), event: 'Received request to transition from ' + engine.currentState + ' to ' + engine.requestedState});

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

                    // if there is a running process
                    // kill the worker thread

                    // empty the queue if anything is on it
                    // make sure to update the requests so
                    // they're pushed back to VTS to reassign
                    if (!queue.isEmpty())
                    {
                        queue = new Queue();
                    }

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
        // for each one, queue them up, then fire off the processors

        // place on the queue with:
        // queue.enqueue(res);
        // dequeue with
        // if !queue.isEmpty()
        // let submission = queue.dequeue();
    }, 5000);
}