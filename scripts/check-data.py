#!/usr/bin/env python3
from pocketbase import PocketBase

client = PocketBase('http://127.0.0.1:8090')
admin = client.admins.auth_with_password('admin@localhost.com', 'test1234567')

print("Checking organizations...")
try:
    orgs = client.collection("organizations").get_full_list()
    print(f"  Found {len(orgs)} organizations:")
    for org in orgs:
        print(f"    - {org.id}: {org.name if hasattr(org, 'name') else 'NO NAME'}")
except Exception as e:
    print(f"  Error: {e}")

print("\nChecking profiles...")
try:
    profiles = client.collection("profiles").get_full_list()
    print(f"  Found {len(profiles)} profiles:")
    for profile in profiles:
        print(f"    - {profile.id}: {profile.name if hasattr(profile, 'name') else 'NO NAME'}")
except Exception as e:
    print(f"  Error: {e}")
