/**
 * Pack self-contained platform tarballs for the synth CLI with oclif.
 *
 * `oclif pack tarballs` installs production dependencies with npm inside a
 * temporary workspace, which cannot resolve Rush "workspace:*" dependencies
 * (the @synthesis/* and @aelastics/* packages are not published to npm).
 *
 * This script therefore:
 *   1. packs every workspace dependency in the CLI's transitive closure into
 *      vendor/*.tgz, stripping workspace deps from their manifests (all
 *      closure members are installed flat at the CLI level, so Node still
 *      resolves imports between them),
 *   2. temporarily rewrites package.json to reference the vendor tarballs
 *      via file: specifiers,
 *   3. generates the package-lock.json that oclif's npm install path needs,
 *   4. runs `oclif pack tarballs`, whose pretarball step packages the
 *      example transformations into synth/examples/ (config/pack-examples.mjs;
 *      added after npm pack, which would drop their node_modules),
 *   5. drops the commit hash oclif puts in the tarball names, so the
 *      download links (synth-v0.3.0-linux-x64.tar.gz) stay stable,
 *   6. restores package.json and removes the temporary files.
 *
 * The CLI and the examples must be built first
 * (rush build --to @aelastics/synthesis-cli --to path:examples).
 *
 * Usage: node config/pack-tarballs.mjs [--targets linux-x64,...]
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { workspaceProjects } from './pack-examples.mjs'

const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const vendorDir = join(cliRoot, 'vendor')
const stageRoot = join(cliRoot, 'tmp', 'vendor-stage')

const DEFAULT_TARGETS = 'linux-x64,linux-arm64,darwin-x64,darwin-arm64,win32-x64'
const targetsArg = process.argv.indexOf('--targets')
const targets = targetsArg === -1 ? DEFAULT_TARGETS : process.argv[targetsArg + 1]

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' })

/** Transitive workspace-dependency closure of the CLI, in BFS order. */
function dependencyClosure(projects, cliPkg) {
  const closure = new Map()
  const queue = Object.keys(cliPkg.dependencies).filter((d) => projects.has(d))
  while (queue.length > 0) {
    const name = queue.shift()
    if (closure.has(name)) continue
    const folder = projects.get(name)
    if (!folder) throw new Error(`workspace dependency ${name} not found in rush.json`)
    closure.set(name, folder)
    const pkg = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf-8'))
    queue.push(...Object.keys(pkg.dependencies ?? {}).filter((d) => projects.has(d)))
  }
  return closure
}

/** Stage a library without its workspace deps and pack it into vendor/. */
function vendorPackage(name, folder) {
  const pkg = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf-8'))
  delete pkg.devDependencies
  delete pkg.scripts
  for (const [dep, spec] of Object.entries(pkg.dependencies ?? {})) {
    if (spec.startsWith('workspace:')) delete pkg.dependencies[dep]
  }
  const stage = join(stageRoot, name.replace('/', '__'))
  mkdirSync(join(stage, 'lib'), { recursive: true })
  cpSync(join(folder, 'lib'), join(stage, 'lib'), { recursive: true })
  writeFileSync(join(stage, 'package.json'), JSON.stringify(pkg, null, 2))
  const tgz = execSync(`npm pack --pack-destination "${vendorDir}"`, { cwd: stage })
    .toString()
    .trim()
    .split('\n')
    .pop()
  return `file:vendor/${tgz}`
}

const pkgJsonPath = join(cliRoot, 'package.json')
const originalPkgJson = readFileSync(pkgJsonPath, 'utf-8')

if (!existsSync(join(cliRoot, 'oclif.manifest.json'))) {
  throw new Error('oclif.manifest.json missing; run `rush build --to @aelastics/synthesis-cli` first')
}

try {
  rmSync(vendorDir, { recursive: true, force: true })
  rmSync(stageRoot, { recursive: true, force: true })
  mkdirSync(vendorDir, { recursive: true })

  const cliPkg = JSON.parse(originalPkgJson)
  // devDependencies are not shipped and their peer ranges (eslint et al.)
  // do not resolve under npm's strict resolver, so drop them for packing.
  delete cliPkg.devDependencies
  const projects = workspaceProjects()
  const closure = dependencyClosure(projects, cliPkg)

  console.log(`Vendoring ${closure.size} workspace packages...`)
  for (const [name, folder] of closure) {
    cliPkg.dependencies[name] = vendorPackage(name, folder)
    console.log(`  ${name} -> ${cliPkg.dependencies[name]}`)
  }
  if (!cliPkg.files.includes('/vendor')) cliPkg.files.push('/vendor')
  // oclif runs this in its staging folder, apps/cli/tmp/synth
  cliPkg.scripts.pretarball = 'node ../../config/pack-examples.mjs examples'
  writeFileSync(pkgJsonPath, JSON.stringify(cliPkg, null, 2))

  // npm's arborist chokes on the pnpm-symlinked node_modules in cliRoot, so
  // generate the lockfile in a clean staging dir and copy it back for oclif.
  console.log('Generating package-lock.json for oclif...')
  const lockStage = join(stageRoot, '__lock')
  mkdirSync(lockStage, { recursive: true })
  writeFileSync(join(lockStage, 'package.json'), JSON.stringify(cliPkg, null, 2))
  cpSync(vendorDir, join(lockStage, 'vendor'), { recursive: true })
  run('npm install --package-lock-only --ignore-scripts --no-audit --no-fund', lockStage)
  cpSync(join(lockStage, 'package-lock.json'), join(cliRoot, 'package-lock.json'))

  run(`npx oclif pack tarballs --targets ${targets}`, cliRoot)

  // oclif names a tarball synth-v<version>-<sha>-<target>.tar.gz
  const distDir = join(cliRoot, 'dist')
  for (const file of readdirSync(distDir)) {
    const stable = file.replace(/^(synth-v[^-]+)-[0-9a-f]{7,}-/, '$1-')
    if (stable !== file) {
      renameSync(join(distDir, file), join(distDir, stable))
      console.log(`  ${file} -> ${stable}`)
    }
  }
} finally {
  writeFileSync(pkgJsonPath, originalPkgJson)
  rmSync(vendorDir, { recursive: true, force: true })
  rmSync(stageRoot, { recursive: true, force: true })
  rmSync(join(cliRoot, 'package-lock.json'), { force: true })
}
