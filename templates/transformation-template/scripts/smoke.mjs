/**
 * Generic smoke test for an example transformation package. Each
 * example's `test` script runs it from the package directory:
 *
 *   node scripts/smoke.mjs
 *
 * The script expects the package to be built (rush build does that) and
 * exercises the full CLI loop in an isolated workspace: init, import
 * every model in sample/, transformation install, and one run against
 * the first sample (with --default-configs when the package is
 * decision-based; with --out-dir when it is m2t). It fails loudly if
 * any step fails or no output is produced.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
// Resolved through the package's own node_modules link, so the script
// works wherever the package is checked out, as long as @synthesis/cli
// is a (dev) dependency.
const cliBin = join(pkgDir, 'node_modules', '@synthesis', 'cli', 'bin', 'run.js')
if (!existsSync(cliBin)) {
  console.error(`@synthesis/cli not found at ${cliBin}; add it as a devDependency and run rush update`)
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(join(pkgDir, 'synth.json'), 'utf-8'))
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8'))
const txName = typeof manifest.name === 'string' && manifest.name !== '' ? manifest.name : pkg.name

if (!existsSync(join(pkgDir, 'dist'))) {
  console.error(`${txName}: dist/ is missing; build the package first (rush build -t ${pkg.name})`)
  process.exit(1)
}

const home = mkdtempSync(join(tmpdir(), 'synth-example-smoke-'))
const cli = (args) =>
  execFileSync('node', [cliBin, ...args], { env: { ...process.env, HOME: home }, stdio: 'pipe' }).toString()

try {
  cli(['init'])
  cli(['namespace', 'mk', 'demo'])

  const samples = readdirSync(join(pkgDir, 'sample')).filter((f) => f.endsWith('.tsx'))
  if (samples.length === 0) {
    throw new Error('no sample model found in sample/')
  }
  const refs = samples.map((file) => {
    const ref = `demo/${file.replace(/\.tsx$/, '')}`
    cli(['model', 'import', join(pkgDir, 'sample', file), '--as', ref])
    return ref
  })

  cli(['transformation', 'install', pkgDir])

  const runArgs = ['transformation', 'run', txName, '--in', refs[0]]
  if (manifest.parts && manifest.parts.decisionModel) {
    runArgs.push('--default-configs')
  }

  if (manifest.kind === 'm2t') {
    const outDir = join(home, 'generated')
    cli([...runArgs, '--out-dir', outDir])
    const files = readdirSync(outDir)
    if (files.length === 0) {
      throw new Error('m2t run produced no files')
    }
    console.log(`${txName}: OK (generated ${files.join(', ')})`)
  } else {
    cli([...runArgs, '--out', 'demo/smoke-out'])
    if (!existsSync(join(home, '.synth', 'models', 'demo', 'smoke-out.tsx'))) {
      throw new Error('m2m run produced no output model')
    }
    console.log(`${txName}: OK (wrote demo/smoke-out)`)
  }
} catch (err) {
  if (err.stderr) {
    console.error(err.stderr.toString())
  }
  console.error(`${txName}: SMOKE FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
