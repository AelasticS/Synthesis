# Consolidation execution plan

Tracks the execution of [consolidation.md](./consolidation.md). Update the
checkboxes and the stage log as work proceeds; this file is the cross-session
source of truth for where the effort stands.

Working context: branch `feat/consolidation`, worktree
`/home/sinisa/Projects/Synthesis-wt-consolidation`. Merge to main with
`--no-ff` when all stages are green. Do not push; the user pushes.

Conventions binding for all stages: no em dashes in user-facing text; say
"configuration-based", never "decision-based"; JSX notation is the authoring
style (never present createExprNode calls as the way to write templates); no
AI attribution in commits or files.

## Gates

Run after every stage; a stage is done only when all pass.

- `rush build` (from the worktree root; run `rush update` once first, the
  worktree has its own install state). Note: rush exits 1 whenever any
  operation has warnings, and @synthesis/docs has pre-existing typedoc
  warnings (verified identical on main), so the pass criterion is the
  "Operations succeeded" line, not the exit code.
- apps/cli: `rushx test` and `rushx smoke`. Baseline before stage 3:
  441 tests, 86 smoke checks. Stage 3 deletes the example commands, so
  record the new baseline in the stage log when it lands.
- every example package: `rushx test` (the smoke harness)
- apps/docs: `rushx build` (enforces the broken-link check). Restart any
  Docusaurus dev server after config or dependency changes; clear
  `.docusaurus` if a phantom broken link appears.

## Stages

### Stage 0: record the agreement
- [x] design/consolidation.md and this plan committed on the branch

### Stage 1: physical consolidation of @aelastics/synthesis
Goal: one package, everything compiles, behavior identical. Consumer
imports are rewritten mechanically to temporary compatibility subpaths
that mirror the pre-merge package layout (./jsx-runtime, ./metamodel-core,
./engine, ./decision-framework, ./metamodels/types); the final namespaced
surface comes in stage 2. Compatibility subpaths were chosen over a root
barrel because the schema `Model` and the JSX `Model` collide at a root,
and prefix replacement over subpaths is collision-free.
- [x] create libraries/synthesis with src/jsx-runtime/, src/metamodel-core/,
      src/engine/, src/decision-framework/, src/metamodels/types/ moved from
      the five source packages (git mv to preserve history)
- [x] compatibility subpath exports and typesVersions mirroring the old
      package layout; root index exports nothing
- [x] merge tsconfig/jest/heft config; keep `.testx` files excluded as today
- [x] move bpm (src + its two engine tests) into the engine test tree as a
      fixture (src/engine/test/bpm-metamodel); delete relational v1/v2
      variant files and the two disabled `.testx` files that were their only
      consumers; rewire the relational barrel and `./relational/model` to
      the surviving (legacy) files, keeping the model-legacy and
      components-legacy subpaths temporarily; the engine's ModelStore test
      fixtures now use the internal bpm metamodel instead of eer, so the
      merged library has no domain-metamodel dependency
- [x] rush.json: remove the four old projects, add libraries/synthesis
- [x] rewrite all imports of the old package names across libraries/,
      apps/, examples/, templates/ to the compatibility subpaths
      (three parallel subagents on disjoint trees; verified by
      fixed-string sweeps). Includes the CLI emit sites (generated models
      now import @aelastics/synthesis/jsx-runtime, generated configuration
      models the decision-framework compatibility paths) and a
      deriveMetamodel extension so @aelastics/synthesis/metamodels/* still
      counts as a metamodel while other @aelastics/* imports are support
      packages
- [x] gates

### Stage 2: the namespaced export surface
- [x] add subpath exports: ./jsx, ./metamodel, ./store, ./m2m, ./m2t,
      ./variability, ./metamodels/{decision,binding,configuration,trace,
      trace-extensions,types}, decision/binding/configuration each with
      /model per the flat-components-plus-model convention (trace-extensions
      added beyond the original table to avoid mixing the two trace
      metamodels in one flat namespace)
- [x] rewrite all consumer imports to the namespaces (per-symbol, two
      parallel subagents); compatibility subpaths removed from the exports
      map; root exports nothing
- [x] CLI emit sites write the new specifiers (generated models import
      @aelastics/synthesis/jsx; generated configuration models import
      @aelastics/synthesis/metamodels/{configuration,decision,binding} and
      /configuration/model)
- [x] CLI tests/fixtures that assert on old specifiers updated
- [x] gates

### Stage 3: retire the old example machinery
- [x] delete libraries/runner, libraries/examples; remove from rush.json
- [x] delete `synth example` command group and its tests
- [x] make the two CLI fixtures self-contained: the compiled parts they
      deep-imported were vendored into each fixture's lib/ and converted
      from CJS to ESM (raw CJS breaks both CLI load paths: the fixtures
      are type module, and esbuild's externalized-require shim throws);
      synth.json parts now use ./lib/... paths; nine test assertions on
      the printed module strings updated
- [x] record the new CLI test/smoke baseline here: 434 tests, 86 smoke
- [x] gates

### Stage 4: examples own their metamodels
Execution notes (agreed shape, decided at execution time):
- Package subpaths follow the uniform convention: bare package = JSX
  components flat, `/model` = type schemas. eer-tutorial-metamodel has
  `/basic`, `/basic/model`, `/advanced`, `/advanced/model`.
- The duplicated metamodel-as-model part files move into their metamodel
  packages as an `/as-model` subpath; manifests reference them by bare
  specifier, and `importTxModule` routes bare specifiers through the same
  resolve-then-transpile pipeline as relative ones, so their framework
  imports still externalize to the CLI's instances.
- Loader fallback: `externalizeBareImports` delegates to a central
  resolver that tries the CLI installation first, then a require anchored
  at each installed transformation directory (workspace config knows
  them), memoizing one absolute path per specifier per process so all
  importers share one module instance. Roots are registered by the
  commands that load transformations or models.
- apps/cli gains devDependencies on eer-metamodel, relational-metamodel
  and rel-tutorial-metamodel purely so its test fixtures resolve under
  jest; this is a test crutch, documented here, not a runtime dependency.
- Metamodel packages have no smoke test; they are libraries, built by
  rush, exercised through every example that depends on them.
- [x] create the four metamodel packages, each with /model, flat
      components, and the /as-model export (the compiled copies inside
      four example packages are deduplicated into them)
- [x] relational-metamodel carries the current legacy content under the
      honest name
- [x] move example packages into the suite layout; rush.json folders
      updated (projectFolderMaxDepth raised to 4 for the metamodels/
      folders); smoke.mjs unchanged in path but reordered: install before
      model import, because sample models resolve their metamodel through
      the installed transformation (template smoke mirrored)
- [x] repoint every example, sample model, and manifest; parts entries for
      the moved as-model files are now bare specifiers
- [x] template and rel-copy fixture ported to rel-tutorial-metamodel: a
      semantic adaptation (no isForeignKey concept; references is a typed
      Column link re-established with $refByName). Consequence: the
      eer-to-relational to rel-copy chain fixture pairing dissolved; chain
      tests use rel-copy self-chains and the real eer-to-relational to
      rel-to-sql-ddl pair
- [x] loader fallback implemented in models/resolution.ts (kept light so
      the base command can register roots without loading esbuild), used
      by the loader plugin and by tx/modules.ts for bare parts; four unit
      tests lock the contract; the tutorial smokes exercise it end to end
      since the CLI has no dependency on eer-tutorial-metamodel
- [x] deriveMetamodel rule change and `transformation init` placeholders
- [x] delete libraries/standard-metamodels; remove from rush.json
- [x] gates, including every example smoke (CLI baseline now 438 tests:
      434 plus 4 resolution tests; 86 smoke)

### Stage 5: CLI rename
- [ ] apps/cli package.json name `@aelastics/synthesis-cli`; binary stays
      `synth`; workspace dependents updated (examples devDependency)
- [ ] gates

### Stage 6: docs and catalog
- [ ] design/architecture.md rewritten for the new structure
- [ ] developer-guide pages: new import specifiers and the new metamodel
      rule (replace "a metamodel must be an @synthesis/standard-metamodels
      subpath" with the metamodel-package rule)
- [ ] the two `file=` fences follow the moved example paths; re-check the
      line-pinned one (part-2-structured/2-multiple-documents.md pins
      L40-L98 of sql-tutorial-structured's transformation)
- [ ] examples/README.md rewritten for the suite layout (also fixes the
      broken catalog links and removes the phantom higher-order row until
      that example exists)
- [ ] grep the whole repo for `@synthesis/` and `standard-metamodels`;
      nothing may remain except historical design notes and CHANGELOG
- [ ] CHANGELOG entry
- [ ] gates, docs build last

### Stage 7: merge
- [ ] full gate run from clean state in the worktree
- [ ] merge feat/consolidation into main with --no-ff (from the main
      checkout; never switch branches inside a live worktree session)
- [ ] full gate run on merged main
- [ ] update the memory file and this plan's log; do not push

## Parallelization notes

Stages 1 and 2 touch everything and must be sequential. After stage 2 lands,
stage 3 (CLI-side) and the metamodel-package creation half of stage 4
(examples-side) touch mostly disjoint files and can run as parallel lanes,
including as separate sessions if desired; the loader-fallback item of
stage 4 belongs to the CLI lane. Stage 6 docs pages can be fanned out per
tutorial part once stage 4 paths are final. Within any stage, mechanical
import rewrites fan out safely to subagents by directory.

## Stage log

- 2026-09-01: branch and worktree created; agreement recorded (stage 0).
- 2026-09-01: stage 1 complete. Physical consolidation done by hand
  (skeleton, git mv, rush.json), import rewrites by three parallel
  subagents on disjoint trees, verified by fixed-string sweeps plus one
  straggler fixed in apps/cli/src/tx/decisions.ts. Gates green: rush
  build; CLI 441 tests, 86 smoke; all 9 example/template smokes; docs
  built within rush build. Notable: the merged library has no
  domain-metamodel dependency (ModelStore test fixtures rewired to the
  internal bpm metamodel); eer-to-rel-with-decisions in the retiring
  libraries/examples was adapted from the deleted v2 relational variant
  to the surviving content, which diminishes its FK demonstration; that
  package retires in stage 3, so no action.
- 2026-09-01: stage 2 complete. Final namespaced surface built and all
  consumers flipped per symbol; gates green with unmasked exit codes (CLI
  441 tests, 86 smoke, 9 example/template smokes). Two process lessons
  now binding: verify sweeps with `git grep` (plain grep on this machine
  silently missed apps/cli/src/tx/decisions.ts twice), and never pipe a
  gate through tail without pipefail, since it masks the exit code (also
  the source of the rush-warnings note under Gates).
- 2026-09-01: stage 3 complete. runner and libraries/examples deleted,
  `synth example` command group removed, both CLI fixtures self-contained
  (vendored parts, CJS converted to ESM). New CLI baseline: 434 tests
  (was 441; the seven example-command tests went with the commands),
  86 smoke unchanged. All gates green.
- 2026-09-01: stage 4 complete. Four metamodel packages own their
  domains, examples live in suite folders, standard-metamodels is gone,
  and the loader fallback landed with unit tests plus end-to-end proof
  through the tutorial smokes. All gates green on the first chain run:
  build, CLI 438 tests, 86 smoke, nine example/template smokes.
