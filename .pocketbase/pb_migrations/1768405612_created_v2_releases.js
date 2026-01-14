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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2560465762",
        "max": 0,
        "min": 0,
        "name": "slug",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select3289574914",
        "maxSelect": 0,
        "name": "entity_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "content",
          "tool",
          "distribution"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2166717789",
        "max": 0,
        "min": 0,
        "name": "entity_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3206337475",
        "max": 0,
        "min": 0,
        "name": "version",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date3882452845",
        "max": "",
        "min": "",
        "name": "release_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2189808891",
        "max": 0,
        "min": 0,
        "name": "release_notes",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "exceptDomains": null,
        "hidden": false,
        "id": "url3730845939",
        "name": "download_url",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "url"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1556616439",
        "max": 0,
        "min": 0,
        "name": "sha256",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "bool3285458096",
        "name": "is_latest",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      }
    ],
    "id": "pbc_1371073842",
    "indexes": [
      "CREATE UNIQUE INDEX idx_v2_releases_slug ON v2_releases (slug)",
      "CREATE INDEX idx_v2_releases_entity_type ON v2_releases (entity_type)",
      "CREATE INDEX idx_v2_releases_entity_id ON v2_releases (entity_id)",
      "CREATE INDEX idx_v2_releases_is_latest ON v2_releases (is_latest)",
      "CREATE INDEX idx_v2_releases_entity_type_entity_id_is_latest ON v2_releases (entity_type, entity_id, is_latest)"
    ],
    "listRule": null,
    "name": "v2_releases",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1371073842");

  return app.delete(collection);
})
