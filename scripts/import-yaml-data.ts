#!/usr/bin/env tsx
/**
 * Import YAML data into Pocketbase collections
 * Phase 2 of Pocketbase content management implementation
 */

import PocketBase from 'pocketbase'
import { readFileSync, readdirSync } from 'fs'
import { parse } from 'yaml'
import { join } from 'path'

const pb = new PocketBase('http://127.0.0.1:8090')

// Authenticate
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
console.log('✓ Authenticated\n')

// ID mapping: YAML string IDs → Pocketbase record IDs
const idMap: Record<string, Record<string, string>> = {
  tags: {},
  organizations: {},
  technologies: {},
  standards: {},
  capabilities: {},
  teams: {},
  profiles: {},
  hardening_profiles: {}
}

console.log('='*60)
console.log('PHASE 1: Import base data (no FKs)')
console.log('='*60 + '\n')

// 1. Import Tags
console.log('Importing tags...')
const tagsYaml = parse(readFileSync('content/data/tags/tags.yml', 'utf-8'))
for (const tag of tagsYaml.tags) {
  try {
    const record = await pb.collection('tags').create({
      tag_id: tag.id,
      description: tag.description || '',
      category: tag.category || '',
      status: tag.status || 'active'
    })
    idMap.tags[tag.id] = record.id
    console.log(`  ✓ ${tag.id}`)
  } catch (e: any) {
    console.log(`  ✗ ${tag.id}: ${e.message}`)
  }
}

// 2. Import Organizations
console.log('\nImporting organizations...')
const orgsYaml = parse(readFileSync('content/data/organizations/entities.yml', 'utf-8'))
for (const org of orgsYaml.organizations) {
  try {
    const record = await pb.collection('organizations').create({
      org_id: org.id,
      name: org.name,
      description: org.description || '',
      website: org.website || '',
      logo: org.logo || '',
      status: org.status || 'active'
    })
    idMap.organizations[org.id] = record.id
    console.log(`  ✓ ${org.id}: ${org.name}`)
  } catch (e: any) {
    console.log(`  ✗ ${org.id}: ${e.message}`)
  }
}

// 3. Import Technologies
console.log('\nImporting technologies...')
const techYaml = parse(readFileSync('content/data/technologies/technologies.yml', 'utf-8'))
for (const tech of techYaml.technologies) {
  try {
    const record = await pb.collection('technologies').create({
      tech_id: tech.id,
      name: tech.name,
      description: tech.description || '',
      website: tech.website || '',
      logo: tech.logo || '',
      category: tech.category || '',
      type: tech.type || '',
      status: tech.status || 'active'
    })
    idMap.technologies[tech.id] = record.id
    console.log(`  ✓ ${tech.id}: ${tech.name}`)
  } catch (e: any) {
    console.log(`  ✗ ${tech.id}: ${e.message}`)
  }
}

// 4. Import Standards
console.log('\nImporting standards...')
const standardFiles = readdirSync('content/data/standards')
for (const file of standardFiles.filter(f => f.endsWith('.yml'))) {
  const standardsYaml = parse(readFileSync(join('content/data/standards', file), 'utf-8'))
  for (const std of standardsYaml.standards || []) {
    try {
      const record = await pb.collection('standards').create({
        standard_id: std.id,
        name: std.name,
        description: std.description || '',
        website: std.website || '',
        type: std.type || '',
        category: std.category || '',
        vendor: std.vendor || '',
        version: std.version || '',
        logo: std.logo || '',
        status: std.status || 'active'
      })
      idMap.standards[std.id] = record.id
      console.log(`  ✓ ${std.id}: ${std.name}`)
    } catch (e: any) {
      console.log(`  ✗ ${std.id}: ${e.message}`)
    }
  }
}

// 5. Import Capabilities
console.log('\nImporting capabilities...')
const capabilitiesYaml = parse(readFileSync('content/data/capabilities/capabilities.yml', 'utf-8'))
for (const cap of capabilitiesYaml.capabilities) {
  try {
    const record = await pb.collection('capabilities').create({
      capability_id: cap.id,
      name: cap.name,
      description: cap.description || '',
      category: cap.category || '',
      status: cap.status || 'active'
    })
    idMap.capabilities[cap.id] = record.id
    console.log(`  ✓ ${cap.id}: ${cap.name}`)
  } catch (e: any) {
    console.log(`  ✗ ${cap.id}: ${e.message}`)
  }
}

console.log('\n' + '='*60)
console.log('PHASE 2: Import data with FKs')
console.log('='*60 + '\n')

// 6. Import Teams (FK: organization)
console.log('Importing teams...')
const teamsYaml = parse(readFileSync('content/data/teams/teams.yml', 'utf-8'))
for (const team of teamsYaml.teams) {
  try {
    const record = await pb.collection('teams').create({
      team_id: team.id,
      name: team.name,
      description: team.description || '',
      organization: idMap.organizations[team.organization] || null,
      status: team.status || 'active'
    })
    idMap.teams[team.id] = record.id
    console.log(`  ✓ ${team.id}: ${team.name}`)
  } catch (e: any) {
    console.log(`  ✗ ${team.id}: ${e.message}`)
  }
}

// 7. Import Validation Profiles
console.log('\nImporting validation profiles...')
const profileFiles = readdirSync('content/data/profiles')
let profileCount = 0
for (const file of profileFiles.filter(f => f.endsWith('.yml') && f !== 'stig.yml.new')) {
  const profilesYaml = parse(readFileSync(join('content/data/profiles', file), 'utf-8'))
  for (const profile of profilesYaml.validationProfiles || profilesYaml.profiles || []) {
    try {
      const record = await pb.collection('profiles').create({
        profile_id: profile.id,
        name: profile.name,
        version: profile.version || '',
        platform: profile.platform || '',
        framework: profile.framework || '',
        technology: idMap.technologies[profile.technology] || null,
        vendor: profile.vendor || '',
        organization: idMap.organizations[profile.organization] || null,
        team: idMap.teams[profile.team] || null,
        github: profile.github || '',
        details: profile.details || '',
        standard: idMap.standards[profile.standard] || null,
        standard_version: profile.standardVersion || '',
        short_description: profile.shortDescription || '',
        requirements: profile.requirements || '',
        category: profile.category || '',
        status: profile.status || 'active'
      })
      idMap.profiles[profile.id] = record.id
      profileCount++
      if (profileCount % 10 === 0) {
        console.log(`  → Imported ${profileCount} profiles...`)
      }
    } catch (e: any) {
      console.log(`  ✗ ${profile.id}: ${e.message}`)
    }
  }
}
console.log(`  ✓ Completed: ${profileCount} validation profiles`)

// 8. Import Hardening Profiles
console.log('\nImporting hardening profiles...')
const hardeningFiles = readdirSync('content/data/hardening')
let hardeningCount = 0
for (const file of hardeningFiles.filter(f => f.endsWith('.yml'))) {
  const hardeningYaml = parse(readFileSync(join('content/data/hardening', file), 'utf-8'))
  for (const profile of hardeningYaml.hardeningProfiles || []) {
    try {
      const record = await pb.collection('hardening_profiles').create({
        hardening_id: profile.id,
        name: profile.name,
        version: profile.version || '',
        platform: profile.platform || '',
        type: profile.type || '',
        technology: idMap.technologies[profile.technology] || null,
        vendor: profile.vendor || '',
        organization: idMap.organizations[profile.organization] || null,
        team: idMap.teams[profile.team] || null,
        github: profile.github || '',
        details: profile.details || '',
        standard: idMap.standards[profile.standard] || null,
        standard_version: profile.standardVersion || '',
        short_description: profile.shortDescription || '',
        requirements: profile.requirements || '',
        category: profile.category || '',
        difficulty: profile.difficulty || '',
        status: profile.status || 'active'
      })
      idMap.hardening_profiles[profile.id] = record.id
      hardeningCount++
    } catch (e: any) {
      console.log(`  ✗ ${profile.id}: ${e.message}`)
    }
  }
}
console.log(`  ✓ Completed: ${hardeningCount} hardening profiles`)

// 9. Import Tools
console.log('\nImporting tools...')
const toolsYaml = parse(readFileSync('content/data/tools/tools.yml', 'utf-8'))
for (const tool of toolsYaml.tools) {
  try {
    const record = await pb.collection('tools').create({
      tool_id: tool.id,
      name: tool.name,
      version: tool.version || '',
      description: tool.description || '',
      website: tool.website || '',
      logo: tool.logo || '',
      technology: idMap.technologies[tool.technology] || null,
      organization: idMap.organizations[tool.organization] || null,
      github: tool.github || '',
      category: tool.category || '',
      status: tool.status || 'active'
    })
    console.log(`  ✓ ${tool.id}: ${tool.name}`)
  } catch (e: any) {
    console.log(`  ✗ ${tool.id}: ${e.message}`)
  }
}

console.log('\n' + '='*60)
console.log('PHASE 3: Import junction table data')
console.log('='*60 + '\n')

// 10. Import profile-tag relationships
console.log('Importing profile-tag relationships...')
let tagRelCount = 0
for (const file of profileFiles.filter(f => f.endsWith('.yml') && f !== 'stig.yml.new')) {
  const profilesYaml = parse(readFileSync(join('content/data/profiles', file), 'utf-8'))
  for (const profile of profilesYaml.validationProfiles || profilesYaml.profiles || []) {
    if (profile.tags && Array.isArray(profile.tags) && profile.tags.length > 0) {
      for (const tagId of profile.tags) {
        if (idMap.profiles[profile.id] && idMap.tags[tagId]) {
          try {
            await pb.collection('profiles_tags').create({
              profile_id: idMap.profiles[profile.id],
              tag_id: idMap.tags[tagId]
            })
            tagRelCount++
          } catch (e: any) {
            // Ignore duplicate errors
          }
        }
      }
    }
  }
}
console.log(`  ✓ Created ${tagRelCount} profile-tag relationships`)

// 11. Import hardening-tag relationships
console.log('Importing hardening-tag relationships...')
let hardeningTagCount = 0
for (const file of hardeningFiles.filter(f => f.endsWith('.yml'))) {
  const hardeningYaml = parse(readFileSync(join('content/data/hardening', file), 'utf-8'))
  for (const profile of hardeningYaml.hardeningProfiles || []) {
    if (profile.tags && Array.isArray(profile.tags) && profile.tags.length > 0) {
      for (const tagId of profile.tags) {
        if (idMap.hardening_profiles[profile.id] && idMap.tags[tagId]) {
          try {
            await pb.collection('hardening_profiles_tags').create({
              hardening_profile_id: idMap.hardening_profiles[profile.id],
              tag_id: idMap.tags[tagId]
            })
            hardeningTagCount++
          } catch (e: any) {
            // Ignore duplicate errors
          }
        }
      }
    }
  }
}
console.log(`  ✓ Created ${hardeningTagCount} hardening-tag relationships`)

// 12. Import validation-to-hardening relationships
console.log('Importing validation-to-hardening relationships...')
let valHardCount = 0
for (const file of profileFiles.filter(f => f.endsWith('.yml') && f !== 'stig.yml.new')) {
  const profilesYaml = parse(readFileSync(join('content/data/profiles', file), 'utf-8'))
  for (const profile of profilesYaml.validationProfiles || profilesYaml.profiles || []) {
    if (profile.hardeningProfiles && Array.isArray(profile.hardeningProfiles) && profile.hardeningProfiles.length > 0) {
      for (const hardeningId of profile.hardeningProfiles) {
        if (idMap.profiles[profile.id] && idMap.hardening_profiles[hardeningId]) {
          try {
            await pb.collection('validation_to_hardening').create({
              validation_profile_id: idMap.profiles[profile.id],
              hardening_profile_id: idMap.hardening_profiles[hardeningId]
            })
            valHardCount++
          } catch (e: any) {
            // Ignore duplicate errors
          }
        }
      }
    }
  }
}
console.log(`  ✓ Created ${valHardCount} validation-to-hardening relationships`)

console.log('\n' + '='*60)
console.log('✅ IMPORT COMPLETE!')
console.log('='*60)
console.log('\nSummary:')
console.log(`  Tags: ${Object.keys(idMap.tags).length}`)
console.log(`  Organizations: ${Object.keys(idMap.organizations).length}`)
console.log(`  Technologies: ${Object.keys(idMap.technologies).length}`)
console.log(`  Standards: ${Object.keys(idMap.standards).length}`)
console.log(`  Capabilities: ${Object.keys(idMap.capabilities).length}`)
console.log(`  Teams: ${Object.keys(idMap.teams).length}`)
console.log(`  Validation Profiles: ${profileCount}`)
console.log(`  Hardening Profiles: ${hardeningCount}`)
console.log(`  Tools: ${Object.keys(idMap.technologies).length}`)
console.log(`  Profile-Tag Links: ${tagRelCount}`)
console.log(`  Hardening-Tag Links: ${hardeningTagCount}`)
console.log(`  Validation-Hardening Links: ${valHardCount}`)
console.log('='*60 + '\n')
