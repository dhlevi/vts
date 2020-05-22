#!/usr/bin/env node

const chalk  = require('chalk');

const vts    = require('./lib/service/init');

// Grab command line args
// get the command line, remove first two args (node exe and js location)
// args are:
// -admin username   (the admin user name, any string)
// -password password (the admin users password, any string)
// -port portnum (the VTS servers port number, defaults to 1337)
// -email address (the admin email address where warnings, etc are sent)
// -logpath path (the path for logging, if you want it elsewhere then on the pod)
// -mongo_connection (defaults to mongodb://localhost/vts)
let args = process.argv.slice(2);

console.log(chalk.yellow('Welcome to VTS... Initializing...'));

// set any needed preferences, setup
// spin up server with command line args
// serve up some topological goodness!
vts.launch(args);