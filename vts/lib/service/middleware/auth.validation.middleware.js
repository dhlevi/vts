const jwt       = require('jsonwebtoken');

let secret = 'vtsSecret' // obviously you want to move the secret elsewhere...
exports.validJWTNeeded = (req, res, next) => 
{
    if (req.headers['authorization']) 
    {
        try 
        {
            let authorization = req.headers['authorization'].split(' ');
        
            if (authorization[0] !== 'Bearer') 
            {
                return res.status(401).send();
            } 
            else 
            {
                req.jwt = jwt.verify(authorization[1], secret);
                return next();
            }
        } 
        catch (err) 
        {
            return res.status(403).send();
        }
    } 
    else 
    {
        return res.status(401).send();
    }
};

exports.minimumPermissionLevelRequired = (role) => 
{
    return (req, res, next) => 
    {
        let user_permission_level = req.jwt.role;
        let user_id = req.jwt.iat;
        if (user_permission_level === role || user_permission_level === 'admin') {
            return next();
        } else {
            return res.status(403).send();
        }
    };
 };