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
        "collectionId": "pbc_1049554947",
        "hidden": false,
        "id": "relation59357059",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "tag",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      }
    ],
    "id": "pbc_2691988048",
    "indexes": [
      "CREATE INDEX idx_v2_media_tags_media ON v2_media_tags (media)",
      "CREATE INDEX idx_v2_media_tags_tag ON v2_media_tags (tag)"
    ],
    "listRule": null,
    "name": "v2_media_tags",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2691988048");

  return app.delete(collection);
})
