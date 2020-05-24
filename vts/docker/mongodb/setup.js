let res = [
  db.createCollection('engines'),
  db.createCollection('requests'),
  db.requests.createIndex({ status: "text", name: "text", engine: "text", 'processors.name': "text"}),
  db.requests.createIndex({ name: 1 }, { unique: true } ),
  db.engines.createIndex({ id: 1 }, { unique: true } )
]

printjson(res)