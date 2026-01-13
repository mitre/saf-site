#!/usr/bin/env python3
"""
Test Pocketbase FK relations and dropdown UX
Creates organizations and profiles with a relation field
"""

from pocketbase import PocketBase

client = PocketBase('http://127.0.0.1:8090')
admin = client.admins.auth_with_password('admin@localhost.com', 'test1234567')
print("✓ Authenticated\n")

# Step 1: Create organizations collection
print("Creating organizations collection...")
try:
    org_collection = client.collections.create({
        "name": "organizations",
        "type": "base",
        "schema": [
            {
                "name": "name",
                "type": "text",
                "required": True
            },
            {
                "name": "description",
                "type": "text",
                "required": False
            }
        ]
    })
    org_id = org_collection.id
    print(f"  ✓ Created (ID: {org_id})\n")
except Exception as e:
    print(f"  ❌ Error: {e}\n")
    # If already exists, get it
    org_collection = client.collections.get_first_list_item('name="organizations"')
    org_id = org_collection.id
    print(f"  → Using existing (ID: {org_id})\n")

# Step 2: Create profiles collection with relation to organizations
print("Creating profiles collection with organization relation...")
try:
    profiles_collection = client.collections.create({
        "name": "profiles",
        "type": "base",
        "schema": [
            {
                "name": "name",
                "type": "text",
                "required": True
            },
            {
                "name": "organization",
                "type": "relation",
                "required": False,
                "options": {
                    "collectionId": org_id,
                    "cascadeDelete": False,
                    "maxSelect": 1,
                    "displayFields": ["name"]
                }
            }
        ]
    })
    print(f"  ✓ Created with relation to organizations\n")
except Exception as e:
    print(f"  ❌ Error: {e}\n")
    exit(1)

# Step 3: Create test data - organizations
print("Creating test organizations...")
orgs = [
    {"name": "MITRE SAF", "description": "Security Automation Framework"},
    {"name": "DISA", "description": "Defense Information Systems Agency"},
    {"name": "CIS", "description": "Center for Internet Security"}
]

for org_data in orgs:
    try:
        org = client.collection("organizations").create(org_data)
        print(f"  ✓ Created: {org_data['name']}")
    except Exception as e:
        print(f"  ⚠️  {org_data['name']}: {e}")

# Step 4: Create a test profile
print("\nCreating test profile...")
try:
    # Get first organization ID
    first_org = client.collection("organizations").get_list(1, 1).items[0]

    profile = client.collection("profiles").create({
        "name": "RHEL 8 STIG",
        "organization": first_org.id
    })
    print(f"  ✓ Created profile linked to {first_org.name}")
except Exception as e:
    print(f"  ❌ Error: {e}")

print("\n" + "="*60)
print("✅ Test setup complete!")
print("="*60)
print("\nNow go to http://localhost:8090/_/ and:")
print("1. Open the 'profiles' collection")
print("2. Click 'New record'")
print("3. Check the 'organization' field - is it a nice dropdown?")
print("4. Does it show organization names or just IDs?")
print("5. Can you search/filter the dropdown?")
print("\nThis tells us if Pocketbase UX is good for FK editing.")
