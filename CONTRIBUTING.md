# Contributing to Synthesis

Thank you for your interest in contributing to Synthesis! This document
explains how to set up a working copy, how changes are built, tested,
and submitted, and how releases are made.

## Ways to Contribute

- Report bugs
- Suggest features or improvements
- Improve documentation
- Add tests or examples
- Submit code contributions

## Before You Start

Synthesis is evolving quickly and its public surfaces are still moving.
For small, obvious fixes (typos, documentation, clear bugs), open a
pull request directly. For anything larger, please
[open an issue](https://github.com/AelasticS/Synthesis/issues) first
describing the change you have in mind, so we can agree on whether and
how it fits before you invest the effort. A maintainer reviews every
pull request.

## Getting Started

1. **Fork the repository** on
   [GitHub](https://github.com/AelasticS/Synthesis) and clone your fork
   (replace `YOUR_USERNAME` with your GitHub username):

   ```bash
   git clone https://github.com/YOUR_USERNAME/Synthesis.git
   cd Synthesis
   ```

2. **Install Rush** globally (if not already installed):

   ```bash
   npm install -g @microsoft/rush
   ```

3. **Install dependencies and build**:

   ```bash
   rush update
   rush build
   ```

   Run `rush update` again whenever you pull changes that touch
   `rush.json` or any `package.json`.

4. **Create a topic branch** off `main`:

   ```bash
   git checkout -b feat/your-change main
   ```

   All work happens on short-lived topic branches off `main`
   (`feat/`, `fix/`, `docs/`), merged back when green. There is no
   long-lived integration branch.

### Prerequisites

- Node.js >= 22 (rush.json `nodeSupportedVersionRange` is authoritative)
- pnpm (managed by Rush automatically)
- Git

The package layering, dependency graph, and the rules behind them are
documented in [design/architecture.md](design/architecture.md).

## Building and Testing

`rush build` builds every package, including the documentation site.
There is **no repository-wide test command**; the test ladder runs per
package:

```bash
rush build
(cd libraries/synthesis && rushx test)
(cd apps/cli && rushx test && rushx smoke)
# every example and template package with a test script:
# examples/eer-database-suite/*, examples/tutorial/eer-* and sql-*,
# examples/workflow/*, templates/transformation-template
(cd examples/tutorial/eer-tutorial-basic && npm test)   # ...and so on
(cd apps/docs && rushx build)
```

The CLI's `rushx smoke` runs the composed end-to-end user journey
(workspace, import gate, execution, configurations, chaining,
pipelines, completion) through the real binary in an isolated HOME.
Each example package's `test` script runs the shared smoke harness,
and several add an executable verification, through the real CLI.

### CLI tests must use an isolated workspace

Any test in `apps/cli/` that invokes the `synth` binary via `runCli`
**must** override `HOME` to a unique temp directory and run `synth init`
against it in `beforeAll`. Otherwise the test reads and writes the
developer's real `~/.synth/` workspace, fails on machines where the
workspace has not been initialized (e.g. CI), and corrupts state for
parallel test suites sharing the same `HOME`.

Pattern (see `apps/cli/src/commands/ns/__tests__/ns.test.ts`):

```ts
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runCli } from '../../../test-utils/run-cli.js'

let testHome: string

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-<suite>-test-'))
  await runCli(['init'], { home: testHome })
})

afterAll(() => {
  rmSync(testHome, { recursive: true, force: true })
})

it('does something', async () => {
  await runCli(['ns', 'mk', 'com.example'], { home: testHome })
})
```

## Code Guidelines

- Follow the existing style of the package you are working in; ESLint
  (`@rushstack/eslint-config`) is enforced on build.
- Exported types, functions, and classes carry JSDoc comments.
- New code comes with Jest tests; keep `describe`/`it` blocks clear and
  well named.
- Update the relevant `README.md` and documentation pages when behavior
  changes; the docs describe what exists.

## Submitting Changes

1. **Rebase on the latest main**:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Build and run the tests** for the packages your change touches
   (see [Building and Testing](#building-and-testing)); run the full
   ladder for changes that cross packages.

3. **Commit** following
   [Conventional Commits](https://www.conventionalcommits.org/), with
   the scope naming the package or area touched, as in the project's
   history:

   ```
   feat(cli): transformation run accepts --param
   fix(workflow-to-bpmn): loop back edge carries the negated guard
   docs(tutorial): part 4 links its companion package
   ```

4. **Open a pull request** against `main` with a clear title, a
   description of what changed and why, and a reference to the related
   issue if there is one.

## Releasing the CLI

The `synth` CLI is distributed as platform tarballs attached to a
GitHub Release. The repository is **not** published to npm. The release
workflow lives at `.github/workflows/release-cli.yml` and is triggered
manually (`workflow_dispatch`) or by pushing a tag of the form `cli-vX.Y.Z`.
Each platform bundle is packed and smoke-tested on a runner of its own
platform, because the bundled `esbuild` binary is platform specific.

To try the release build without releasing, run the workflow manually
from the Actions tab, pick your branch and leave the tag empty. The run
packs and smoke-tests all five bundles and keeps them as run artifacts;
it creates no release. Locally, `rushx pack:tarballs --targets <target>`
followed by `rushx smoke:bundle --target <target>` in `apps/cli` does
the same for your own platform (on Windows, 7-Zip must be on `PATH`).
Build the CLI and the examples first
(`rush build --to @aelastics/synthesis-cli --to path:examples`): every
example ships in the bundle under `synth/examples/`.

Maintainer workflow:

1. **Run the full ladder** (see
   [Building and Testing](#building-and-testing)). All of it must be
   green before anything is tagged.
2. **Bump the version** in `apps/cli/package.json` (semantic versioning).
3. **Update `CHANGELOG.md`** at the repo root with the new version's
   entry under the conventional headings (Added / Changed / Fixed /
   Removed). Use the conventional-commits log between the previous tag
   and `HEAD` as input. Also update the documentation download page
   (`apps/docs/docs/user-guide/getting-started/download.md`): the
   version number and the per-platform asset links.
4. **Commit** the version bump and changelog:

   ```bash
   git commit -am "chore(cli): release v0.2.0"
   ```

5. **Tag** the commit and push:

   ```bash
   git tag cli-v0.2.0
   git push && git push --tags
   ```

   The tag push triggers the release workflow.
6. **Watch the workflow** in the GitHub Actions tab. One job per
   platform runs `rush build`, packs that platform's tarball and
   smoke-tests it: `synth --version`, `synth init`, a TSX transpile
   with the bundled `esbuild`, and every bundled example installed,
   imported and run the way the user guide shows. When all five pass, a
   last job creates the GitHub Release with the tarballs attached.
7. **Smoke test** the release by downloading the tarball for your
   platform from the new GitHub Release, extracting it, adding
   `synth/bin` to `PATH`, and running:

   ```bash
   synth --version
   synth doctor
   ```

8. **Rollback** if anything is wrong: delete the GitHub Release and the
   tag. Users on the previous tag are unaffected. Fix the issue and
   bump to the next patch version; do not re-publish under the same
   tag.

## Reporting Issues

For bug reports, include:

- Node.js version (`node --version`) and operating system
- Minimal code to reproduce the issue
- Expected and actual behavior
- Error messages or stack traces

For feature requests, include the use case and an example of how the
feature would be used.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## License

By contributing to Synthesis, you agree that your contributions will be
licensed under the Apache License 2.0.

Thank you for contributing!
