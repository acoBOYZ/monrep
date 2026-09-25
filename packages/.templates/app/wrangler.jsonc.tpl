{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "monrep-{{name}}",
  "compatibility_date": "2026-09-04",
  "workers_dev": false,
  "preview_urls": false,
  "main": "./src/server/worker.ts",
  "durable_objects": {
    "bindings": [
      {
        "name": "STREAMS",
        "class_name": "StreamObject"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": [
        "StreamObject"
      ]
    }
  ],
  "previews": {
    "cache": {
      "enabled": true
    }
  },
  "dev": {
    "inspector_port": 9330,
    "local_protocol": "https"
  },
  "vars": {
    "ADMIN_EMAIL": "admin@{{name}}.local"
  }
}
