#!/usr/bin/env node

const chalk  = require('chalk');
const os     = require('os');
const clui   = require('clui');
const clear  = require('clear');

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

// sit and spin, show OS stats to keep the pod alive
// if we're not running in a pod, this is probably not needed, but it's fun!
let Gauge = clui.Gauge;
let Sparkline = clui.Sparkline;
Spinner = clui.Spinner;
 
let busyMessage = new Spinner('VTS is running...', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);
busyMessage.start();
 
let totalMemory = os.totalmem();
let arch = os.arch();
let startTime = Date.now();
let cpus = os.cpus();

let reqsPerSec = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];

setInterval(function () 
{
  clear();
  busyMessage.message('VTS Engine is running!');
  
  // OS/Pod architecture
  console.log('Live on an ' + arch + ' ' + os.type() + ' os');
  
  // Uptime
  console.log('VTS Engine uptime at ' + Math.ceil((Date.now() - startTime) / 60000) + ' minutes');

  // CPU
  console.log('Powered by ' +  cpus[0].model + ' firing with ' + cpus.length + ' logical cores');

  // Memory information
  let freeMemory = os.freemem();
  let usedMemory = totalMemory - freeMemory;
  let memValue = Math.ceil(usedMemory / 1000000) + ' MB';
  // write out the current memory consumption on the pod
  console.log('System Memory:');
  console.log(Gauge(usedMemory, totalMemory, 20, totalMemory * 0.8, memValue));

  // sparkline showing volume of requests from the vts server
  // cut the first element
  reqsPerSec = reqsPerSec.splice(1);
  // push the current running requests count
  reqsPerSec.push(0);
 
  console.log('VTS Requests:');
  console.log(Sparkline(reqsPerSec, ' requests/min'));

  // if requests are hitting high limits, or memory is running low
  // we should alert the user and/or throttle the server until things calm down.
  // send an email to the admin that things are looking scary
  // could also include a webhook for rocketchat or slack?

}, 60000); // refresh every minute 60000