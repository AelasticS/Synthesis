import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { Command } from 'commander'
import { examplesRegistry } from '@synthesis/examples'
import type { RunResult } from '@synthesis/runner'

/**
 * Registers the `example` command group on the given parent commander instance.
 *
 * The CLI owns all I/O: it reads the user's flags, walks the
 * `examplesRegistry` from `@synthesis/examples`, invokes `Runnable.run()` for
 * execution, and writes returned artifacts to disk. `@synthesis/examples` and
 * `@synthesis/runner` stay pure (no FS access).
 */
export function registerExampleCommand(parent: Command): void {
  const group = parent
    .command('example')
    .description('Discover and run bundled Synthesis examples')

  group
    .command('list')
    .description('List all available examples')
    .action(() => {
      const runnables = examplesRegistry.list()
      if (runnables.length === 0) {
        console.log('No examples registered.')
        return
      }
      const idWidth = Math.max(...runnables.map((r) => r.id.length))
      for (const r of runnables) {
        console.log(`  ${r.id.padEnd(idWidth)}  ${r.name}`)
      }
    })

  group
    .command('describe <id>')
    .description('Show details of a single example')
    .action((id: string) => {
      const r = examplesRegistry.get(id)
      if (!r) {
        console.error(`No example with id "${id}".`)
        console.error(`Run 'synth example list' to see available ids.`)
        process.exit(1)
      }
      console.log(`id:          ${r.id}`)
      console.log(`name:        ${r.name}`)
      console.log(`description: ${r.description}`)
    })

  group
    .command('run <id>')
    .description('Execute an example and write its artifacts to disk')
    .option('--out <dir>', 'output directory for artifacts', 'out')
    .action(async (id: string, options: { out: string }) => {
      const r = examplesRegistry.get(id)
      if (!r) {
        console.error(`No example with id "${id}".`)
        console.error(`Run 'synth example list' to see available ids.`)
        process.exit(1)
      }
      console.log(`Running example: ${r.name}`)
      try {
        const result = await r.run()
        await writeArtifacts(result, options.out, id)
        console.log(
          `Done. ${result.artifacts.length} artifact(s) written to ${path.resolve(options.out, id)}/`
        )
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`Example failed: ${msg}`)
        process.exit(1)
      }
    })
}

async function writeArtifacts(
  result: RunResult,
  outDir: string,
  exampleId: string
): Promise<void> {
  const target = path.join(outDir, exampleId)
  await fs.mkdir(target, { recursive: true })
  for (const a of result.artifacts) {
    const filePath = path.join(target, a.name)
    await fs.writeFile(filePath, a.content, 'utf8')
    console.log(`  wrote ${path.relative(process.cwd(), filePath)}`)
  }
}
