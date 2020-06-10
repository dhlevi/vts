# Vivid Topology Service (VTS)

The Vivid Topology Service is an application that allows for ETL and transformation of spatial data from a number of source formats. For instance, you can open a shapefile from a local path or on the web, buffer all features contained, add a calculated Area attribute, and write it to a KML file. Or perhaps something more 
useful! Requests can be ad hoc or scheduled to run at repeating intervals.

The application dashboard:
![Dashboard screen](/docs/dashboard.jpg)

## What is it?

VTS is a web application, a small rest service, and 1+ "engine" services, backed by a MongoDB instance. Requests, scheduled tasks, and projects can be created via the main web application. These are then pulled for processing by the Engine service (you can run multiple engines) which does the processing.

### Engines?

Engines are where VTS does the work within a request. You can run multiple engines, and specify if an engine can handle scheduled tasks, ad hoc requests (or both). You can edit the external route for an engine (it needs to be valid or the engine won't function), and view messages and metadata log events.

![Engines screen](/docs/engines.jpg)

From the Engines UI, you can also temporarily halt an engine or flush the processing queue to clear up memory.

## What can VTS do?

In the current prototype implementation, we can Read GeoJSON, KML, KMZ, GML, Shapefile, and FGDB from a path or via the web, and write to the same formats (minus FGDB, which is in progress). Other file formats are planned. Database formats are coming soon (Oracle, postgis, mongodb, couchdb and others).

Data itself can be transformed by various processors, such as buffers, convex/concave hulls, clipping, dissolving, filters, calculations, etc.

To create the requests, the web application includes a "request designer" where you can drop processors and wire them together, but you can always create requests in JSON and submit them manually.

![Engines screen](/docs/designer.jpg)

While your process is running, you can view the request status and see various messages from the engine (errors or just information).

![Requets screen](/docs/requests.jpg)

Additionally, either during or after processing, you can view the process results in a map.

![Map screen](/docs/mapview.jpg)

## Planned processors

Currently there are 51 processors (including readers and writers). Documentation for each one is in progress!

## Technologies Used

- [NodeJS](https://nodejs.org/en/)
- [Express](https://expressjs.com/)
- [Vue](https://vuejs.org/)
- [Turf](https://turfjs.org/)
- [JSTS](http://bjornharrtell.github.io/jsts/")
- [ESRI JS API](https://developers.arcgis.com/javascript/)
- [Materialize CSS](https://materializecss.com/)
- [JSPlumb](http://jsplumb.github.io/jsplumb/home.html)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Docker](https://www.docker.com/)

## Is it Production Ready?

No! This version is a prototype. There are bugs, some features are not implemented or are only partially working.

## Additional planned features

Too many to list if this goes beyond the prototype stage.

## How do I run it?

### Docker

Go to the "docker" folder in vts. There are 3 folders in "docker" containing dockerfiles and scripts for MongoDB, VTS, and VTS Engine.

Build with:

- docker build . -t mongodb
- docker build . -t vts
- docker build . -t vts-engine

Run your MongoDB image:

- docker run --name vts_mongo -p 27017:27017 mongodb:latest mongod

Get your MongoDB address, so you can configure it with vts/engine:

- docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' vts_mongo

Run VTS and one or more engine:

- docker run --name vts_server -p 9988:9988 -e PORT=9988 -e MONGO_CONNECTION="mongodb://admin:password@<mongo-container-ip>:27017/vts?authSource=admin" vts:latest
- docker run --name vts_engine -p 8899:8899 -e PORT=8899 -e ID=SuperEngine -e ROUTE=http://localhost:8899 -e MONGO_CONNECTION="mongodb://admin:password@<mongo-container-ip>:27017/vts?authSource=admin" vts-engine:latest

Configure ports and engine ID's as needed!

### Manually

Fork the code. If you don't have a MongoDB instance (or even if you do) use the provided dockerfile for setting up your MongoDB.

Once MongoDB is up and running, you can launch the VTS service going to the VTS folder:

- npm install
- node index.js -port 9999 -mongo_connection mongodb://localhost/vts

And for the engine, navigate to the vts-engine folder and follow the same process.

- npm install
- node index.js -port 8888 -id "My Engine" -route "http://localhost:8888" -logpath "./logs/" -mongo_connection mongodb://localhost/vts

Note that the "id" param is required. This is how VTS can identify the engine. It also must be unique. The "route" is the URL that VTS can use to communicate with your engine. You can configure this in the VTS admin application or pre-set it from the command line.

![Vivid Logo](/docs/vivid_logo.jpg)