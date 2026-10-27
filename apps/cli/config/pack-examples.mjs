/**
 * Package the example transformations for the CLI bundle.
 *
 * Every Rush project under examples/ with a synth.json becomes
 * <outDir>/<package name>/, ready for `synth transformation install`:
 *   - the example's tracked files except its sources and build setup
 *     (synth.json, README.md, sample/, and folders such as presets/),
 *   - the runtime files of dist/ (no declarations or source maps),
 *   - a package.json without dependencies or scripts,
 *   - node_modules/<metamodel>/ for each workspace package it depends on
 *     (transitively), with the same runtime-only content.
 *
 * Metamodels stay separate packages rather than being bundled into the
 * transformation: sample models import them by name, and every importer
 * must get the same module instance. The @aelastics framework packages
 * are left out; the CLI resolves them to its own instances (see
 * src/support/framework-hooks.ts).
 *
 * The examples must be built first (rush build --to path:examples).
 *
 * Usage: node config/pack-examples.mjs <outDir>
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(cliRoot, '../..')

// Tracked files of an example that are not shipped: sources, test scripts
// and build setup. package.json is rewritten instead of copied.
const NOT_SHIPPED = /^(src|scripts)\/|^tsconfig[^/]*\.json$|^\.gitignore$|^package\.json$/

/** Map workspace package name -> absolute project folder, from rush.json. */
export function workspaceProjects() {
  const rushJson = readFileSync(join(repoRoot, 'rush.json'), 'utf-8')
  const projects = new Map()
  const pairRe = /"packageName":\s*"([^"]+)",\s*"projectFolder":\s*"([^"]+)"/g
  for (const [, name, folder] of rushJson.matchAll(pairRe)) {
    const abs = join(repoRoot, folder)
    // rush.json contains commented-out template entries; keep only real projects
    if (existsSync(join(abs, 'package.json'))) projects.set(name, abs)
  }
  return projects
}

/** The example transformation packages: name -> folder. */
export function exampleProjects(projects = workspaceProjects()) {
  const examples = new Map()
  for (const [name, folder] of projects) {
    if (relative(repoRoot, folder).startsWith('examples') && existsSync(join(folder, 'synth.json'))) {
      examples.set(name, folder)
    }
  }
  return examples
}

const isRuntimeFile = (path) => !/\.d\.[cm]?ts$|\.map$/.test(path)

/** Copy dist/ without declarations and source maps. */
function copyDist(from, to) {
  const dist = join(from, 'dist')
  if (!existsSync(dist)) {
    throw new Error(`${dist} is missing; build the examples first (rush build --to path:examples)`)
  }
  cpSync(dist, join(to, 'dist'), { recursive: true, filter: isRuntimeFile })
}

/**
 * Write a manifest without dependencies, scripts and build fields and
 * return the workspace packages it depended on, minus the framework.
 */
function writeManifest(from, to, projects) {
  const pkg = JSON.parse(readFileSync(join(from, 'package.json'), 'utf-8'))
  const deps = Object.keys(pkg.dependencies ?? {}).filter((d) => projects.has(d) && !d.startsWith('@aelastics/'))
  for (const key of ['dependencies', 'devDependencies', 'scripts', 'typesVersions', 'files']) {
    delete pkg[key]
  }
  mkdirSync(to, { recursive: true })
  writeFileSync(join(to, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)
  return deps
}

/** Package one example into <outDir>/<name>/ and return the metamodels it carries. */
function packExample(name, folder, outDir, projects) {
  const target = join(outDir, name)
  const tracked = execFileSync('git', ['ls-files', '-z', '.'], { cwd: folder })
    .toString()
    .split('\0')
    .filter((f) => f !== '' && !NOT_SHIPPED.test(f))
  for (const file of tracked) {
    mkdirSync(dirname(join(target, file)), { recursive: true })
    cpSync(join(folder, file), join(target, file))
  }
  copyDist(folder, target)

  const queue = writeManifest(folder, target, projects)
  const carried = []
  while (queue.length > 0) {
    const dep = queue.shift()
    if (carried.includes(dep)) continue
    carried.push(dep)
    const depFolder = projects.get(dep)
    const depTarget = join(target, 'node_modules', dep)
    queue.push(...writeManifest(depFolder, depTarget, projects))
    copyDist(depFolder, depTarget)
  }
  return carried
}

/** Package every example into outDir, replacing what was there. */
export function packExamples(outDir) {
  const projects = workspaceProjects()
  const examples = exampleProjects(projects)
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  for (const [name, folder] of examples) {
    const carried = packExample(name, folder, outDir, projects)
    console.log(`  ${name} (${carried.join(', ')})`)
  }
  return examples.size
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outArg = process.argv[2]
  if (outArg === undefined) {
    throw new Error('usage: node config/pack-examples.mjs <outDir>')
  }
  console.log('Packaging examples...')
  const count = packExamples(resolve(outArg))
  console.log(`Packaged ${count} examples into ${resolve(outArg)}`)
}
