# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
intends to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Each release section corresponds to a tag on `main`. The CLI is released
independently via `cli-vX.Y.Z` tags; library packages share the repository's
overall version history.

## [Unreleased]

### Changed

- **CLI (breaking): `synth.json` is the only transformation manifest
  location.** The fallback that read a `synth` object from `package.json`
  is removed. A package that still carries a `synth` block fails
  manifest loading with a migration hint pointing at `synth.json`.
  Decision recorded in `design/engine-follow-ups.md`.
- **Documentation site reorganized around two audience tracks.** The six
  parallel sections are replaced by a **User Guide** for CLI consumers
  (installation → quick start → concepts → tutorial → guides → command
  reference, including a new end-to-end tutorial) and a **Developer Guide**
  for transformation authors (overview → concepts → guides, with reserved
  Tutorial and Examples positions). The three `@aelastics/*` libraries keep
  standalone documentation under a Libraries menu. Titles avoid the "eDSL"
  abbreviation in favor of "Synthesis transformation language". All
  previously published URLs redirect to their new locations
  (`@docusaurus/plugin-client-redirects`).
- **Monorepo architecture documentation moved out of the site** to
  [design/architecture.md](design/architecture.md); it is contributor
  material, now linked from the README and CONTRIBUTING instead of shown as
  user documentation. The duplicated Contributing page on the site was
  dropped in favor of the repository's CONTRIBUTING.md.

## [cli-v0.1.0] - 2026-08-28

### Added

- **The `synth` CLI executes transformations end to end.** The former stub
  surface (`run`, `m2t`, `config init`) is replaced by a working execution
  path over a real workspace model format:
  - **TSX model workspace with `$synth` headers.** Workspace models are
    `.tsx` JSX modules carrying a tool-maintained `$synth` header (kind,
    metamodel, references, provenance, authorship, dates). `model import`
    is a validation gate (transpile and render, reference check, header
    stamping), so everything in the workspace was loadable when it
    entered; `model export` round-trips verbatim; `doctor` re-checks the
    invariant workspace-wide and `doctor --fix` re-derives headers.
  - **Nested namespaces.** `com.example` maps to `models/com/example/`;
    refs and disk locations are mechanically derivable from each other,
    so the ref is never stored and cannot drift.
  - **Deletion dependency graph.** `model rm` and `namespace rm` are
    refused while other models transitively reference the target (the
    dependents are listed); `--cascade` deletes the reverse-dependency
    closure.
  - **Transformation manifests.** `synth.json` at the package root (or a
    `synth` object in `package.json`) declares kind (`m2m`/`m2t`),
    entry/exportName, source/target metamodels, and the packaged parts
    (metamodel modules, decision model, binding model; variability is
    derived from their presence). `transformation install` validates the
    manifest with per-field errors; `transformation show` reads
    issues, options, and defaults from the decision model.
  - **`transformation run`** executes single steps and ad-hoc chains:
    m2m results are written back as workspace models with provenance
    headers and re-validated through the import gate; m2t generates files
    under `--out-dir`. Chains are type-checked from the manifests before
    execution, hand intermediates over in memory (persistable with
    `--keep-intermediates`), and only the last step may be m2t.
  - **Configuration flow.** `config init` generates the default
    configuration as an editable workspace model; `transformation run
    --config` validates it nominally (stamped tx/version, binding model,
    source model) and structurally (issues, options, element resolution);
    partial configurations fall back to announced, materialized defaults;
    `--save-config` persists generated defaults.
  - **Pipelines as named processes.** `pipeline mk/run/ls/show/rm/edit`
    plus `transformation run --save-as`: a pipeline stores steps only
    (plain JSON at `pipelines/<name>.json`, no data bindings, no stored
    consents); `pipeline mk` validates statically with the same chain
    checks as the execution pre-flight; `pipeline run` requires `--in`
    and takes the identical request path as `transformation run`;
    `transformation uninstall` is refused while a saved pipeline lists
    the transformation as a step.
  - **Interactive layer.** In a terminal, `transformation run`,
    `pipeline run`, and `config init` open pickers for missing values
    (transformation, input model, configuration consent, pipeline,
    `--for`) and offer to import a `.tsx` path given instead of a ref;
    piped, scripted, `--json`, `--quiet`, and CI invocations keep the
    strict errors byte-identical. Dynamic shell completion completes
    values (transformation names, refs, pipeline names, namespaces)
    context-aware via the `synth completions` contract and bash/zsh
    wrapper scripts under `apps/cli/scripts/completion/`.
  - **Executable smoke suite.** `rushx smoke` in `apps/cli` runs the
    end-to-end user journey through the real binary in an isolated HOME.
- **Rewritten CLI documentation.** `apps/docs/docs/cli/` now documents the
  delivered CLI (workspace and model format, full command reference with
  exit codes and the consent policy, configuration and pipeline guides,
  the real transformation manifest, shell completion setup); the
  "not yet implemented" warnings are gone.
- **Runtime type-conformance validation in `@aelastics/store`.** Property
  assignments (`obj.prop = value`), array pushes (`arr.push(value)`), and
  index replacements on entity-typed properties now throw a
  `ValidationError` from `@aelastics/result` when the value's tagged type
  (`@@aelastics/type`) is not a subtype of the property's declared type.
  Subtype substitutability is recognized across schemas via the universal
  `t.System` schema. Validation runs only on user-initiated assignments;
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
  JSX files using `<InverseProperty>` see no source change; only the
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

- **BREAKING (CLI): decisions are never applied implicitly.** A
  decision-based transformation runs only with an explicit `--config <ref>`
  or the `--default-configs` consent flag; with neither, the run aborts
  (exit 2) before any engine work with a message teaching both paths. The
  previous behavior (silently generating and applying default
  configurations) is gone. In chains and pipelines, `--config` binds to
  step 1 only; every other decision-based step takes `--default-configs`
  or the stepwise path (`--keep-intermediates` + `config init` against
  the kept intermediate).
- **BREAKING (CLI): canonical command names with typing aliases.** Every
  resource topic has a full-word canonical name (`transformation`,
  `namespace`, `pipeline`, `model`, `config`, `workspace`, `example`)
  with `tx`, `ns`, and `pl` as two-letter typing aliases of the first
  three. `example list` is renamed `example ls`.
- **Uniform `--json` failure contract (CLI).** Every command failing in
  `--json` mode prints a machine-readable `{ "error": ... }` object as its
  only stdout AND exits non-zero; no command prints an error object with
  exit 0.
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
- **`tx.test.ts` and `top-level.test.ts` now isolate `HOME` too.** Both
  suites still ran against the developer's real `~/.synth/`, so `synth init
  --path` and `tx install` rewrote the real workspace config and leaked
  state between runs (first `tx install` failed with "already installed"
  on every second run). They now follow the same isolated-HOME convention
  as the other suites.
- **`oclif pack tarballs` actually works now.** The script previously died
  looking for `npm-shrinkwrap.json`: oclif's npm install step cannot
  resolve Rush `workspace:*` dependencies. `pack:tarballs` now runs
  `apps/cli/config/pack-tarballs.mjs`, which packs the CLI's transitive
  workspace dependencies into `vendor/*.tgz`, rewrites `package.json` to
  `file:` specifiers, generates the lockfile oclif needs, and restores
  everything afterwards. Verified end-to-end: the linux-x64 tarball runs
  `synth init`, `synth doctor`, and the `eer-to-rel-to-text` example in a
  clean environment with its bundled Node.
- **`@aelastics/store` imported `ServiceError` via a relative path escaping
  the package** (`'../../../aelastics-result'` in the server-proxy module).
  This only resolved inside the monorepo because pnpm symlinks point back
  into `libraries/`; in any packaged installation the import crashed at
  require time. Now imports `@aelastics/result` like the rest of the code.

### Removed

- **BREAKING (CLI): `synth m2t`.** Whether a run is model-to-model or
  model-to-text is decided by the transformation manifest's `kind`;
  `transformation run` covers both. No deprecation alias: the command was
  never published.
- **BREAKING (CLI): top-level `synth run`.** Replaced by
  `transformation run` (which also chains) and `pipeline run`: a verb that
  guesses its argument's resource type would need resolution-order rules
  and shadow warnings; the two-verb surface needs neither.
- **Auto-generated docs and CLI manifest from version control.**
  `apps/docs/docs/*/api/` (TypeDoc-generated) and
  `apps/cli/oclif.manifest.json` (oclif-generated) are now gitignored.
  The docs CI workflow regenerates them on every deploy and the CLI build
  regenerates the manifest, so the git-committed copies were never the
  consumed artifacts, only noise in diffs.

[Unreleased]: https://github.com/AelasticS/Synthesis/compare/cli-v0.1.0..HEAD
[cli-v0.1.0]: https://github.com/AelasticS/Synthesis/compare/8b82ae4..cli-v0.1.0
