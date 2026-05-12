/**
 * Generate oclif.manifest.json after TypeScript compilation.
 * This is run as a heft post-build task.
 */
import { execSync } from 'node:child_process'

export async function runAsync() {
  try {
    console.log('Generating oclif.manifest.json...')
    execSync('npx oclif manifest', { stdio: 'inherit' })
    console.log('oclif.manifest.json generated successfully')
  } catch (error) {
    console.error('Failed to generate oclif manifest:', error.message)
    throw error
  }
}
