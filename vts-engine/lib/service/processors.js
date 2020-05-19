const express    = require("express");
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const mongoose   = require('mongoose');
const bodyParser = require('body-parser');
const winston    = require('winston');
const expWinston = require('express-winston');
const os         = require('os');

// controllers, helpers, etc.
const EngineController = require('./engineController');

// schemas
const engineModel   = require('../model/engine');
const engineSchema  = engineModel.engineSchema;
const Engine        = mongoose.model('Engine', engineSchema);
const requestModel  = require('../model/request');
const requestSchema = requestModel.requestSchema;
const Request       = mongoose.model('Request', requestSchema);

module.exports.requestProcessor = function()
{

};