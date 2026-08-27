# CLI Execution — Execution Plan

Phases are dependency-ordered. Each phase ends green: build + full test
suite pass, and the listed acceptance check works. Docusaurus documentation
is deliberately LAST — internal design docs (this folder) carry the truth
until then.

## Phase 1 — Model manifest + import/export (the foundation)

The `$synth` header and the model gate; prerequisite for all execution.

1. `$synth` header module in `apps/cli/src/models/`:
   types, static literal parser (fast path), writer/updater
   (insert/replace the exported constant in file text).
2. Model loader service: esbuild transpile (pragma `createExprNode`) →
   dynamic import → render into a `ModelStore`; module resolution against
   CLI-shipped metamodels + installed tx packages. esbuild becomes a CLI
   runtime dependency (bundles fine into the release tarball).
3. Namespace mapping: nested directories (`com.example` →
   `models/com/example/`); adapt `ns` commands and ref resolution.
4. Rework `model import` (validation render, dependency check, header
   stamping, copy), `model export` (verbatim copy out),
   `model ls`/`show` (header-driven), `model validate` (real render +
   conformance), `doctor` (header/reference integrity, `--fix`).
5. Tests: unit (header parse/write) + command tests using the
   eer-to-rel-to-text example's `source-model.tsx` as fixture.

Acceptance: import the example EER source model into a workspace;
`model ls/show` display header metadata; `model validate` passes; doctor
detects a hand-broken reference; export round-trips.

## Phase 2 — Transformation manifest + single-step `tx run`

1. Manifest reader (supports BOTH `synth.json` and `package.json#synth`
   until the location decision lands); `tx install`/`tx show` use it and
   verify claims against the loaded class.
2. Package the example EER→Relational transformation (with its metamodel,
   decision model, binding model) as an installable fixture package —
   this is also the reference for transformation authors.
3. `tx run`: closure loading per design §7, M2M execution, `exportToJSX`
   output with provenance header; M2T execution via engine `generate`.
4. Explicit `--config` loading + nominal & structural validation.

Acceptance: install the fixture package into a fresh workspace, import the
source model, `tx run eer-to-relational --in ... --config ... --out ...`
produces a relational model file with provenance header.

## Phase 3 — Default configuration flow

1. Implicit `SourceModelToDefaultConfigurationModel` when `--config`
   omitted on a decision-based tx; print the generated choices;
   `--save-config`.
2. Real `config init` (same generation, saved); `config show` renders
   choices from the model.

Acceptance: run the fixture tx without `--config`; defaults announced;
result identical to explicit default config; `config init` + edit + run
with edited config changes the output (e.g. naming convention).

## Phase 4 — Chaining `run` + surface cleanup

1. Multi-step `run` with manifest type-checking, in-memory hand-off,
   `--keep-intermediates`, positional `--config` matching, M2T-last rule.
2. Remove `m2t`; rename `example list` → `ls`; `run` resolves
   pipelines → transformations.

Acceptance: `synth run eer-to-relational rel-to-sql-ddl --in ... --out-dir
./gen` reproduces the example showcase output from workspace content.

## Phase 5 — Pipelines

`--save-as`, `pipelines/<name>.json`, `pipeline ls/show/rm/edit`,
override semantics, save-time + run-time validation.

Acceptance: save the Phase-4 chain, replay by name on another input model
via `--in` override.

## Phase 6 — Interactive layer

Candidate provider module; `@inquirer/prompts` pickers for missing
tx/`--in`/`--config` (TTY-guarded); type-filtered lists; interactive
import offer for unknown refs/paths.

Acceptance: bare `synth run` in a TTY walks through picker flow and
executes; same invocation piped/CI errors cleanly.

## Phase 7 — Documentation + release (LAST)

1. Rewrite `apps/docs/docs/cli/*`: drop "not implemented" warnings,
   document the full command surface (incl. cd, example, tx subcommands,
   pipeline), correct workspace layout, model format + header, config
   flow, chaining, pipelines, interactivity.
2. Resolve the manifest-location decision in `packaging-transformations.md`.
3. CHANGELOG, version bump, tag `cli-v0.1.0`, GitHub release via the
   (already fixed) tarball workflow; smoke-test per CONTRIBUTING.

## Deferred review follow-ups (from the Phase 1 code review)

Consciously postponed, with the phase where each becomes relevant:

- **Header fast path via TS AST** — the hand-rolled literal parser anchors on
  the first textual `export const $synth =`; a file containing that string in
  a comment/template literal would confuse it. A `ts.createSourceFile` parse
  would be robust and would also delete the second string-scanner used by the
  writer. Revisit if headers ever misparse in practice (typescript would need
  to become a runtime dep).
- **Metamodel derivation from the rendered store** — Phase 2: once tx
  manifests land, derive `header.metamodel` authoritatively from the rendered
  root element's schema instead of the import-scan heuristic.
- **Typed DanglingReferenceError in @synthesis/jsx-runtime** — Phase 6
  prerequisite: the interactive "import the missing dependency?" offer needs
  the missing ref as data; today import classifies it by matching the engine's
  error message text.
- **esbuild transpile cache** — key by content hash in a stable cache dir to
  skip repeat transpiles of unchanged models (matters once tx run loads many
  models per invocation).
- **Concurrent file reads** in doctor and model ls; subtree-rooted walk for
  `model ls --ns`; both matter only for large workspaces.
- **Uniform --json exit-code contract** — model commands now exit non-zero on
  JSON errors; ns/config/tx commands still use the old exit-0 convention.
  Unify in one sweep (Phase 4 surface cleanup).

## Open items carried alongside

- Transformation manifest location (`synth.json` vs `package.json#synth`)
  — needed by end of Phase 2 for the writer; reader tolerates both.
- Push of `main` + `design/synchronizing-transformations` to origin is
  still pending (session lacks push permission).
