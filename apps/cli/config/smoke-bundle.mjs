/**
 * Smoke-test a packed platform bundle on the machine it was built for.
 *
 * Unpacks dist/synth-v<version>-<target>.tar.gz into a temporary folder
 * and, with HOME pointing at an empty folder, checks that:
 *   1. the bundled synth starts and reports the expected platform,
 *   2. the bundle carries the esbuild binary of its own platform only,
 *   3. `synth init` creates a workspace,
 *   4. the bundled esbuild transpiles TSX, as model import does,
 *   5. the bundle carries every example under synth/examples/, and each
 *      one runs with the commands the user guide shows: transformation
 *      install, model import of every sample, and transformation run on
 *      the first sample (with --default-configs when the example is
 *      configuration-based, --out-dir when it is model-to-text). All
 *      examples share one workspace, as they would for a user.
 *
 * Run it on a runner of the target's own platform: the checks execute the
 * bundled Node.js and esbuild binaries.
 *
 * Usage: node config/smoke-bundle.mjs --target win32-x64
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { exampleProjects } from './pack-examples.mjs'

const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(cliRoot, 'dist')

const targetArg = process.argv.indexOf('--target')
const target = targetArg === -1 ? `${process.platform}-${process.arch}` : process.argv[targetArg + 1]
const isWindows = target.startsWith('win32-')

const tarball = readdirSync(distDir).find((f) => f.endsWith(`-${target}.tar.gz`))
if (tarball === undefined) {
  throw new Error(`no bundle for ${target} in ${distDir}; run pack:tarballs first`)
}

const work = mkdtempSync(join(tmpdir(), 'synth-bundle-'))
const home = join(work, 'home')
mkdirSync(home)
// tar runs from the dist folder so the archive name carries no drive letter,
// which GNU tar on Windows would read as a remote host.
execFileSync('tar', ['-xzf', tarball, '-C', work], { cwd: distDir, stdio: 'inherit' })
const bundle = join(work, 'synth')
const env = { ...process.env, HOME: home, USERPROFILE: home, OCLIF_SKIP_NEW_VERSION_CHECK: '1' }

let failures = 0
function check(desc, ok, detail) {
  if (ok) {
    console.log(`  [ok] ${desc}`)
  } else {
    failures++
    console.log(`  [FAIL] ${desc}`)
    if (detail) console.log(detail.replace(/\r\n/g, '\n').replace(/^/gm, '     | '))
  }
}

// Extra `transformation run` arguments an example needs, as its README and
// the user guide's examples page show them.
const RUN_ARGS = {
  'org-to-approval': ['--param', '{"worker":"Judy","sensitivity":2}']
}

/** Run the bundled synth the way a user does, through bin/synth(.cmd). */
function synth(...args) {
  const result = isWindows
    ? // a .cmd file only starts through a shell, which needs the quoting
      spawnSync(
        `"${join(bundle, 'bin', 'synth.cmd')}"`,
        args.map((a) => `"${a.replace(/"/g, '\\"')}"`),
        { env, shell: true, encoding: 'utf-8' }
      )
    : spawnSync(join(bundle, 'bin', 'synth'), args, { env, encoding: 'utf-8' })
  return { status: result.status, out: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

/** Install an example, import its samples and run it on the first one. */
function runExample(examplesDir, name) {
  const dir = join(examplesDir, name)
  const manifest = JSON.parse(readFileSync(join(dir, 'synth.json'), 'utf-8'))
  const steps = []
  const step = (...args) => {
    const result = synth(...args)
    steps.push(`$ synth ${args.join(' ')}`, result.out.trimEnd())
    if (result.status !== 0) throw new Error(`exit ${result.status}`)
  }
  try {
    step('transformation', 'install', dir)
    const samples = readdirSync(join(dir, 'sample')).filter((f) => f.endsWith('.tsx')).sort()
    const refs = samples.map((file) => `${name}/${file.replace(/\.tsx$/, '').replace(/[^A-Za-z0-9_-]/g, '-')}`)
    samples.forEach((file, i) => step('model', 'import', join(dir, 'sample', file), '--as', refs[i]))
    const run = ['transformation', 'run', name, '--in', refs[0], ...(RUN_ARGS[name] ?? [])]
    if (manifest.parts?.decisionModel) run.push('--default-configs')
    if (manifest.kind === 'm2t') {
      const outDir = join(work, 'generated', name)
      step(...run, '--out-dir', outDir)
      if (!existsSync(outDir) || readdirSync(outDir).length === 0) throw new Error('no files generated')
    } else {
      step(...run, '--out', `${name}/out`)
      if (!existsSync(join(home, '.synth', 'models', name, 'out.tsx'))) throw new Error('no output model written')
    }
    check(`${name}: install, import ${samples.length} sample(s), run`, true)
  } catch (err) {
    check(`${name}: install, import, run`, false, `${steps.join('\n')}\n${err.message}`)
  }
}

console.log(`Smoke-testing ${basename(tarball)}`)
try {
  const version = synth('--version')
  check(`synth --version reports ${target}`, version.status === 0 && version.out.includes(` ${target} `), version.out)

  const esbuildDir = join(bundle, 'node_modules', '@esbuild')
  const binaries = existsSync(esbuildDir) ? readdirSync(esbuildDir) : []
  check(
    `bundle carries only @esbuild/${target}`,
    binaries.length === 1 && binaries[0] === target,
    `found: ${binaries.join(', ') || 'none'}`
  )

  const init = synth('init')
  check('synth init creates a workspace', init.status === 0 && existsSync(join(home, '.synth', 'config.json')), init.out)

  const node = join(bundle, 'bin', isWindows ? 'node.exe' : 'node')
  const script =
    "import('esbuild').then(async (e) => { const r = await e.transform('const a = <b x={1} />', { loader: 'tsx' }); process.stdout.write(r.code) })"
  const transpile = spawnSync(node, ['-e', script], { cwd: bundle, env, encoding: 'utf-8' })
  check(
    'bundled esbuild transpiles TSX',
    transpile.status === 0 && transpile.stdout.includes('React.createElement'),
    `${transpile.stdout}${transpile.stderr}`
  )

  const examplesDir = join(bundle, 'examples')
  const bundled = existsSync(examplesDir) ? readdirSync(examplesDir).sort() : []
  const expected = [...exampleProjects().keys()].sort()
  check(
    `bundle carries the ${expected.length} examples`,
    bundled.join() === expected.join(),
    `expected: ${expected.join(', ')}\nfound: ${bundled.join(', ') || 'none'}`
  )
  for (const name of bundled) {
    runExample(examplesDir, name)
  }
} finally {
  rmSync(work, { recursive: true, force: true })
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`)
  process.exit(1)
}
console.log('All checks passed')
