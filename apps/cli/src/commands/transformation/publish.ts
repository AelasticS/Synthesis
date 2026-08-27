import { Flags } from '@oclif/core'
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'

export default class TransformationPublish extends BaseCommand {
  static override aliases = ['tx:publish']

  static override description = 'Publish the transformation to npm.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --access public',
    '<%= config.bin %> <%= command.id %> --tag beta'
  ]

  static override flags = {
    access: Flags.string({
      description: 'Package access level (public or restricted).',
      options: ['public', 'restricted']
    }),
    tag: Flags.string({
      description: 'Tag to publish with (e.g., beta, next).',
      default: 'latest'
    }),
    'dry-run': Flags.boolean({
      description: 'Perform a dry run without actually publishing.'
    })
  }

  public async execute(): Promise<void> {
    const { flags } = await this.parse(TransformationPublish)
    const cwd = this.savedPwd

    // Check for package.json
    const packageJsonPath = join(cwd, 'package.json')
    if (!existsSync(packageJsonPath)) {
      this.error('No package.json found in current directory. Run this command from a transformation project root.')
    }

    // Build the npm publish command
    const args: string[] = ['npm', 'publish']

    if (flags.access) {
      args.push('--access', flags.access)
    }

    if (flags.tag) {
      args.push('--tag', flags.tag)
    }

    if (flags['dry-run']) {
      args.push('--dry-run')
      this.log('Performing dry run...')
    } else {
      this.log('Publishing transformation to npm...')
    }

    try {
      execSync(args.join(' '), {
        cwd,
        stdio: 'inherit'
      })

      this.log('')
      if (flags['dry-run']) {
        this.log('Dry run completed successfully.')
      } else {
        this.log('Published successfully!')
      }
    } catch {
      this.error('Publish failed. Check the output above for errors.')
    }
  }
}
