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
        "id": "text1579384326",
        "max": 0,
        "min": 0,
        "name": "name",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1843675174",
        "max": 0,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text405053820",
        "max": 0,
        "min": 0,
        "name": "long_description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
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
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select1102887660",
        "maxSelect": 0,
        "name": "content_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "validation",
          "hardening"
        ]
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
          "active",
          "beta",
          "deprecated",
          "draft"
        ]
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1485006186",
        "hidden": false,
        "id": "relation1181691900",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "target",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1374204820",
        "hidden": false,
        "id": "relation284678023",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "standard",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3462774529",
        "hidden": false,
        "id": "relation4100149837",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "technology",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_647305979",
        "hidden": false,
        "id": "relation4112659446",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "vendor",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3717710971",
        "hidden": false,
        "id": "relation245448194",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "maintainer",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "exceptDomains": null,
        "hidden": false,
        "id": "url1669114857",
        "name": "github",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "url"
      },
      {
        "exceptDomains": null,
        "hidden": false,
        "id": "url2111657159",
        "name": "documentation_url",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "url"
      },
      {
        "hidden": false,
        "id": "number1042345279",
        "max": null,
        "min": null,
        "name": "control_count",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2072812731",
        "max": 0,
        "min": 0,
        "name": "stig_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2205424551",
        "max": 0,
        "min": 0,
        "name": "benchmark_version",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select3483251409",
        "maxSelect": 0,
        "name": "automation_level",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "full",
          "partial",
          "manual"
        ]
      },
      {
        "hidden": false,
        "id": "bool2847551440",
        "name": "is_featured",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "number2891999234",
        "max": null,
        "min": null,
        "name": "featured_order",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1466496025",
        "max": 0,
        "min": 0,
        "name": "license",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
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
        "hidden": false,
        "id": "date558604054",
        "max": "",
        "min": "",
        "name": "deprecated_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      }
    ],
    "id": "pbc_151342032",
    "indexes": [
      "CREATE UNIQUE INDEX idx_v2_content_slug ON v2_content (slug)",
      "CREATE INDEX idx_v2_content_content_type ON v2_content (content_type)",
      "CREATE INDEX idx_v2_content_status ON v2_content (status)",
      "CREATE INDEX idx_v2_content_target ON v2_content (target)",
      "CREATE INDEX idx_v2_content_standard ON v2_content (standard)",
      "CREATE INDEX idx_v2_content_technology ON v2_content (technology)",
      "CREATE INDEX idx_v2_content_vendor ON v2_content (vendor)",
      "CREATE INDEX idx_v2_content_maintainer ON v2_content (maintainer)",
      "CREATE INDEX idx_v2_content_is_featured ON v2_content (is_featured)"
    ],
    "listRule": null,
    "name": "v2_content",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_151342032");

  return app.delete(collection);
})
