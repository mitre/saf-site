#!/usr/bin/env python3
"""
Create Pocketbase collections from our Drizzle schema
Run: python3 scripts/create-pocketbase-schema.py
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8090"
ADMIN_EMAIL = "admin@localhost.com"
ADMIN_PASSWORD = "test1234567"

# Authenticate (admin auth endpoint)
auth_response = requests.post(
    f"{BASE_URL}/api/admins/auth-via-email",
    json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
)
auth_response.raise_for_status()
token = auth_response.json()["token"]

headers = {"Authorization": token}

print("✓ Authenticated\n")
print("Creating collections...\n")

# Define all collections
collections = [
    {
        "name": "tags",
        "type": "base",
        "fields": [
            {"name": "description", "type": "text", "required": False},
            {"name": "category", "type": "text", "required": False},
            {"name": "status", "type": "text", "required": True, "max": 50}
        ]
    },
    {
        "name": "organizations",
        "type": "base",
        "fields": [
            {"name": "name", "type": "text", "required": True},
            {"name": "description", "type": "text", "required": False},
            {"name": "website", "type": "url", "required": False},
            {"name": "logo", "type": "text", "required": False},
            {"name": "status", "type": "text", "required": True, "max": 50}
        ]
    },
    {
        "name": "teams",
        "type": "base",
        "fields": [
            {"name": "name", "type": "text", "required": True},
            {"name": "description", "type": "text", "required": False},
            {"name": "status", "type": "text", "required": True, "max": 50}
        ]
    },
    {
        "name": "technologies",
        "type": "base",
        "fields": [
            {"name": "name", "type": "text", "required": True},
            {"name": "description", "type": "text", "required": False},
            {"name": "website", "type": "url", "required": False},
            {"name": "logo", "type": "text", "required": False},
            {"name": "category", "type": "text", "required": False},
            {"name": "type", "type": "text", "required": False},
            {"name": "status", "type": "text", "required": True, "max": 50}
        ]
    },
    {
        "name": "standards",
        "type": "base",
        "fields": [
            {"name": "name", "type": "text", "required": True},
            {"name": "description", "type": "text", "required": False},
            {"name": "website", "type": "url", "required": False},
            {"name": "type", "type": "text", "required": False},
            {"name": "category", "type": "text", "required": False},
            {"name": "vendor", "type": "text", "required": False},
            {"name": "version", "type": "text", "required": False},
            {"name": "logo", "type": "text", "required": False},
            {"name": "status", "type": "text", "required": True, "max": 50}
        ]
    },
    {
        "name": "profiles",
        "type": "base",
        "fields": [
            {"name": "name", "type": "text", "required": True},
            {"name": "version", "type": "text", "required": False},
            {"name": "platform", "type": "text", "required": False},
            {"name": "framework", "type": "text", "required": False},
            {"name": "vendor", "type": "text", "required": False},
            {"name": "github", "type": "url", "required": False},
            {"name": "details", "type": "text", "required": False},
            {"name": "standard_version", "type": "text", "required": False},
            {"name": "short_description", "type": "text", "required": False},
            {"name": "requirements", "type": "text", "required": False},
            {"name": "category", "type": "text", "required": False},
            {"name": "status", "type": "text", "required": True, "max": 50}
        ]
    },
    {
        "name": "hardening_profiles",
        "type": "base",
        "fields": [
            {"name": "name", "type": "text", "required": True},
            {"name": "version", "type": "text", "required": False},
            {"name": "platform", "type": "text", "required": False},
            {"name": "type", "type": "text", "required": False},
            {"name": "vendor", "type": "text", "required": False},
            {"name": "github", "type": "url", "required": False},
            {"name": "details", "type": "text", "required": False},
            {"name": "standard_version", "type": "text", "required": False},
            {"name": "short_description", "type": "text", "required": False},
            {"name": "requirements", "type": "text", "required": False},
            {"name": "category", "type": "text", "required": False},
            {"name": "difficulty", "type": "text", "required": False},
            {"name": "status", "type": "text", "required": True, "max": 50}
        ]
    },
    {
        "name": "tools",
        "type": "base",
        "fields": [
            {"name": "name", "type": "text", "required": True},
            {"name": "version", "type": "text", "required": False},
            {"name": "description", "type": "text", "required": False},
            {"name": "website", "type": "url", "required": False},
            {"name": "logo", "type": "text", "required": False},
            {"name": "github", "type": "url", "required": False},
            {"name": "category", "type": "text", "required": False},
            {"name": "status", "type": "text", "required": True, "max": 50}
        ]
    },
    {
        "name": "capabilities",
        "type": "base",
        "fields": [
            {"name": "name", "type": "text", "required": True},
            {"name": "description", "type": "text", "required": False},
            {"name": "category", "type": "text", "required": False},
            {"name": "status", "type": "text", "required": True, "max": 50}
        ]
    }
]

# Create each collection
for collection in collections:
    print(f"Creating {collection['name']}...")
    response = requests.post(
        f"{BASE_URL}/api/collections",
        headers=headers,
        json=collection
    )
    if response.status_code != 200:
        print(f"  ❌ Error: {response.text}")
    else:
        print(f"  ✓ {collection['name']} created")

print("\n✅ All collections created!")
print("\nRefresh your admin UI at http://localhost:8090/_/")
print("\nNote: Foreign key relations need to be added manually in the UI:")
print("  - teams.organization → organizations")
print("  - profiles.technology → technologies")
print("  - profiles.organization → organizations")
print("  - profiles.team → teams")
print("  - profiles.standard → standards")
print("  - hardening_profiles.technology → technologies")
print("  - hardening_profiles.organization → organizations")
print("  - hardening_profiles.team → teams")
print("  - hardening_profiles.standard → standards")
print("  - tools.technology → technologies")
print("  - tools.organization → organizations")
