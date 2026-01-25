#!/usr/bin/env node
/**
 * SAF Site CLI
 *
 * Command-line tool for managing SAF site content and database
 */

import { Command } from 'commander'
import pc from 'picocolors'
import { contentCommand } from './commands/content.js'
import { dbCommand } from './commands/db.js'
import { tableCommand } from './commands/table.js'

const program = new Command()

program
  .name('saf-site')
  .description('CLI tool for managing SAF site content and database')
  .version('0.1.0')

// Register commands
program.addCommand(contentCommand)
program.addCommand(dbCommand)
program.addCommand(tableCommand)

// Global error handling
program.hook('preAction', () => {
  // Could add authentication check here
})

program.configureOutput({
  writeErr: str => process.stderr.write(pc.red(str)),
  outputError: (str, write) => write(pc.red(str)),
})

// Parse arguments
program.parse()
