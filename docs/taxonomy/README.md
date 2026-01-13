# Taxonomy Transformation Documentation

This directory contains the planning and design documents for transforming the security profile taxonomy from inconsistent categorization to a clean, logical structure.

## Files

### taxonomy-proposal.md
Complete taxonomy design including:
- Problem statement
- User mental model (What am I securing? What standard? What OS?)
- Proposed taxonomy structure (Target Type, Standard, OS Family, Category, Vendor)
- Example profile mappings
- Filter UX design
- Benefits analysis

### taxonomy-visual.md
Visual representation of the taxonomy including:
- Hierarchy diagrams
- Filter UI layout mockups
- Example profile cards
- Use case examples
- Data structure (JSON)

### taxonomy-transformation-plan.md
Complete implementation plan with 5 phases:
1. Schema Updates (30 min)
2. Data Transformation (1.5 hrs)
3. Verification & Export (30 min)
4. UX Updates (1 hr)
5. Documentation & Commit (15 min)

Includes transformation rules, scripts, rollback plan, and success criteria.

### profile-metadata-fixes.md
Initial analysis identifying data quality issues:
- 56/78 profiles marked "Cross Platform" (meaningless)
- 50/78 profiles using generic "Platform Security" category
- Vendor inconsistencies
- Recommended fixes by group

## Status

**Current:** Planning phase complete, ready for implementation

**Next Steps:** Execute Phase 1 (schema updates)

## Key Changes

- Replace "Cross Platform" with meaningful categories (Linux, Windows, Virtualization, etc.)
- Add 4 new fields: target_type, target_subtype, os_family, profile_maintainer
- Fix vendor assignments (Microsoft for Windows, VMware for VMware, etc.)
- Update filters to 6 dimensions: Standard, Category, OS Family, Target Type, Vendor, Search

## Expected Outcome

**Before:**
- 56 profiles marked "Cross Platform" (meaningless)

**After:**
- 7 profiles: Linux
- 4 profiles: Windows
- 15 profiles: Virtualization
- 13 profiles: Cloud-Native
- etc. (all meaningful)
