#!/usr/bin/env node

const chalk  = require('chalk');

const engine = require('./lib/service/init');

// Grab command line args
// get the command line, remove first two args (node exe and js location)
// args are:
// -id name (the name of the VTS engine)
// -route route (the desired URL for the main VTS api to use for communicating with the Engine. Can be null if you want no communication)
// -port portnum (the VTS servers port number, defaults to 1338)
// -logpath path (the path for logging, if you want it elsewhere then on the pod)
// -route routeUrl (the URL for the expected accessible route to this engine, used by the admin UI)
// -mongo_connection (defaults to mongodb://localhost/vts)
let args = process.argv.slice(2);

// the engine ID is mandatory! error out if it isn't in the args
if (!args.includes('-id')) {
    console.log('The VTS Engine requires an ID when started. Please include the -id argument with your desired engine ID (this can be any string)');
}

console.log(chalk.yellow('VTS Engine Initializing...'));

// set any needed preferences, setup
// spin up server with command line args
// serve up some topological goodness!
engine.launch(args);