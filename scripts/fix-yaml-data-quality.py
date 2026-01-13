#!/usr/bin/env python3
"""
Fix data quality issues in YAML files for SQLite import.

This script:
1. Normalizes IDs to lowercase-with-dashes format
2. Fixes FK reference mismatches
3. Reports missing required fields
4. Validates YAML structure

Usage:
  python scripts/fix-yaml-data-quality.py                    # Dry run (show what would change)
  python scripts/fix-yaml-data-quality.py --fix              # Apply fixes
  python scripts/fix-yaml-data-quality.py --verbose          # Show all details
  python scripts/fix-yaml-data-quality.py --fix --verbose    # Apply with details
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple
from datetime import datetime
import shutil
import yaml


class DataQualityFixer:
    # Explicit normalization mappings (self-documenting, handles special cases)
    STANDARD_ID_MAPPING = {
        'STIG': 'stig',
        'STIG-Ready': 'stig-ready',
        'SRG-Ready': 'stig-ready',  # Erroneous form (should be STIG-Ready)
        'CIS': 'cis',
        'PCI-DSS': 'pci-dss',
        'NIST 800-53': 'nist-800-53',
        'NIST-800-53': 'nist-800-53',
        'NIST CSF': 'nist-csf',
        'VENDOR-GUIDANCE': 'vendor-guidance',
        'Vendor Guidance': 'vendor-guidance',
        'AWS Best Practices': 'vendor-guidance',
        'Azure Best Practices': 'vendor-guidance',
        'GCP Best Practices': 'vendor-guidance',
        'Best Practices': 'vendor-guidance',
        'OTHER': 'other',
        'disa-stigs': 'stig',  # Old v4 ID format
        'CMMC': 'cmmc',
    }

    ORG_ID_MAPPING = {
        'MITRE': 'mitre',
        'DISA': 'disa',
        'CIS': 'cis',
        'VMware': 'vmware',
        'other': 'other',
    }

    def __init__(self, data_dir: str = './content/data', dry_run: bool = True, verbose: bool = False, validate_only: bool = False):
        self.data_dir = Path(data_dir)
        self.dry_run = dry_run
        self.verbose = verbose
        self.validate_only = validate_only
        self.issues_found = 0
        self.files_modified = 0

        # Track all valid IDs from each entity type
        self.valid_ids: Dict[str, Set[str]] = {
            'standards': set(),
            'technologies': set(),
            'organizations': set(),
            'teams': set(),
            'tags': set(),
            'capabilities': set()
        }

        # Track FK references that need fixing
        self.fk_issues: List[Tuple[str, str, str, str]] = []

        # Track data quality issues
        self.duplicate_ids: Dict[str, List[str]] = {}  # ID -> [files where it appears]
        self.missing_fields: List[Tuple[str, str, str]] = []  # (file, entity_id, missing_field)
        self.validation_errors: List[str] = []

    def normalize_id(self, id_str: str, id_type: str = 'generic') -> str:
        """Normalize ID using explicit mapping or algorithmic fallback."""
        if not id_str:
            return id_str

        # Check explicit mappings first
        if id_type == 'standard' and id_str in self.STANDARD_ID_MAPPING:
            return self.STANDARD_ID_MAPPING[id_str]
        elif id_type == 'organization' and id_str in self.ORG_ID_MAPPING:
            return self.ORG_ID_MAPPING[id_str]

        # Fallback: algorithmic normalization (lowercase-with-dashes)
        normalized = id_str.lower()
        normalized = re.sub(r'[\s_]+', '-', normalized)
        normalized = re.sub(r'-+', '-', normalized)
        normalized = normalized.strip('-')

        return normalized

    def scan_for_valid_ids(self):
        """First pass: collect all valid IDs from entity files and detect duplicates."""
        print("📊 Phase 1: Scanning for valid entity IDs and detecting duplicates...")
        print()

        # Track where each ID appears (for duplicate detection)
        id_locations: Dict[str, Dict[str, List[str]]] = {
            entity_type: {} for entity_type in self.valid_ids.keys()
        }

        for entity_type in self.valid_ids.keys():
            entity_dir = self.data_dir / entity_type
            if not entity_dir.exists():
                continue

            yaml_files = list(entity_dir.glob('*.yml')) + list(entity_dir.glob('*.yaml'))

            for filepath in yaml_files:
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = yaml.safe_load(f)

                    if not data or entity_type not in data:
                        continue

                    entities = data[entity_type]
                    if not isinstance(entities, list):
                        print(f"⚠️  {filepath.name}: '{entity_type}' should be a list, got {type(entities).__name__}")
                        self.validation_errors.append(f"{filepath.name}: '{entity_type}' should be a list")
                        continue

                    for entity in entities:
                        if 'id' in entity:
                            original_id = entity['id']
                            # Determine ID type from entity type (standards → standard, organizations → organization)
                            id_type = entity_type.rstrip('s') if entity_type.endswith('s') else entity_type
                            normalized_id = self.normalize_id(original_id, id_type)

                            # Track location for duplicate detection
                            if normalized_id not in id_locations[entity_type]:
                                id_locations[entity_type][normalized_id] = []
                            id_locations[entity_type][normalized_id].append(str(filepath.relative_to(self.data_dir)))

                            # Store both original and normalized
                            self.valid_ids[entity_type].add(original_id)
                            if normalized_id != original_id:
                                self.valid_ids[entity_type].add(normalized_id)

                except Exception as e:
                    print(f"❌ Error reading {filepath}: {e}")
                    self.validation_errors.append(f"Error reading {filepath.name}: {e}")

        # Detect duplicates
        for entity_type, id_map in id_locations.items():
            for entity_id, locations in id_map.items():
                if len(locations) > 1:
                    self.duplicate_ids[f"{entity_type}:{entity_id}"] = locations

        # Print summary
        for entity_type, ids in self.valid_ids.items():
            if ids:
                print(f"  ✓ {entity_type}: {len(ids)} IDs found")

        if self.duplicate_ids:
            print()
            print(f"  ⚠️  Found {len(self.duplicate_ids)} duplicate IDs!")

        print()

    def check_fk_reference(self, filepath: Path, entity_type: str, entity: dict,
                          fk_field: str, fk_table: str) -> bool:
        """Check if a FK reference is valid, track issues."""
        if fk_field not in entity:
            return True  # Missing is OK, we'll report separately

        fk_value = entity[fk_field]
        if not fk_value:
            return True

        # Check if reference exists (original or normalized form)
        if fk_value not in self.valid_ids[fk_table]:
            # Determine ID type from FK table (standards → standard, organizations → organization)
            id_type = fk_table.rstrip('s') if fk_table.endswith('s') else fk_table
            normalized = self.normalize_id(fk_value, id_type)
            if normalized in self.valid_ids[fk_table]:
                # Found with normalization
                self.fk_issues.append((
                    str(filepath.relative_to(self.data_dir)),
                    entity.get('id', 'unknown'),
                    fk_field,
                    f"{fk_value} → {normalized}"
                ))
                return False
            else:
                # Not found at all
                self.fk_issues.append((
                    str(filepath.relative_to(self.data_dir)),
                    entity.get('id', 'unknown'),
                    fk_field,
                    f"{fk_value} → NOT FOUND"
                ))
                return False

        return True

    def fix_yaml_file(self, filepath: Path, entity_type: str):
        """Fix data quality issues in a single YAML file."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                data = yaml.safe_load(content)

            if not data or entity_type not in data:
                return

            entities = data[entity_type]
            if not isinstance(entities, list):
                return

            modified = False
            issues_in_file = []

            for entity in entities:
                entity_id = entity.get('id', 'unknown')

                # Check and fix ID normalization
                if 'id' in entity:
                    original_id = entity['id']
                    # Determine ID type from entity type
                    id_type = entity_type.rstrip('s') if entity_type.endswith('s') else entity_type
                    normalized_id = self.normalize_id(original_id, id_type)
                    if original_id != normalized_id:
                        issues_in_file.append(f"  • ID: {original_id} → {normalized_id}")
                        if not self.dry_run and not self.validate_only:
                            entity['id'] = normalized_id
                        modified = True

                # Check FK references
                fk_checks = []
                if entity_type == 'profiles' or entity_type == 'hardeningProfiles':
                    fk_checks = [
                        ('standard', 'standards'),
                        ('technology', 'technologies'),
                        ('organization', 'organizations'),
                        ('team', 'teams')
                    ]

                for fk_field, fk_table in fk_checks:
                    if fk_field in entity and entity[fk_field]:
                        original_ref = entity[fk_field]
                        # Determine ID type from FK table
                        id_type = fk_table.rstrip('s') if fk_table.endswith('s') else fk_table
                        normalized_ref = self.normalize_id(original_ref, id_type)

                        # Check if normalized version exists
                        if original_ref not in self.valid_ids[fk_table]:
                            if normalized_ref in self.valid_ids[fk_table]:
                                issues_in_file.append(f"  • {entity_id}.{fk_field}: {original_ref} → {normalized_ref}")
                                if not self.dry_run and not self.validate_only:
                                    entity[fk_field] = normalized_ref
                                modified = True
                            else:
                                issues_in_file.append(f"  ⚠️  {entity_id}.{fk_field}: {original_ref} → NOT FOUND (will set to null)")
                                if not self.dry_run and not self.validate_only:
                                    entity[fk_field] = None
                                modified = True
                    elif entity_type in ['profiles', 'hardeningProfiles']:
                        # Track missing recommended fields for profiles
                        rel_path = str(filepath.relative_to(self.data_dir))
                        self.missing_fields.append((rel_path, entity_id, fk_field))

            if modified:
                self.files_modified += 1
                self.issues_found += len(issues_in_file)

                rel_path = filepath.relative_to(self.data_dir)
                if self.dry_run:
                    print(f"📝 {rel_path} (would modify):")
                else:
                    print(f"✏️  {rel_path} (modified):")

                for issue in issues_in_file:
                    print(issue)
                print()

                if not self.dry_run and not self.validate_only:
                    # Create backup before modifying
                    backup_path = filepath.with_suffix(f'.yml.bak.{datetime.now().strftime("%Y%m%d-%H%M%S")}')
                    shutil.copy2(filepath, backup_path)

                    # Write modified data
                    with open(filepath, 'w', encoding='utf-8') as f:
                        yaml.dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
            elif self.verbose:
                rel_path = filepath.relative_to(self.data_dir)
                print(f"✓ {rel_path} (no issues)")

        except Exception as e:
            print(f"❌ Error processing {filepath}: {e}")
            self.validation_errors.append(f"Error processing {filepath.name}: {e}")

    def update_gitignore(self):
        """Add backup files pattern to .gitignore if not already present."""
        gitignore_path = Path('.gitignore')
        backup_pattern = '*.bak.*'

        try:
            # Read existing .gitignore
            if gitignore_path.exists():
                with open(gitignore_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Check if pattern already exists
                if backup_pattern in content:
                    return

                # Append pattern
                with open(gitignore_path, 'a', encoding='utf-8') as f:
                    if not content.endswith('\n'):
                        f.write('\n')
                    f.write(f'\n# YAML data quality fixer backups\n{backup_pattern}\n')

                print(f"✅ Added '{backup_pattern}' to .gitignore")
            else:
                # Create new .gitignore
                with open(gitignore_path, 'w', encoding='utf-8') as f:
                    f.write(f'# YAML data quality fixer backups\n{backup_pattern}\n')
                print(f"✅ Created .gitignore with '{backup_pattern}'")

        except Exception as e:
            print(f"⚠️  Could not update .gitignore: {e}")

    def print_quality_report(self):
        """Print comprehensive data quality report."""
        print("=" * 70)
        print("  Data Quality Report")
        print("=" * 70)
        print()

        # Duplicate IDs
        if self.duplicate_ids:
            print(f"🔴 DUPLICATE IDs ({len(self.duplicate_ids)} found):")
            print()
            for dup_id, locations in sorted(self.duplicate_ids.items()):
                entity_type, entity_id = dup_id.split(':', 1)
                print(f"  • {entity_type}: '{entity_id}'")
                for loc in locations:
                    print(f"      - {loc}")
                print()
        else:
            print("✅ No duplicate IDs found")
            print()

        # Missing fields
        if self.missing_fields:
            # Group by field
            by_field: Dict[str, List[Tuple[str, str]]] = {}
            for file_path, entity_id, field in self.missing_fields:
                if field not in by_field:
                    by_field[field] = []
                by_field[field].append((file_path, entity_id))

            print(f"⚠️  MISSING RECOMMENDED FIELDS ({len(self.missing_fields)} profiles):")
            print()
            for field, entries in sorted(by_field.items()):
                print(f"  • Missing '{field}': {len(entries)} profiles")
                if self.verbose:
                    for file_path, entity_id in entries[:10]:  # Show first 10
                        print(f"      - {file_path}: {entity_id}")
                    if len(entries) > 10:
                        print(f"      ... and {len(entries) - 10} more")
                print()
        else:
            print("✅ No missing recommended fields")
            print()

        # Validation errors
        if self.validation_errors:
            print(f"❌ VALIDATION ERRORS ({len(self.validation_errors)} found):")
            print()
            for error in self.validation_errors:
                print(f"  • {error}")
            print()
        else:
            print("✅ No validation errors")
            print()

    def run(self):
        """Run the data quality fixer."""
        print("=" * 70)
        print("  YAML Data Quality Fixer")
        print("=" * 70)
        print()

        if self.validate_only:
            print("📋 VALIDATION MODE - Reporting data quality issues only")
        elif self.dry_run:
            print("🔍 DRY RUN MODE - No files will be modified")
            print("   Run with --fix to apply changes")
        else:
            print("⚠️  FIX MODE - Files will be modified!")
            print("   Backups will be created with .bak.TIMESTAMP extension")
        print()

        # Phase 1: Scan for valid IDs and detect duplicates
        self.scan_for_valid_ids()

        # Phase 2: Check and fix files (skip if validate-only and duplicates found)
        if not (self.validate_only and self.duplicate_ids):
            print("🔧 Phase 2: Checking and fixing data quality issues...")
            print()

            all_entity_types = ['standards', 'technologies', 'organizations', 'teams',
                               'tags', 'capabilities', 'tools', 'profiles', 'hardening']

            for entity_type in all_entity_types:
                entity_dir = self.data_dir / entity_type
                if not entity_dir.exists():
                    continue

                yaml_files = list(entity_dir.glob('*.yml')) + list(entity_dir.glob('*.yaml'))

                # Determine the key name (profiles vs hardeningProfiles)
                if entity_type == 'hardening':
                    key_name = 'hardeningProfiles'
                else:
                    key_name = entity_type

                for filepath in yaml_files:
                    self.fix_yaml_file(filepath, key_name)

        # Phase 3: Quality report
        self.print_quality_report()

        # Summary
        print("=" * 70)
        print("  Summary")
        print("=" * 70)
        print()
        print(f"  Files scanned: {len(list(self.data_dir.rglob('*.yml')))}")
        print(f"  Normalization issues: {self.issues_found}")
        print(f"  Duplicate IDs: {len(self.duplicate_ids)}")
        print(f"  Missing fields: {len(self.missing_fields)}")
        print(f"  Validation errors: {len(self.validation_errors)}")
        print()

        # Update .gitignore if fixing
        if not self.dry_run and not self.validate_only and self.files_modified > 0:
            self.update_gitignore()
            print()

        # Final message
        if self.validate_only:
            if self.duplicate_ids or self.validation_errors:
                print("❌ VALIDATION FAILED - Fix critical issues above before proceeding")
            else:
                print("✅ Validation passed! Data quality is good.")
                if self.issues_found > 0 or self.missing_fields:
                    print("   Some normalization/optional field issues found - run with --fix to clean up")
        elif self.dry_run and self.issues_found > 0:
            print("✅ Dry run complete. Review the changes above.")
            print("   Run with --fix to apply these changes.")
        elif not self.dry_run:
            print("✅ Fixes applied!")
            if self.files_modified > 0:
                print()
                print("📦 Backup files created with .bak.TIMESTAMP extension")
                print("   To restore: mv file.yml.bak.TIMESTAMP file.yml")
                print("   To remove backups: find content/data -name '*.bak.*' -delete")
        else:
            print("✅ No issues found!")
        print()


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Comprehensive YAML data quality checker and fixer',
        epilog="""
Examples:
  python %(prog)s                           # Dry run (show what would change)
  python %(prog)s --validate                # Validation only (report all issues)
  python %(prog)s --validate --verbose      # Validation with detailed missing field list
  python %(prog)s --fix                     # Apply all fixes with backups
  python %(prog)s --fix --verbose           # Apply fixes with detailed output
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('--fix', action='store_true',
                       help='Apply fixes to YAML files (creates timestamped backups)')
    parser.add_argument('--validate', action='store_true',
                       help='Validation mode: report all data quality issues without fixing')
    parser.add_argument('--verbose', action='store_true',
                       help='Show detailed output including files with no issues and full missing field lists')
    parser.add_argument('--data-dir', default='./content/data',
                       help='Path to data directory (default: ./content/data)')

    args = parser.parse_args()

    # Validate mode overrides fix mode
    if args.validate:
        fixer = DataQualityFixer(
            data_dir=args.data_dir,
            dry_run=True,
            verbose=args.verbose,
            validate_only=True
        )
    else:
        fixer = DataQualityFixer(
            data_dir=args.data_dir,
            dry_run=not args.fix,
            verbose=args.verbose,
            validate_only=False
        )

    fixer.run()


if __name__ == '__main__':
    main()
