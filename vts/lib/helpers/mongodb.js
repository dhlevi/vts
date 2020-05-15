const mongoose = require('mongoose');

let MongoDB = function(connection)
{
    // default to mongodb://localhost/vts
    mongoose.connect(connection, {useNewUrlParser: true});
};