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
        "collectionId": "pbc_1583685941",
        "hidden": false,
        "id": "relation379482041",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "course",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_2712614996",
        "hidden": false,
        "id": "relation552812241",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "tool",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      }
    ],
    "id": "pbc_2181012870",
    "indexes": [
      "CREATE INDEX idx_v2_course_tools_course ON v2_course_tools (course)",
      "CREATE INDEX idx_v2_course_tools_tool ON v2_course_tools (tool)"
    ],
    "listRule": null,
    "name": "v2_course_tools",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2181012870");

  return app.delete(collection);
})
