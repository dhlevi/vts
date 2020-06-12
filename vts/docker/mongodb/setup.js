let res = [
  db.createCollection("engines"),
  db.createCollection("requests"),
  db.createCollection("cache"),
  db.requests.createIndex({ status: "text", name: "text", engine: "text", "processors.name": "text"}),
  db.requests.createIndex({ name: 1 }, { unique: true } ),
  db.engines.createIndex({ id: 1 }, { unique: true } ),
  db.cache.createIndex({ request: "text", processor: "text" }),
  db.cache.createIndex({ "feature.geometry": "2dsphere" })
]

printjson(res)