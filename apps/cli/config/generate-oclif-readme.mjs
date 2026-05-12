/**
 * Generate commands.md documentation from oclif commands.
 * This is run as a heft post-build task.
 */
import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'

export async function runAsync() {
  try {
    console.log('Generating commands.md from oclif readme...')

    // Generate the readme to a temp file, then extract the commands section
    execSync('npx oclif readme --output-dir=.', { stdio: 'inherit' })

    // The oclif readme command updates README.md, we want commands.md
    if (existsSync('README.md')) {
      const readme = readFileSync('README.md', 'utf-8')

      // Extract commands section (everything between <!-- commands --> markers)
      const commandsMatch = readme.match(/<!-- commands -->([\s\S]*?)<!-- commandsstop -->/m)

      if (commandsMatch) {
        const commandsContent = `# synth CLI Commands

This document is auto-generated from the oclif command definitions.

${commandsMatch[1].trim()}
`
        writeFileSync('commands.md', commandsContent)
        console.log('commands.md generated successfully')
      } else {
        console.log('No commands section found in README.md, skipping commands.md generation')
      }
    }
  } catch (error) {
    console.error('Failed to generate oclif readme:', error.message)
    // Don't fail the build for readme generation issues
    console.log('Continuing build despite readme generation failure')
  }
}
