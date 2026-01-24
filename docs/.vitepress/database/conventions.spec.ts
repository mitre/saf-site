/**
 * Conventions Module Tests
 *
 * Tests for slug generation and naming convention functions
 */

import { describe, expect, it } from 'vitest'
import {
  abbreviateStandard,
  abbreviateTarget,
  extractVersion,
  generateContentSlug,
  parseRepoName,
  slugify,
  suggestSlugFromRepo,
} from './conventions.js'

describe('abbreviateTarget', () => {
  it('abbreviates Red Hat Enterprise Linux to rhel', () => {
    expect(abbreviateTarget('Red Hat Enterprise Linux')).toBe('rhel')
    expect(abbreviateTarget('red hat enterprise linux')).toBe('rhel')
    expect(abbreviateTarget('RedHat Enterprise Linux')).toBe('rhel')
  })

  it('abbreviates Windows Server to win', () => {
    expect(abbreviateTarget('Windows Server')).toBe('win')
    expect(abbreviateTarget('windows server')).toBe('win')
    expect(abbreviateTarget('Windows')).toBe('win')
  })

  it('abbreviates VMware products', () => {
    expect(abbreviateTarget('VMware ESXi')).toBe('esxi')
    expect(abbreviateTarget('VMware vSphere')).toBe('vsphere')
    expect(abbreviateTarget('VMware vCenter')).toBe('vcsa')
  })

  it('abbreviates cloud platforms', () => {
    expect(abbreviateTarget('Amazon Web Services')).toBe('aws')
    expect(abbreviateTarget('Amazon RDS')).toBe('aws-rds')
    expect(abbreviateTarget('Google Cloud Platform')).toBe('gcp')
    expect(abbreviateTarget('Microsoft Azure')).toBe('azure')
  })

  it('abbreviates databases', () => {
    expect(abbreviateTarget('PostgreSQL')).toBe('postgresql')
    expect(abbreviateTarget('MySQL')).toBe('mysql')
    expect(abbreviateTarget('Microsoft SQL Server')).toBe('mssql')
    expect(abbreviateTarget('MongoDB')).toBe('mongodb')
  })

  it('abbreviates containers', () => {
    expect(abbreviateTarget('Kubernetes')).toBe('k8s')
    expect(abbreviateTarget('Docker')).toBe('docker')
    expect(abbreviateTarget('Docker CE')).toBe('docker-ce')
  })

  it('falls back to slugified version for unknown targets', () => {
    expect(abbreviateTarget('Some Unknown Platform')).toBe('some-unknown-platform')
  })
})

describe('abbreviateStandard', () => {
  it('abbreviates DISA STIG', () => {
    expect(abbreviateStandard('DISA STIG')).toBe('stig')
    expect(abbreviateStandard('stig')).toBe('stig')
    expect(abbreviateStandard('STIG')).toBe('stig')
  })

  it('abbreviates CIS Benchmark', () => {
    expect(abbreviateStandard('CIS Benchmark')).toBe('cis')
    expect(abbreviateStandard('CIS')).toBe('cis')
  })

  it('abbreviates PCI DSS', () => {
    expect(abbreviateStandard('PCI DSS')).toBe('pci-dss')
    expect(abbreviateStandard('pci-dss')).toBe('pci-dss')
  })

  it('falls back to slugified version for unknown standards', () => {
    expect(abbreviateStandard('Some Custom Standard')).toBe('some-custom-standard')
  })
})

describe('extractVersion', () => {
  it('extracts major version', () => {
    expect(extractVersion('Red Hat Enterprise Linux 9')).toBe('9')
    expect(extractVersion('Windows Server 2019')).toBe('2019')
  })

  it('extracts and concatenates Ubuntu-style versions', () => {
    expect(extractVersion('Ubuntu 22.04')).toBe('2204')
    expect(extractVersion('Ubuntu 20.04 LTS')).toBe('2004')
  })

  it('returns major only for X.0 versions', () => {
    expect(extractVersion('PostgreSQL 14.0')).toBe('14')
  })

  it('preserves full version for framework versions', () => {
    expect(extractVersion('AWS Foundations 2.0.0')).toBe('2.0.0')
  })

  it('returns null when no version found', () => {
    expect(extractVersion('Docker')).toBeNull()
    expect(extractVersion('MongoDB')).toBeNull()
  })
})

describe('generateContentSlug', () => {
  it('generates validation profile slugs', () => {
    expect(generateContentSlug('Red Hat Enterprise Linux 9', 'DISA STIG'))
      .toBe('rhel-9-stig')

    expect(generateContentSlug('Ubuntu 22.04', 'CIS Benchmark'))
      .toBe('ubuntu-2204-cis')

    expect(generateContentSlug('Windows Server 2019', 'DISA STIG'))
      .toBe('win-2019-stig')
  })

  it('generates hardening content slugs with technology prefix', () => {
    expect(generateContentSlug('Red Hat Enterprise Linux 9', 'DISA STIG', 'Ansible'))
      .toBe('ansible-rhel-9-stig')

    expect(generateContentSlug('Ubuntu 22.04', 'CIS Benchmark', 'Chef'))
      .toBe('chef-ubuntu-2204-cis')
  })

  it('handles targets without versions', () => {
    expect(generateContentSlug('Docker CE', 'CIS Benchmark'))
      .toBe('docker-ce-cis')

    expect(generateContentSlug('MongoDB', 'DISA STIG'))
      .toBe('mongodb-stig')
  })

  it('handles cloud platform slugs with full context', () => {
    expect(generateContentSlug('Amazon RDS MySQL 8', 'DISA STIG'))
      .toBe('aws-rds-mysql-8-stig')

    expect(generateContentSlug('AWS RDS PostgreSQL 14', 'CIS Benchmark'))
      .toBe('aws-rds-postgresql-14-cis')
  })
})

describe('parseRepoName', () => {
  it('parses validation baseline repos', () => {
    const result = parseRepoName('redhat-enterprise-linux-9-stig-baseline')

    expect(result).toEqual({
      target: 'redhat-enterprise-linux-9',
      standard: 'stig',
      type: 'baseline',
    })
  })

  it('parses hardening repos with technology prefix', () => {
    const result = parseRepoName('ansible-redhat-enterprise-linux-9-stig-hardening')

    expect(result).toEqual({
      technology: 'ansible',
      target: 'redhat-enterprise-linux-9',
      standard: 'stig',
      type: 'hardening',
    })
  })

  it('parses CIS baseline repos', () => {
    const result = parseRepoName('ubuntu-22.04-cis-baseline')

    expect(result).toEqual({
      target: 'ubuntu-22.04',
      standard: 'cis',
      type: 'baseline',
    })
  })

  it('parses Chef hardening repos', () => {
    const result = parseRepoName('chef-ubuntu-22.04-cis-hardening')

    expect(result).toEqual({
      technology: 'chef',
      target: 'ubuntu-22.04',
      standard: 'cis',
      type: 'hardening',
    })
  })

  it('returns null for non-matching repos', () => {
    expect(parseRepoName('some-random-repo')).toBeNull()
    expect(parseRepoName('inspec-aws')).toBeNull()
  })
})

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('replaces non-alphanumeric with hyphens', () => {
    expect(slugify('hello_world.test')).toBe('hello-world-test')
  })

  it('removes leading and trailing hyphens', () => {
    expect(slugify('  hello world  ')).toBe('hello-world')
    expect(slugify('--hello--')).toBe('hello')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })
})

describe('suggestSlugFromRepo', () => {
  it('suggests slug from baseline repo name', () => {
    expect(suggestSlugFromRepo('redhat-enterprise-linux-9-stig-baseline'))
      .toBe('rhel-9-stig')
  })

  it('suggests slug from hardening repo name', () => {
    expect(suggestSlugFromRepo('ansible-redhat-enterprise-linux-9-stig-hardening'))
      .toBe('ansible-rhel-9-stig')
  })

  it('returns null for non-matching repo names', () => {
    expect(suggestSlugFromRepo('random-repo')).toBeNull()
  })
})
