import { Args } from '@oclif/core'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'

export default class TxInit extends BaseCommand {
  static override description = 'Scaffold a new transformation project.'

  static override examples = ['<%= config.bin %> <%= command.id %> eer-to-relational']

  static override args = {
    name: Args.string({
      description: 'Name for the new transformation project.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(TxInit)
    const projectName = args.name
    const projectDir = join(this.savedPwd, projectName)

    // Check if directory already exists
    if (existsSync(projectDir)) {
      this.error(`Directory '${projectName}' already exists.`)
    }

    this.log(`Creating transformation project: ${projectName}`)

    // Create directory structure
    await mkdir(projectDir, { recursive: true })
    await mkdir(join(projectDir, 'src'), { recursive: true })

    // Create package.json
    const packageJson = {
      name: projectName,
      version: '0.1.0',
      description: `Synthesis transformation: ${projectName}`,
      type: 'module',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        test: 'echo "No tests configured" && exit 0'
      },
      keywords: ['synth-transformation'],
      files: ['dist', 'synth.json'],
      devDependencies: {
        typescript: '^5.0.0'
      },
      synth: {
        type: 'transformation',
        entry: 'dist/index.js'
      }
    }
    await writeFile(join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n')

    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    }
    await writeFile(join(projectDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n')

    // Create src/index.ts template
    const indexTs = `/**
 * Synthesis transformation: ${projectName}
 *
 * This is the entry point for your transformation.
 */

export interface TransformationInput {
  // Define your input model type here
}

export interface TransformationOutput {
  // Define your output model type here
}

/**
 * Transform the input model to the output model.
 */
export function transform(input: TransformationInput): TransformationOutput {
  // Implement your transformation logic here
  throw new Error('Not implemented')
}

export default transform
`
    await writeFile(join(projectDir, 'src', 'index.ts'), indexTs)

    this.log('Created:')
    this.log(`  ${projectName}/`)
    this.log(`  ├── package.json`)
    this.log(`  ├── tsconfig.json`)
    this.log(`  └── src/`)
    this.log(`      └── index.ts`)
    this.log('')
    this.log('Next steps:')
    this.log(`  cd ${projectName}`)
    this.log('  npm install')
    this.log('  # Edit src/index.ts to implement your transformation')
    this.log('  synth tx build')
  }
}
