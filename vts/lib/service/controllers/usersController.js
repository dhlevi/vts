const mongoose   = require('mongoose');
const rp         = require('request-promise-native');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const validation = require('../middleware/auth.validation.middleware');
// schemas
const userModel   = require('../../model/user');
const userSchema  = userModel.userSchema;
const User        = mongoose.model('User', userSchema);

let UsersController = function(app, jwtsecret)
{
    this.app = app;
    this.jwtSecret = jwtsecret;
};

UsersController.prototype.init = function()
{
    this.app.get("/Users", [validation.validJWTNeeded, validation.requiredRole('admin')], (req, res, next) =>
    {
        let limit = req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
        let page = 0;

        if (req.query) 
        {
            if (req.query.page) 
            {
                req.query.page = parseInt(req.query.page);
                page = Number.isInteger(req.query.page) ? req.query.page : 0;
            }
        }

        User.find()
            .limit(limit)
            .skip(limit * page)
            .exec(function (err, users) 
            {
                if (err) 
                {
                    res.status(404).send({});
                } 
                else 
                {
                    for (let i in users) 
                    {
                        delete users[i].password;
                    }
                    res.json(users);
                }
            });
    });

    this.app.post("/Users", [validation.validJWTNeeded, validation.requiredRole('admin')], (req, res, next) =>
    {
        let salt = crypto.randomBytes(16).toString('base64');
        let hash = crypto.createHmac('sha512',salt)
                                    .update(req.body.password)
                                    .digest("base64");
        req.body.password = salt + "$" + hash;

        let user = new User(req.body);

        user.save()
       .then((result) => 
       {
           res.status(201).send({id: result._id});
       });
    });

    this.app.post("/Users/Login", (req, res, next) =>
    {
        User.find({name: req.body.name})
        .then(user=>
        {
            if (!user[0])
            {
                res.status(404).send({});
            }
            else
            {
                let passwordFields = user[0].password.split('$');
                let salt = passwordFields[0];
                let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");

                if (hash === passwordFields[1]) 
                {
                    userAuthResponse = 
                    {
                        userId: user[0]._id,
                        email: user[0].email,
                        role: user[0].role,
                        provider: 'name',
                        name: user[0].name,
                        stamp: new Date().setDate(new Date().getDate() + 1)
                    };

                    let refreshId = userAuthResponse.userId + this.jwtSecret;
                    let salt = crypto.randomBytes(16).toString('base64');
                    let hash = crypto.createHmac('sha512', salt).update(refreshId).digest("base64");

                    userAuthResponse.refreshKey = salt;
                    
                    let token = jwt.sign(userAuthResponse, this.jwtSecret);
                    let b = new Buffer(hash);
                    let refresh_token = b.toString('base64');

                    userAuthResponse.accessToken = token;
                    userAuthResponse.refreshToken = refresh_token;

                    res.status(201).send(userAuthResponse);
                } 
                else 
                {
                    return res.status(400).send({errors: ['Invalid name or password']});
                }
            }
        });
    });

    this.app.get("/Users/:id", [validation.validJWTNeeded, validation.requiredRole('public')], (req, res, next) =>
    {
        User.findById(req.params.id).then((result) => 
        {
            delete result.password;
            delete result.__v;

            res.json(result);
        });
    });

    this.app.put("/Users/:id", [validation.validJWTNeeded, validation.requiredRole('public')], (req, res, next) =>
    {
        if (req.body.password)
        {
            let salt = crypto.randomBytes(16).toString('base64');
            let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
            req.body.password = salt + "$" + hash;
        }

        // if a public user, they can only edit their own account
        // add a check to the jwt token
        User.findById(req.params.id, function (err, user) 
        {
            for (let i in req.body) 
            {
                user[i] = userData[i];
            }

            user.save(function (err, updatedUser) 
            {
                res.status(204).send({});
            });
        });
    });

    this.app.delete("/Users/:id", [validation.validJWTNeeded, validation.requiredRole('admin')], (req, res, next) =>
    {
        User.remove({ _id: req.params.id })
        .then((result)=>
        {
            res.status(204).send({});
        });
    });
}

UsersController.prototype.links = function()
{
    let links = 
    [
        { rel: 'fetch', title: 'Find Users', method: 'GET', href: '/Users' },
        { rel: 'create', title: 'Create User', method: 'POST', href: '/Users' }
    ];

    return links;
}

module.exports = UsersController;