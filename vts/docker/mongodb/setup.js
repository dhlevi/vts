let res = [
  db.createCollection("engines"),
  db.createCollection("requests"),
  db.createCollection("cache"),
  db.createCollection("users"),
  db.requests.createIndex({ status: "text", name: "text", engine: "text", "processors.name": "text"}),
  db.requests.createIndex({ name: 1 }, { unique: true } ),
  db.engines.createIndex({ id: 1 }, { unique: true } ),
  db.cache.createIndex({ request: "text", processor: "text" }),
  db.cache.createIndex({ "feature.geometry": "2dsphere" }),
  db.users.createIndex({ name: 1 }, { unique: true } ),
  db.users.createIndex({ name: "text", email: "text" }),
  db.users.insert({ name: "admin", password: "password", email: "mail@place.x", role: "admin" })
]

printjson(res)