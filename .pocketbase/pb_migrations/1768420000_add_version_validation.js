/// <reference path="../pb_data/types.d.ts" />
// Migration: Add regex validation to version fields to prevent "v" prefix
// Version should be stored as "1.0.0" not "v1.0.0" - frontend adds the "v" for display

migrate((app) => {
    // Update v2_content collection - add pattern validation to version field
    const v2Content = app.findCollectionByNameOrId("v2_content")
    if (v2Content) {
        const versionField = v2Content.fields.find(f => f.name === "version")
        if (versionField) {
            // Pattern: must start with a digit, not "v"
            // Allows: 1.0.0, 2.3.1, 10.0.0-beta
            // Rejects: v1.0.0, V1.0.0
            versionField.pattern = "^[0-9].*$"
            app.save(v2Content)
        }
    }

    // Update profiles collection (v1) - same validation
    const profiles = app.findCollectionByNameOrId("profiles")
    if (profiles) {
        const versionField = profiles.fields.find(f => f.name === "version")
        if (versionField) {
            versionField.pattern = "^[0-9].*$"
            app.save(profiles)
        }
    }

    // Update v2_tools collection
    const v2Tools = app.findCollectionByNameOrId("v2_tools")
    if (v2Tools) {
        const versionField = v2Tools.fields.find(f => f.name === "version")
        if (versionField) {
            versionField.pattern = "^[0-9].*$"
            app.save(v2Tools)
        }
    }

    // Update v2_distributions collection
    const v2Distributions = app.findCollectionByNameOrId("v2_distributions")
    if (v2Distributions) {
        const versionField = v2Distributions.fields.find(f => f.name === "version")
        if (versionField) {
            versionField.pattern = "^[0-9].*$"
            app.save(v2Distributions)
        }
    }
}, (app) => {
    // Revert: remove pattern validation
    const v2Content = app.findCollectionByNameOrId("v2_content")
    if (v2Content) {
        const versionField = v2Content.fields.find(f => f.name === "version")
        if (versionField) {
            versionField.pattern = ""
            app.save(v2Content)
        }
    }

    const profiles = app.findCollectionByNameOrId("profiles")
    if (profiles) {
        const versionField = profiles.fields.find(f => f.name === "version")
        if (versionField) {
            versionField.pattern = ""
            app.save(profiles)
        }
    }

    const v2Tools = app.findCollectionByNameOrId("v2_tools")
    if (v2Tools) {
        const versionField = v2Tools.fields.find(f => f.name === "version")
        if (versionField) {
            versionField.pattern = ""
            app.save(v2Tools)
        }
    }

    const v2Distributions = app.findCollectionByNameOrId("v2_distributions")
    if (v2Distributions) {
        const versionField = v2Distributions.fields.find(f => f.name === "version")
        if (versionField) {
            versionField.pattern = ""
            app.save(v2Distributions)
        }
    }
})
