#!/usr/bin/env python3
"""Fix the TypeScript collection creation script"""
import re

# Read the script
with open('scripts/create-all-collections.ts', 'r') as f:
    content = f.read()

# Replace schema: with fields:
content = content.replace('schema: [', 'fields: [')

# Fix relation fields - remove options: { and corresponding }
# Pattern: name: 'fieldname', type: 'relation', ... options: { ... }
# Replace with: name: 'fieldname', type: 'relation', ... (direct properties)

# Pattern for relation with options
pattern = r"(\{\s*name:\s*'[^']+',\s*type:\s*'relation',\s*required:\s*\w+,\s*)options:\s*\{([^}]+)\}"

def fix_relation(match):
    prefix = match.group(1)
    options_content = match.group(2)
    # Remove extra indentation from options content
    options_lines = [line.strip() for line in options_content.strip().split('\n')]
    fixed_options = '\n        '.join(options_lines)
    return prefix + fixed_options

content = re.sub(pattern, fix_relation, content, flags=re.MULTILINE | re.DOTALL)

# Write fixed content
with open('scripts/create-all-collections.ts', 'w') as f:
    f.write(content)

print("✓ Fixed script:")
print("  - Replaced 'schema:' with 'fields:'")
print("  - Removed nested 'options:' from relation fields")
