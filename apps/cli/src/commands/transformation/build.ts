import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'

export default class TransformationBuild extends BaseCommand {
  static override aliases = ['tx:build']

  static override description = 'Build the transformation in the current directory.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    // No flags or args of its own, but the parse still rejects unknown ones.
    await this.parse(TransformationBuild)
    const cwd = this.savedPwd

    // Check for package.json
    const packageJsonPath = join(cwd, 'package.json')
    if (!existsSync(packageJsonPath)) {
      this.error('No package.json found in current directory. Run this command from a transformation project root.')
    }

    // Read package.json to check for build script
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

    this.log('Building transformation...')

    try {
      // Prefer npm run build if available, fallback to tsc
      if (packageJson.scripts?.build) {
        this.log('Running npm run build...')
        execSync('npm run build', {
          cwd,
          stdio: 'inherit'
        })
      } else {
        // Check if tsc is available
        this.log('No build script found, running tsc directly...')
        execSync('npx tsc', {
          cwd,
          stdio: 'inherit'
        })
      }

      this.log('')
      this.log('Build completed successfully.')
    } catch {
      this.error('Build failed. Check the output above for errors.')
    }
  }
}
