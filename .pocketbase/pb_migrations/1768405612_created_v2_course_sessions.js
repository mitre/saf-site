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
        "id": "text724990059",
        "max": 0,
        "min": 0,
        "name": "title",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
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
        "hidden": false,
        "id": "date2502384312",
        "max": "",
        "min": "",
        "name": "start_date",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date2220669758",
        "max": "",
        "min": "",
        "name": "end_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text922858135",
        "max": 0,
        "min": 0,
        "name": "timezone",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select215671401",
        "maxSelect": 0,
        "name": "location_type",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "virtual",
          "in_person",
          "hybrid"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1587448267",
        "max": 0,
        "min": 0,
        "name": "location",
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
        "id": "url1719447919",
        "name": "meeting_url",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "url"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text838616029",
        "max": 0,
        "min": 0,
        "name": "instructor",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number3613576509",
        "max": null,
        "min": null,
        "name": "max_attendees",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "exceptDomains": null,
        "hidden": false,
        "id": "url2576888202",
        "name": "recording_url",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "url"
      },
      {
        "hidden": false,
        "id": "select2063623452",
        "maxSelect": 0,
        "name": "status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "scheduled",
          "in_progress",
          "completed",
          "cancelled"
        ]
      }
    ],
    "id": "pbc_2237164758",
    "indexes": [
      "CREATE INDEX idx_v2_course_sessions_course ON v2_course_sessions (course)",
      "CREATE INDEX idx_v2_course_sessions_start_date ON v2_course_sessions (start_date)",
      "CREATE INDEX idx_v2_course_sessions_status ON v2_course_sessions (status)",
      "CREATE INDEX idx_v2_course_sessions_location_type ON v2_course_sessions (location_type)"
    ],
    "listRule": null,
    "name": "v2_course_sessions",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2237164758");

  return app.delete(collection);
})
