# Installation

- [Docker](#docker)
- [Manually](#manually)
  * [MongoDB](#mongodb)
    + [Collections](#collections)
    + [Indexes](#indexes)
    + [Default admin user](#default-admin-user)
  * [NodeJS](#nodejs)
  * [Running VTS/Engines](#running-vts-engines)

## Docker

Go to the "docker" folder in vts. There are 3 folders in "docker" containing dockerfiles and scripts for MongoDB, VTS, and VTS Engine.

Build with:

```bash
docker build . -t mongodb
docker build . -t vts
docker build . -t vts-engine
```

Run your MongoDB image:

```bash
docker run --name vts_mongo -p 27017:27017 mongodb:latest mongod
```

A default "Admin" user will be created for VTS: admin/password. You can change the admin user name/password at any time from the admin page.

Get your MongoDB address, so you can configure it with vts/engine:

```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' vts_mongo
```

Run VTS and one or more engine:

```bash
docker run --name vts_server -p 9988:9988 -e PORT=9988 -e MONGO_CONNECTION="mongodb://admin:password@<mongo-container-ip>:27017/vts?authSource=admin" vts:latest

docker run --name vts_engine -p 8899:8899 -e PORT=8899 -e ID=SuperEngine -e ROUTE=http://localhost:8899 -e MONGO_CONNECTION="mongodb://admin:password@<mongo-container-ip>:27017/vts?authSource=admin" vts-engine:latest
```

Configure ports and engine ID's as needed!

## Manually

Clone the code. If you don't have a MongoDB instance (or even if you do) use the provided dockerfile for setting up your MongoDB. Check the setup.js file in ./docker/mongodb for the collection and index settings.

Note: The mongodb setup.js script will create A default "Admin" user for VTS: admin/password. You can change the admin user name/password at any time from the admin page. If you do not use the setup script, make sure to create an admin user manually in mongodb or you won't be able to log in!

### MongoDB

Install MongoDB. Once installed (or if you already have it installed) you'll need to build the VTS collections and set up a default admin user. View the setup.js script, or run the following:

#### Collections

```bash
db.createCollection("engines")
db.createCollection("requests")
db.createCollection("cache")
db.createCollection("users")
```

#### Indexes

```bash
db.requests.createIndex({ status: "text", name: "text", engine: "text", "processors.name": "text"})
db.requests.createIndex({ name: 1 }, { unique: true } )
db.engines.createIndex({ id: 1 }, { unique: true } )
db.cache.createIndex({ request: "text", processor: "text" })
db.cache.createIndex({ "feature.geometry": "2dsphere" })
db.users.createIndex({ name: 1 }, { unique: true } )
db.users.createIndex({ name: "text", email: "text" })
```

#### Default admin user

```bash
db.users.insert({ name: "admin", password: "q4B7V2Xc2vOTnQE3i0Y1ag==$yJMUjNBpPgMUTHyJ8dQ0noPJPUthO7yrAP9c1uCme7SN4zoYg2UCmBFcDjaiqKmU+e7U8uRPgMFIlyFWryPstA==", email: "mail@place.x", role: "admin" })
```

Note, the DB user password is "password". Use the hash or you won't be able to log in!

### NodeJS

Install NodeJS 12.x or greater. See NodeJS installation information for details

### Running VTS/Engines

Once MongoDB and Node are up and running, you can launch the VTS service going to the VTS folder:

```bash
npm install
node index.js -port 9999 -mongo_connection mongodb://localhost/vts
```

And for the engine, navigate to the vts-engine folder and follow the same process.

```bash
npm install
node index.js -port 8888 -id "My Engine" -route "http://localhost:8888" -logpath "./logs/" -mongo_connection mongodb://localhost/vts
```

Note that the "id" param is required. This is how VTS can identify the engine. It also must be unique. The "route" is the URL that VTS can use to communicate with your engine. You can configure this in the VTS admin application or pre-set it from the command line.