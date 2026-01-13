#!/usr/bin/env python3
from pocketbase import PocketBase

client = PocketBase('http://127.0.0.1:8090')

# Auth as admin
admin = client.admins.auth_with_password('admin@localhost.com', 'test1234567')
print("✓ Authenticated\n")

collections = [
    {
        "name": "tags",
        "type": "base",
        "fields": [
            {"name": "description", "type": "text"},
            {"name": "category", "type": "text"},
            {"name": "status", "type": "text", "required": True}
        ]
    },
    {
        "name": "organizations",
        "type": "base",
        "fields": [
            {"name": "name", "type": "text", "required": True},
            {"name": "description", "type": "text"},
            {"name": "website", "type": "url"},
            {"name": "logo", "type": "text"},
            {"name": "status", "type": "text", "required": True}
        ]
    }
]

for coll in collections:
    print(f"Creating {coll['name']}...")
    try:
        result = client.collections.create(coll)
        print(f"  ✓ Created")
    except Exception as e:
        print(f"  ❌ Error: {e}")

print("\n✅ Done! Check http://localhost:8090/_/")
