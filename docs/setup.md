# Setting up VTS

VTS consists of a master API and as many engine servers as you need. Most configuration for these are done through the VTS Engine management screen, but there are some configurations that are important when first starting up the servers themselves.

## VTS API/UI

When starting the VTS master API/UI, you have the following command line params:

 -port the VTS servers port number, defaults to 1337
 -email (the admin email address where warnings, etc are sent - not functional atm)
 -logpath (the path for logging, if you want it elsewhere then on the pod)
 -mongo_connection (defaults to mongodb://localhost/vts)

The Port and MongoDB Connection are required. VTS will not start without them conifigured.

## VTS Engines

When starting the VTS Engines, you have the following command line params:

 -id (the name of the VTS engine)
 -route (the desired URL for the main VTS api to use for communicating with the Engine. Can be null if you want no communication)
 -port (the VTS servers port number, defaults to 1338)
 -logpath (the path for logging, if you want it elsewhere then on the pod)
 -mongo_connection (defaults to mongodb://localhost/vts)

 ID, Port and MongoDB connection are required for the engine to start. The MongoDB connection must be the same MongoDB instance used for the VTS master. The ID is a unique identifier for the server, and is displayed to users so works best as a unique human readable name.

 Route is optional. The Route is the VTS accessible path to the engine API. If you do not provide a route at engine startup, the engine record will be created in the MongoDB, but it will be `Unregistered`, meaning while it can perform ad-hoc requests, there is no way to monitor performance or advanced tasks. To register, simply update the record via the VTS admin UI to include an accessible route URL.

 It is recommended to run VTS and VTS Engines in Node production mode.
 