#!/usr/bin/env python3
import requests

endpoints = [
    "/api/admins/auth-with-password",
    "/api/collections/_superusers/auth-with-password",
    "/api/_/auth-with-password"
]

for endpoint in endpoints:
    url = f"http://127.0.0.1:8090{endpoint}"
    print(f"Testing: {url}")
    try:
        response = requests.post(url, json={"identity": "admin@localhost.com", "password": "test1234567"})
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            print(f"  ✓ SUCCESS: {endpoint}")
            break
        else:
            print(f"  Response: {response.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")
    print()
