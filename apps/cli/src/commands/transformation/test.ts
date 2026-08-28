import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'

export default class TransformationTest extends BaseCommand {
  static override aliases = ['tx:test']

  static override description = 'Run test fixtures against the built transformation.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    // No flags or args of its own — the parse still rejects unknown ones.
    await this.parse(TransformationTest)
    const cwd = this.savedPwd

    // Check for package.json
    const packageJsonPath = join(cwd, 'package.json')
    if (!existsSync(packageJsonPath)) {
      this.error('No package.json found in current directory. Run this command from a transformation project root.')
    }

    // Read package.json to check for test script
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

    this.log('Running transformation tests...')

    try {
      // Check for test script in package.json
      if (packageJson.scripts?.test) {
        this.log('Running npm test...')
        execSync('npm test', {
          cwd,
          stdio: 'inherit'
        })
      } else {
        // Check for test directory with fixtures
        const testDir = join(cwd, 'test')
        if (existsSync(testDir)) {
          this.log('Found test/ directory but no test script configured.')
          this.log('Add a "test" script to package.json to run tests.')
        } else {
          this.log('No test script or test/ directory found.')
          this.log('Add tests to validate your transformation.')
        }
      }

      this.log('')
      this.log('Tests completed.')
    } catch {
      this.error('Tests failed. Check the output above for errors.')
    }
  }
}
