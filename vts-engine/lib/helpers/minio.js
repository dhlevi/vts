const minioLib = require('minio');
const path     = require('path');

let minioClient;
// = new minioLib.Client(
//{
//    endPoint: 'localhost',
//    port: 9000,
//    useSSL: false,
//    accessKey: 'minioadmin',
//    secretKey: 'minioadmin'
//});

module.exports.configMinio = function(endpoint, port, ssl, accessKey, secretKey)
{
    minioClient = new minioLib.Client(
    {
        endPoint: endpoint,
        port: port,
        useSSL: ssl,
        accessKey: accessKey,
        secretKey: secretKey
    });
};

module.exports.fetchDocument = function(bucket, objectId, fileName)
{

};

module.exports.storeDocument = function(bucket, objectId, fileName, extension, pathOnDisk)
{
    return minioClient.bucketExists(bucket)
    .then(exists => 
    {
        if (!exists) 
        {
          return minioClient.makeBucket(bucket);
        }
    })
    .then(() => 
    {
        let fileGuid = uuid() + (extension ? '.' + extension : '');
        var filePath = path.posix.join(objectId, fileGuid);
        // upload the file to minio
        return minioClient.fPutObject(bucket, filePath, pathOnDisk)
        .then(() =>
        {
            return {
                fullName: fileGuid,
                extension: extension,
                path: filePath
            };
        });
    });
};

module.exports.deleteDocument = function (bucket, objectId, fileName) 
{
    return minioClient.removeObject(bucket, objectId + '/' + fileName)
    .then(result =>
    {
        return result;
    });
};

module.exports.getDocumentUrl = function (bucket, objectId, filePath) 
{
    return minioClient.presignedGetObject(bucket, objectId + '/' + filePath, 5 * 60)
    .then(url =>
    {
        return url;
    });
};

module.exports.getStats = function (bucket, objectId, filePath)
{ 
    return minioClient.statObject(bucket, objectId + '/' + filePath)
    .then(stats =>
    {
        return stats;
    });
};

function uuid() 
{
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) 
	{
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}