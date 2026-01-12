import { defineLoader } from 'vitepress'
import { readFileSync, existsSync } from 'fs'
import { parse } from 'yaml'
import { resolve } from 'path'

interface Profile {
  id: string
  slug: string
  name: string
  description?: string
  category?: string
  maintainer?: string
  technology?: string
  version?: string
  github_url?: string
}

export interface ProfileData {
  profiles: Profile[]
}

declare const data: ProfileData
export { data }

export default defineLoader({
  watch: ['../../content/data/profiles/*.yml'],
  async load(): Promise<ProfileData> {
    // For now, return mock data
    // In production, this would read from YAML files
    const profiles: Profile[] = [
      {
        id: 'rhel8-stig',
        slug: 'rhel8-stig',
        name: 'Red Hat Enterprise Linux 8 STIG',
        description: 'Security Technical Implementation Guide for RHEL 8',
        category: 'STIG',
        maintainer: 'MITRE SAF',
        technology: 'Linux',
        version: '1.12.0',
        github_url: 'https://github.com/mitre/redhat-enterprise-linux-8-stig-baseline'
      },
      {
        id: 'ubuntu-20-cis',
        slug: 'ubuntu-20-cis',
        name: 'Ubuntu 20.04 CIS Benchmark',
        description: 'Center for Internet Security benchmark for Ubuntu 20.04',
        category: 'CIS',
        maintainer: 'MITRE SAF',
        technology: 'Linux',
        version: '2.0.1',
        github_url: 'https://github.com/mitre/canonical-ubuntu-20.04-lts-stig-baseline'
      },
      {
        id: 'windows-server-2019-stig',
        slug: 'windows-server-2019-stig',
        name: 'Windows Server 2019 STIG',
        description: 'Security Technical Implementation Guide for Windows Server 2019',
        category: 'STIG',
        maintainer: 'MITRE SAF',
        technology: 'Windows',
        version: '2.8.0',
        github_url: 'https://github.com/mitre/microsoft-windows-server-2019-stig-baseline'
      }
    ]

    return { profiles }
  }
})
