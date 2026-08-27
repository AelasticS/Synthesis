import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'

export default class TransformationPack extends BaseCommand {
  static override aliases = ['tx:pack']

  static override description = 'Produce a distributable tarball.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    const cwd = this.savedPwd

    // Check for package.json
    const packageJsonPath = join(cwd, 'package.json')
    if (!existsSync(packageJsonPath)) {
      this.error('No package.json found in current directory. Run this command from a transformation project root.')
    }

    this.log('Creating distributable tarball...')

    try {
      // Run npm pack
      const output = execSync('npm pack', {
        cwd,
        encoding: 'utf-8'
      })

      // npm pack outputs the filename
      const tarball = output.trim()

      this.log('')
      this.log(`Created: ${tarball}`)
      this.log('')
      this.log('You can install this package with:')
      this.log(`  npm install ${join(cwd, tarball)}`)
      this.log('')
      this.log('Or publish to npm with:')
      this.log('  synth transformation publish')
    } catch {
      this.error('Pack failed. Check the output above for errors.')
    }
  }
}
