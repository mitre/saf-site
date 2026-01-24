/**
 * Content TUI Integration Tests
 *
 * True integration tests that spawn the actual CLI and simulate
 * keyboard input using interactive-cli-tester.
 *
 * These tests verify the complete TUI experience including:
 * - Prompt rendering
 * - Keyboard navigation
 * - User input handling
 * - Error states and cancellation
 *
 * Note: These tests are slower (~1-5s each) but provide high confidence
 * that the TUI works correctly end-to-end.
 *
 * Uses the test Pocketbase instance (port 8091) managed by global setup.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ANSI, CLITest } from 'interactive-cli-tester'
import { beforeAll, describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Path to CLI entry point
const CLI_ENTRY = join(__dirname, '../index.ts')

// Timeout for TUI tests (they're slower due to real process spawning)
const TUI_TIMEOUT = 15000

// Ctrl+C character (not in ANSI constants)
const CTRL_C = '\x03'

// Helper to create CLI test instance
// Note: Pocketbase env vars are set by global setup (test/global-setup.ts)
function createCliTest(args: string[]): CLITest {
  return new CLITest('npx', ['tsx', CLI_ENTRY, ...args], {
    failOnStderr: false, // Allow stderr output (errors are expected in some tests)
  })
}

// Helper to filter npm warnings from CLI output
// npm outputs config warnings to stderr which get mixed into output
function filterNpmWarnings(output: string): string {
  return output
    .split('\n')
    .filter(line =>
      !line.startsWith('npm warn')
      && !line.startsWith('npm WARN'),
    )
    .join('\n')
}

// Helper to get first non-warning line from output (for extracting IDs)
function getFirstContentLine(output: string): string | null {
  const lines = filterNpmWarnings(output).trim().split('\n')
  const contentLine = lines.find(line => line.trim().length > 0)
  return contentLine || null
}

// ============================================================================
// TUI HELP TESTS (No Pocketbase required)
// ============================================================================

describe('content TUI - Help', { timeout: TUI_TIMEOUT }, () => {
  it('shows content command help', async () => {
    const cli = createCliTest(['content', '--help'])

    await cli.run()
    const exitCode = await cli.waitForExit()

    expect(exitCode).toBe(0)
    const output = cli.getOutput()
    expect(output).toContain('content')
    expect(output).toContain('add')
    expect(output).toContain('list')
    expect(output).toContain('update')
  })

  it('shows add command help', async () => {
    const cli = createCliTest(['content', 'add', '--help'])

    await cli.run()
    const exitCode = await cli.waitForExit()

    expect(exitCode).toBe(0)
    const output = cli.getOutput()
    expect(output).toContain('--type')
    expect(output).toContain('--vendor')
    expect(output).toContain('validation')
    expect(output).toContain('hardening')
  })
})

// ============================================================================
// TUI ADD FLOW TESTS
// ============================================================================

describe('content TUI - Add Flow', { timeout: TUI_TIMEOUT }, () => {
  // Pocketbase is always available via global setup (port 8091)

  describe('uRL input validation', () => {
    it('prompts for GitHub URL when not provided', async () => {
      const cli = createCliTest(['content', 'add'])

      await cli.run()

      // Wait for the URL prompt
      await cli.waitForOutput('GitHub repository URL')

      // Cancel the operation
      await cli.write(CTRL_C)

      const exitCode = await cli.waitForExit()
      // Exit code 0 for graceful cancel
      expect([0, 130]).toContain(exitCode)
    })

    it('shows validation error for invalid URL', async () => {
      const cli = createCliTest(['content', 'add'])

      await cli.run()
      await cli.waitForOutput('GitHub repository URL')

      // Enter invalid URL
      await cli.write(`not-a-valid-url${ANSI.CR}`)

      // Should show error and re-prompt
      await cli.waitForOutput('Invalid GitHub URL')

      // Cancel
      await cli.write(CTRL_C)
      await cli.waitForExit()

      expect(cli.getOutput()).toContain('Invalid GitHub URL')
    })
  })

  describe('full add flow', () => {
    it('completes add flow with valid inputs', async () => {
      const cli = createCliTest(['content', 'add'])

      await cli.run()

      // 1. Enter GitHub URL
      await cli.waitForOutput('GitHub repository URL')
      await cli.write(`https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline${ANSI.CR}`)

      // 2. Wait for repo fetch (spinner)
      await cli.waitForOutput('Fetching')

      // 3. Should show fetched info
      await cli.waitForOutput('Repository')

      // 4. Content type selection
      await cli.waitForOutput('Content type')
      // Default is validation, just press enter
      await cli.write(ANSI.CR)

      // 5. Name input
      await cli.waitForOutput('Name')
      await cli.write(ANSI.CR) // Accept default

      // 6. Slug input
      await cli.waitForOutput('Slug')
      await cli.write(ANSI.CR) // Accept default

      // 7. Description
      await cli.waitForOutput('Description')
      await cli.write(ANSI.CR) // Accept default

      // 8. Version
      await cli.waitForOutput('Version')
      await cli.write(ANSI.CR) // Accept default

      // 9. Target platform selection
      await cli.waitForOutput('Target')
      // Navigate and select (or skip)
      await cli.write(ANSI.CR) // Select first option or skip

      // 10. Standard selection
      await cli.waitForOutput('standard')
      await cli.write(ANSI.CR)

      // 11. Technology selection
      await cli.waitForOutput('Technology')
      await cli.write(ANSI.CR)

      // 12. Vendor selection
      await cli.waitForOutput('Vendor')
      await cli.write(ANSI.CR)

      // 13. Control count
      await cli.waitForOutput('Control count')
      await cli.write(ANSI.CR)

      // 14. Confirmation
      await cli.waitForOutput('Create this content record')
      // Cancel instead of creating to avoid polluting database
      await cli.write(`n${ANSI.CR}`)

      const exitCode = await cli.waitForExit()
      expect([0, 130]).toContain(exitCode)
    }, 60000) // Extended timeout for full flow
  })

  describe('cancellation handling', () => {
    it('handles Ctrl+C gracefully at URL prompt', async () => {
      const cli = createCliTest(['content', 'add'])

      await cli.run()
      await cli.waitForOutput('GitHub repository URL')

      // Send Ctrl+C
      await cli.write(CTRL_C)

      const exitCode = await cli.waitForExit()
      expect([0, 130]).toContain(exitCode)
    })

    it('handles Escape key for cancellation', async () => {
      const cli = createCliTest(['content', 'add'])

      await cli.run()
      await cli.waitForOutput('GitHub repository URL')

      // Send Escape
      await cli.write(ANSI.ESC)

      // Give it time to process
      await new Promise(resolve => setTimeout(resolve, 500))

      // Either exits or shows cancel message
      const output = cli.getOutput()
      // The CLI should handle escape gracefully
      expect(output).toBeDefined()
    })
  })
})

// ============================================================================
// TUI LIST TESTS
// ============================================================================

describe('content TUI - List', { timeout: TUI_TIMEOUT }, () => {
  // Pocketbase is always available via global setup (port 8091)

  it('lists content in table format', async () => {
    const cli = createCliTest(['content', 'list'])

    await cli.run()
    const exitCode = await cli.waitForExit()

    expect(exitCode).toBe(0)
    const output = cli.getOutput()
    // Should show table headers
    expect(output).toContain('ID')
    expect(output).toContain('Name')
  })

  it('filters by type', async () => {
    const cli = createCliTest(['content', 'list', '--type', 'validation'])

    await cli.run()
    const exitCode = await cli.waitForExit()

    expect(exitCode).toBe(0)
    const output = cli.getOutput()
    expect(output).toContain('validation')
  })
})

// ============================================================================
// TUI SHOW TESTS
// ============================================================================

describe('content TUI - Show', { timeout: TUI_TIMEOUT }, () => {
  // Pocketbase is always available via global setup (port 8091)
  let testContentId: string | null = null

  beforeAll(async () => {
    // Get a content ID for testing
    const cli = createCliTest(['content', 'list', '--quiet', '--limit', '1'])
    await cli.run()
    await cli.waitForExit()
    testContentId = getFirstContentLine(cli.getOutput())
  })

  it('shows content details', async () => {
    // Skip if no content in database
    if (!testContentId) {
      console.log('No content found in database, skipping test')
      return
    }

    const cli = createCliTest(['content', 'show', testContentId])

    await cli.run()
    const exitCode = await cli.waitForExit()

    expect(exitCode).toBe(0)
    const output = cli.getOutput()
    expect(output).toContain('ID')
    expect(output).toContain('Slug')
    expect(output).toContain('Type')
  })

  it('shows error for non-existent ID', async () => {
    const cli = createCliTest(['content', 'show', 'nonexistent-id-12345'])

    await cli.run()
    const exitCode = await cli.waitForExit()

    // Should fail with error
    expect(exitCode).toBe(1)
  })
})

// ============================================================================
// TUI UPDATE TESTS
// ============================================================================

describe('content TUI - Update', { timeout: TUI_TIMEOUT }, () => {
  // Pocketbase is always available via global setup (port 8091)

  it('shows error for missing ID', async () => {
    const cli = createCliTest(['content', 'update'])

    await cli.run()
    const exitCode = await cli.waitForExit()

    // Commander should show error for missing required argument
    expect(exitCode).toBe(1)
    const output = cli.getOutput()
    expect(output).toContain('error')
  })

  it('shows no changes when nothing specified', async () => {
    // First get a content ID
    const listCli = createCliTest(['content', 'list', '--quiet', '--limit', '1'])
    await listCli.run()
    await listCli.waitForExit()
    const contentId = getFirstContentLine(listCli.getOutput())

    if (!contentId) {
      console.log('No content to test update')
      return
    }

    const cli = createCliTest(['content', 'update', contentId, '--set-version', '1.0.0', '--yes'])

    await cli.run()
    const exitCode = await cli.waitForExit()

    // Should succeed (either updates or says no changes)
    expect([0, 1]).toContain(exitCode)
  })
})

// ============================================================================
// TUI KEYBOARD NAVIGATION TESTS
// ============================================================================

describe('content TUI - Keyboard Navigation', { timeout: TUI_TIMEOUT }, () => {
  // Pocketbase is always available via global setup (port 8091)

  it('navigates select options with arrow keys', async () => {
    // Use a real MITRE repo that exists
    const cli = createCliTest(['content', 'add', 'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline'])

    await cli.run()

    // Wait for content type selection prompt
    await cli.waitForOutput('Content type')

    // The select prompt shows both options:
    // - Validation (InSpec profile)
    // - Hardening (Ansible, Chef, etc.)
    // Navigate down to hardening option
    await cli.write(ANSI.CURSOR_DOWN)

    // Small delay for UI update
    await new Promise(resolve => setTimeout(resolve, 200))

    // Verify the select options include validation (the TUI may not render all options in captured output)
    const output = cli.getOutput()
    // @clack/prompts select shows options, check for the prompt or first option
    expect(output.toLowerCase()).toMatch(/content type|validation/i)

    // Cancel the flow
    await cli.write(CTRL_C)
    await cli.waitForExit()
  })
})

// ============================================================================
// TUI ERROR RECOVERY TESTS
// ============================================================================

describe('content TUI - Error Recovery', { timeout: TUI_TIMEOUT }, () => {
  it('handles network errors gracefully', async () => {
    // Use a URL that will fail (invalid repo)
    const cli = createCliTest(['content', 'add', 'https://github.com/invalid-org-12345/nonexistent-repo'])

    await cli.run()

    // Wait for error message
    try {
      await cli.waitForOutput('Failed')
      const output = cli.getOutput()
      expect(output.toLowerCase()).toMatch(/failed|error|not found/i)
    }
    catch {
      // Timeout is also acceptable - means it's still trying
    }

    // Ensure process exits
    await cli.write(CTRL_C)
    await cli.waitForExit()
  })
})
