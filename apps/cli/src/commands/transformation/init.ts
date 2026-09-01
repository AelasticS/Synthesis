import { Args } from '@oclif/core'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'

export default class TransformationInit extends BaseCommand {
  static override aliases = ['tx:init']

  static override description = 'Scaffold a new transformation project.'

  static override examples = ['<%= config.bin %> <%= command.id %> eer-to-relational']

  static override args = {
    name: Args.string({
      description: 'Name for the new transformation project.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(TransformationInit)
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

    // Create package.json. The transformation manifest lives in synth.json;
    // package.json carries only npm metadata.
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
      }
    }
    await writeFile(join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n')

    // Create synth.json, the manifest that 'transformation install' validates. The scaffold
    // is installable as-is; the metamodel placeholders are for the author
    // to replace.
    const synthJson = {
      kind: 'm2m',
      entry: './dist/index.js',
      exportName: 'MyTransformation',
      source: { metamodel: 'my-source-metamodel' },
      target: { metamodel: 'my-target-metamodel' }
    }
    await writeFile(join(projectDir, 'synth.json'), JSON.stringify(synthJson, null, 2) + '\n')

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

    // Create src/index.ts template. The exported class name must match
    // synth.json's exportName; 'transformation run' loads exactly that export.
    const indexTs = `/**
 * Synthesis transformation: ${projectName}
 *
 * This is the entry point for your transformation. The class name matches
 * the 'exportName' declared in synth.json.
 */

export class MyTransformation {
  // The store holding the source model, provided by the runner.
  public constructor(private readonly store: unknown) {}

  /**
   * Transform the input model root into the output model root.
   */
  public transform(input: unknown): unknown {
    // Implement your transformation logic here
    throw new Error('Not implemented')
  }
}
`
    await writeFile(join(projectDir, 'src', 'index.ts'), indexTs)

    this.log('Created:')
    this.log(`  ${projectName}/`)
    this.log(`  ├── package.json`)
    this.log(`  ├── synth.json`)
    this.log(`  ├── tsconfig.json`)
    this.log(`  └── src/`)
    this.log(`      └── index.ts`)
    this.log('')
    this.log('Next steps:')
    this.log(`  cd ${projectName}`)
    this.log('  npm install')
    this.log('  # Edit src/index.ts to implement your transformation')
    this.log('  synth transformation build')
  }
}
