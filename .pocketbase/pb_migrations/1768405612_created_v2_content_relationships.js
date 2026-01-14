/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_151342032",
        "hidden": false,
        "id": "relation4274335913",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "content",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_151342032",
        "hidden": false,
        "id": "relation3252484620",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "related_content",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select656931760",
        "maxSelect": 0,
        "name": "relationship_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "validates",
          "hardens",
          "complements"
        ]
      }
    ],
    "id": "pbc_2138729323",
    "indexes": [
      "CREATE INDEX idx_v2_content_relationships_content ON v2_content_relationships (content)",
      "CREATE INDEX idx_v2_content_relationships_related_content ON v2_content_relationships (related_content)",
      "CREATE INDEX idx_v2_content_relationships_relationship_type ON v2_content_relationships (relationship_type)"
    ],
    "listRule": null,
    "name": "v2_content_relationships",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2138729323");

  return app.delete(collection);
})
