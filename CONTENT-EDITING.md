# Content Editing with Pocketbase

This project uses Pocketbase for content management, allowing easy editing of profiles, organizations, standards, and other data through a web UI.

## Quick Start

### 1. Start Pocketbase

```bash
cd .pocketbase && ./pocketbase serve
```

The admin UI will be available at: **http://localhost:8090/_/**

**Admin credentials:**
- Email: `admin@localhost.com`
- Password: `test1234567`

### 2. Edit Content

1. Open http://localhost:8090/_/ in your browser
2. Log in with admin credentials
3. Click on any collection (organizations, profiles, standards, etc.)
4. Edit existing records or create new ones

**Key Features:**
- **FK Relations:** Dropdown pickers show names (not IDs), searchable
- **Inline Editing:** Click on any field to edit directly
- **Validation:** Required fields enforced, data types validated
- **Real-time:** Changes saved immediately

### 3. Export Changes

After editing content, export the database to git-friendly format:

```bash
cd .pocketbase/pb_data
sqlite-diffable dump data.db diffable/ --all
```

This creates/updates `.metadata.json` (schema) and `.ndjson` (data) files for each table.

### 4. Commit Changes

```bash
git add .pocketbase/pb_data/diffable/
git commit -m "content: update profiles/organizations/etc"
git push
```

## Collections

### Base Collections (no FKs)
- **tags** - Content tags (ansible, cloud, security, etc.)
- **organizations** - Organizations (MITRE, DISA, CIS, etc.)
- **technologies** - Technologies (InSpec, Ansible, Terraform, etc.)
- **standards** - Standards (STIG, CIS, NIST, PCI-DSS, etc.)
- **capabilities** - Capabilities (validate, harden, plan, etc.)

### Collections with FK Relations
- **teams** - Teams (FK: organization)
- **profiles** - Validation profiles (FKs: technology, organization, team, standard)
- **hardening_profiles** - Hardening profiles (FKs: technology, organization, team, standard)
- **tools** - Tools (FKs: technology, organization)

### Junction Tables (many-to-many)
- **profiles_tags** - Links profiles to tags
- **hardening_profiles_tags** - Links hardening profiles to tags
- **validation_to_hardening** - Links validation profiles to hardening profiles

## Restoring Database from Git

When cloning the repository or pulling changes:

```bash
cd .pocketbase/pb_data
sqlite-diffable load diffable/ data.db --all
```

This recreates the binary `data.db` from the git-tracked `.metadata.json` and `.ndjson` files.

## Database Structure

**Binary files (NOT in git):**
- `.pocketbase/pb_data/data.db` - Main database (ignored)
- `.pocketbase/pb_data/data.db-wal` - Write-ahead log (ignored)
- `.pocketbase/pb_data/data.db-shm` - Shared memory (ignored)

**Git-tracked files:**
- `.pocketbase/pb_data/diffable/*.metadata.json` - Table schemas
- `.pocketbase/pb_data/diffable/*.ndjson` - Table data (one record per line)

**Why this approach?**
- Binary SQLite files cause merge conflicts
- Text-based NDJSON files are git-friendly
- Schema and data are separate for clarity
- Easy to review changes in pull requests

## Editing Workflow

### Adding a New Validation Profile

1. Start Pocketbase: `cd .pocketbase && ./pocketbase serve`
2. Open http://localhost:8090/_/
3. Go to **Collections** → **profiles**
4. Click **New record**
5. Fill in fields:
   - `profile_id`: Unique ID (e.g., `rhel-9-stig`)
   - `name`: Display name (e.g., `Red Hat 9 STIG`)
   - `technology`: Select from dropdown (e.g., InSpec)
   - `organization`: Select from dropdown (e.g., MITRE)
   - `team`: Select from dropdown (e.g., MITRE SAF Team)
   - `standard`: Select from dropdown (e.g., STIG)
   - Other fields as needed
6. Click **Create**
7. Export: `cd .pocketbase/pb_data && sqlite-diffable dump data.db diffable/ --all`
8. Commit: `git add .pocketbase/pb_data/diffable/ && git commit -m "content: add RHEL 9 STIG profile"`

### Updating an Organization

1. Open http://localhost:8090/_/
2. Go to **Collections** → **organizations**
3. Click on the organization to edit
4. Modify fields (name, description, website, logo, etc.)
5. Changes auto-save
6. Export and commit as above

### Adding Tags to a Profile

1. Open http://localhost:8090/_/
2. Go to **Collections** → **profiles_tags**
3. Click **New record**
4. Select `profile_id` from dropdown (shows profile names)
5. Select `tag_id` from dropdown (shows tag names)
6. Click **Create**
7. Export and commit

## Common Tasks

### Checking What Changed

```bash
git status .pocketbase/pb_data/diffable/
git diff .pocketbase/pb_data/diffable/
```

### Viewing Record Count

```bash
wc -l .pocketbase/pb_data/diffable/profiles.ndjson
```

### Searching Data

```bash
grep -i "RHEL" .pocketbase/pb_data/diffable/profiles.ndjson
```

### Backing Up Before Major Changes

```bash
cp -r .pocketbase/pb_data/diffable .pocketbase/pb_data/diffable.backup
```

## Troubleshooting

### "Collection not found" error
- Ensure Pocketbase is running: `cd .pocketbase && ./pocketbase serve`
- Check the admin UI: http://localhost:8090/_/

### Database is empty after restore
- Run: `cd .pocketbase/pb_data && sqlite-diffable load diffable/ data.db --all`
- Restart Pocketbase

### Changes not showing in git
- Make sure you ran: `sqlite-diffable dump data.db diffable/ --all`
- Check that files were created: `ls .pocketbase/pb_data/diffable/`

### Merge conflicts in NDJSON files
- NDJSON files are line-based, so conflicts are rare
- If conflicts occur, each line is a complete record - resolve per line
- Worst case: restore from one side and re-apply changes manually in UI

## Scripts

Useful scripts in `scripts/` directory:

- `create-all-collections.ts` - Creates all 12 Pocketbase collections
- `import-yaml-data.ts` - Imports data from YAML files
- `verify-collections.ts` - Validates collection structure
- `verify-import.ts` - Validates imported data

## Resources

- [Pocketbase Documentation](https://pocketbase.io/docs/)
- [sqlite-diffable GitHub](https://github.com/simonw/sqlite-diffable)
- [NDJSON Format](http://ndjson.org/)
