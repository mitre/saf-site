#!/usr/bin/env python3
from pocketbase import PocketBase

client = PocketBase('http://127.0.0.1:8090')
admin = client.admins.auth_with_password('admin@localhost.com', 'test1234567')

print("Adding organizations with data...")

# Try different approaches
orgs_data = [
    {"name": "MITRE SAF", "description": "Security Automation Framework"},
    {"name": "DISA", "description": "Defense Information Systems Agency"},
    {"name": "CIS", "description": "Center for Internet Security"}
]

for org_data in orgs_data:
    print(f"\nTrying to create: {org_data['name']}")
    try:
        result = client.collection("organizations").create(org_data)
        print(f"  Created ID: {result.id}")
        print(f"  Result: {result}")
    except Exception as e:
        print(f"  Error: {e}")

print("\n\nChecking what was created...")
orgs = client.collection("organizations").get_full_list()
for org in orgs:
    print(f"  ID: {org.id}")
    print(f"  Data: {org.__dict__}")
    print()
