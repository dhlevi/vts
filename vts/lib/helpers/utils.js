module.exports.getHttpRequest = function(url) {
    return new Promise(function(resolve, reject) {
        let http = url.toLowerCase().includes('https:') ? require('https') : require('http');
        let req = http.get(url, function(res) {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            let body = [];
            res.on('data', function(chunk) {
                body.push(chunk);
            });
            res.on('end', function() {
                try {
                    body = Buffer.concat(body).toString();
                } catch(e) {
                    reject(e);
                }
                resolve(body);
            });
        });
  
        req.on('error', function(err) {
            reject(err);
        });
  
        req.end();
    });
  }