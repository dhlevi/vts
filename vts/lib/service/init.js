const express    = require("express");
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const mongoose   = require('mongoose');
const bodyParser = require('body-parser');
const winston    = require('winston');
const expWinston = require('express-winston');
const validation = require('./middleware/auth.validation.middleware');
// controllers
const processors        = require('./controllers/processors');
const EngineController  = require('./controllers/engineController');
const RequestController = require('./controllers/requestController');
const UserController    = require('./controllers/usersController');

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
let port = 1337;
let mongoString = 'mongodb://localhost/vts';
let adminUser = 'admin';
let adminPassword = 'password';
let adminEmail = '';
let logpath = './logs/';

let engineController = new EngineController(app);
let requestController = new RequestController(app);
let userController = new UserController(app, 'vtsSecret'); // obviously you want to move the secret elsewhere...
let startTime = Date.now();

// server launch point
exports.launch = function (args) 
{
    // parse through the args
    args.forEach((arg, index) => {
        if (arg && arg.startsWith('-')) 
        {
            switch (arg)
            {
                case '-admin':
                    adminUser = args[index + 1];
                break;
                case '-password':
                    adminPassword = args[index + 1];
                break;
                case '-port':
                    port = parseInt(args[index + 1], 10);
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
    
    // register endpoints
    engineController.init();
    requestController.init();
    userController.init();

    app.get("/", (req, res, next) => 
    {
        res.json(
        {
            message: "Welcome to the VTS rest service",
            links: 
            [
                { rel: 'self', title: 'API Top Level', method: 'GET', href: '/' },
                { rel: 'self', title: 'API Ping', method: 'GET', href: '/Ping' },
                { rel: 'self', title: 'API Login', method: 'POST', href: '/Login' }
            ],
            engineLinks: engineController.links(),
            requestLinks: requestController.links(),
            userLinks: userController.links()
        });
    });

    app.get("/Ping", [validation.validJWTNeeded], (req, res, next) => 
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
            filename: logpath + 'vts-main.log',
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
        console.log('VTS service started correctly, and is waiting for requests!');
        // activate processors
        processors.requestProcessor();
    });
}