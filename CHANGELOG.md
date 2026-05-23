# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
intends to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Each release section corresponds to a tag on `main`. The CLI is released
independently via `cli-vX.Y.Z` tags; library packages share the repository's
overall version history.

## [Unreleased]

### Added

- **Runtime type-conformance validation in `@aelastics/store`.** Property
  assignments (`obj.prop = value`), array pushes (`arr.push(value)`), and
  index replacements on entity-typed properties now throw a
  `ValidationError` from `@aelastics/result` when the value's tagged type
  (`@@aelastics/type`) is not a subtype of the property's declared type.
  Subtype substitutability is recognized across schemas via the universal
  `t.System` schema. Validation runs only on user-initiated assignments —
  inverse-property mirror writes bypass the setter and are never
  re-validated. Plain JS objects lacking the `@@aelastics/type` tag are
  rejected. New helper `validateConformance(value, expectedType, path)`
  and 10 unit tests in `libraries/aelastics-store/src/common/`.
- **JSX child-connection validation in `@synthesis/jsx-runtime`.** When a
  child element's `connectionInfo.propName` is not declared on the parent's
  type schema, the renderer throws at render time instead of silently
  skipping the connection. A new opt-in helper, `allowedAsTopLevelElement`,
  lets a JSX tag declare that the missing-propName case is acceptable when
  the parent is a `Namespace` and the child is a `ModelElement` (because
  the child is already in `parent.elements` via `store.newModelElement`).
  BPM's `<Sequence>` uses the helper.
- **`TypeModel.inverses` slot.** `<InverseProperty>` JSX elements now land
  in `TypeModel.inverses: arrayOf(link("InverseProperty"))` instead of the
  semantically wrong `TypeModel.types` slot. Authors of types-metamodel
  JSX files using `<InverseProperty>` see no source change — only the
  resulting graph differs.
- **CLI tarball distribution.** New `pack:tarballs` script in
  `apps/cli/package.json` and `.github/workflows/release-cli.yml`. The
  workflow builds the CLI, packs platform tarballs (Linux x64/arm64,
  macOS x64/arm64, Windows x64), and attaches them to a GitHub Release
  on `cli-v*` tag push or manual `workflow_dispatch`. See
  [Installation](https://AelasticS.github.io/aelastics/docs/cli/installation)
  for download instructions and [CONTRIBUTING.md](CONTRIBUTING.md) for the
  release workflow.
- **CLI test workspace isolation convention.** All `apps/cli/` tests now
  override `HOME` to a unique temp directory and run `synth init` in
  `beforeAll`, removing the dependency on the developer's real `~/.synth/`
  workspace. The pattern is documented in CONTRIBUTING.md.
- **Public-facing root README** with project description, documentation
  links, install pointer, repository layout, and license.

### Changed

- **BPM `Node.parent`** is now `optional(link("Node"))` (was `link("Node")`).
  Breaks an infinite type-walk recursion in `deepCreate` for BPM Sequence
  / Task / etc. Authors who relied on `parent` being non-optional should
  audit their code; previously the property was effectively always-defined
  only because the walk never terminated.
- **BPM `inverseProps(Node, "children", Node, "parent")`** is now declared,
  so pushing into `node.children` automatically sets the pushed element's
  `parent`. Matches the existing convention in `@aelastics/store`'s own
  test suite.
- **CLI installation docs** point to the GitHub Releases tarball path
  instead of `npm install -g @synthesis/cli` (the package is private and
  there is no npm distribution).

### Fixed

- **Pre-existing CLI test failures** (`ns mk`, `cd switches to existing
  namespace`) when run as part of the full suite. Cause was shared
  workspace state across parallel suites and dependence on a pre-initialized
  `~/.synth/`. All 106 CLI tests now pass in any order.

### Removed

- **Auto-generated docs and CLI manifest from version control.**
  `apps/docs/docs/*/api/` (TypeDoc-generated) and
  `apps/cli/oclif.manifest.json` (oclif-generated) are now gitignored.
  The docs CI workflow regenerates them on every deploy and the CLI build
  regenerates the manifest, so the git-committed copies were never the
  consumed artifacts — only noise in diffs.

[Unreleased]: https://github.com/AelasticS/Synthesis/compare/8b82ae4..HEAD
