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
        "collectionId": "pbc_561596207",
        "hidden": false,
        "id": "relation1781309708",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "media",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_2677369316",
        "hidden": false,
        "id": "relation2528240176",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "capability",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      }
    ],
    "id": "pbc_2992999283",
    "indexes": [
      "CREATE INDEX idx_v2_media_capabilities_media ON v2_media_capabilities (media)",
      "CREATE INDEX idx_v2_media_capabilities_capability ON v2_media_capabilities (capability)"
    ],
    "listRule": null,
    "name": "v2_media_capabilities",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2992999283");

  return app.delete(collection);
})
