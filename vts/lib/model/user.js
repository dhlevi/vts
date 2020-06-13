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

module.exports.links = function(user)
{
    let links = 
    [
        { rel: 'self', title: 'Fetch User', method: 'GET', href: '/Users/' + user._id },
        { rel: 'update', title: 'Update User', method: 'PUT', href: '/Users/' + user._id },
        { rel: 'delete', title: 'Delete Request', method: 'DELETE', href: '/Users/' + user._id },
    ];

    user.links = links;
};