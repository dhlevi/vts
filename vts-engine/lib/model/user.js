const Schema = require('mongoose').Schema;

module.exports.userSchema = new Schema(
{
    name: { type: String, required: true},
    password: { type: String, required: true},
    email: { type: String, required: false},
    role: { type: String, enum: ['public', 'admin'], required: true },
    metadata: 
    {
        createdBy: { type: String, default: 'VTS' },
        createdDate: { type: Date, default: Date.now }
    }
},
{ collection: 'users' });