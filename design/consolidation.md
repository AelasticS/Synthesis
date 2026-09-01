# Repository consolidation: target structure

Agreed 2026-09-01. This document records the decisions; the execution plan
with stage tracking lives in [consolidation-plan.md](./consolidation-plan.md).

## Motivation

The ten-package decomposition under libraries/ imposed cost (dependency
wiring, deep import paths that leak packaging into domain code, version
coupling) without buying independence anyone used. Evidence gathered before
deciding: decision-framework's barrel already re-exported all of engine and
imported its underscore-prefixed internals; 46 of its 48 importing files
imported engine too. metamodel-core was 162 lines with five used exports.
runner was 69 lines with one consumer. standard-metamodels carried three
coexisting relational variants that git history shows are extraction
accidents, not versions, with manifests declaring one variant while code
imported another.

Separately, examples imported their metamodels through paths like
`@synthesis/standard-metamodels/relational/model-legacy`: the name says
nothing about the domain, the path is an artifact of packaging, and an
example could not be read, copied, or extracted whole.

## Decisions

1. `@aelastics/types`, `@aelastics/store`, `@aelastics/result` stay separate
   packages. They are documented as standalone libraries on the docs site
   and predate Synthesis.
2. The Synthesis libraries consolidate into a single package,
   `@aelastics/synthesis`, built from engine, jsx-runtime,
   decision-framework, metamodel-core, and the types-metamodel (which
   decision-framework's own source imports, so it is framework
   infrastructure, not a standard metamodel).
3. The CLI keeps its role and behavior, and is renamed
   `@aelastics/synthesis-cli`. The binary stays `synth`. Nothing has been
   published, so both renames are free; the `@aelastics` npm scope is the
   one we control.
4. The export surface of `@aelastics/synthesis` is namespaced through
   subpath modules (table below). Use sites stay unqualified: JSX tags,
   decorators, and the default jsxFactory all expect bare identifiers, so
   the namespacing lives in the import lines. The root export is empty.
5. `@synthesis/runner`, `libraries/examples` (`@synthesis/examples`), and
   the `synth example` command group are deleted. The installable packages
   under examples/ are the example story.
6. `@synthesis/standard-metamodels` dissolves. Domain metamodels move to
   the examples tree as small unscoped packages owned by the example suite
   that shares them. bpm becomes an engine test fixture (its only consumers
   are two engine tests). The relational v1 and v2 variants are deleted;
   git history preserves them.
7. There is no single canonical relational metamodel. The tutorial's
   simple one (rel-tutorial) and the full suite's rich one are two honest,
   differently purposed metamodels, each owned by its suite.
8. The full suite's relational metamodel carries its current content (what
   the legacy variant is today). The rich foreign-key redesign is reserved
   for the flagship design session and is out of scope here.

## Target package structure

| Home | Package | Notes |
| --- | --- | --- |
| libraries/aelastics-result | `@aelastics/result` | unchanged |
| libraries/aelastics-types | `@aelastics/types` | unchanged |
| libraries/aelastics-store | `@aelastics/store` | unchanged |
| libraries/synthesis | `@aelastics/synthesis` | new, consolidated |
| apps/cli | `@aelastics/synthesis-cli` | renamed, behavior unchanged |
| apps/docs | `@synthesis/docs` | site, not in build graph |
| examples/tutorial/metamodels/eer-tutorial | `eer-tutorial-metamodel` | basic + advanced stages |
| examples/tutorial/metamodels/rel-tutorial | `rel-tutorial-metamodel` | the tutorial pivot |
| examples/tutorial/* | seven tutorial companions | unchanged names |
| examples/eer-to-sql/metamodels/eer | `eer-metamodel` | full EER |
| examples/eer-to-sql/metamodels/relational | `relational-metamodel` | full suite's own |
| examples/eer-to-sql/eer-to-relational | `eer-to-relational` | |
| examples/eer-to-sql/rel-to-sql-ddl | `rel-to-sql-ddl` | |
| templates/transformation-template | `transformation-template` | repointed to rel-tutorial-metamodel |

Examples are grouped by suite because that is where metamodel sharing is:
rel-tutorial is the target of three companions and the source of three
others; the two full examples are a chain pair over eer/relational. The
m2m/m2t kind is a catalog column, not a folder split.

## The export surface of @aelastics/synthesis

| Subpath | Contents |
| --- | --- |
| `./jsx` | `createExprNode`, `ExprNode`, `Template`, `CpxTemplate`, `Context`, the `Element` and `Model` JSX wrappers |
| `./metamodel` | M3 core schemas: `Model`, `ModelElement`, `Namespace`, basic types (resolves the schema-vs-wrapper `Model` collision) |
| `./store` | `ModelStore` (pure model files need it without touching m2m) |
| `./m2m` | `abstractM2M`, `M2M`, `E2E`, `SpecPoint`, `SpecOption`, trace runtime |
| `./m2t` | `M2T`, `Doc`, `Sec`, `P`, `SecParent`, text-document model types, `generate` |
| `./variability` | `DecisionAwareM2M`, `VarPoint`, `VarOption`, `Default`, `Option` |
| `./metamodels/decision`, `./binding`, `./configuration`, `./trace`, `./types` | internal metamodels |

Convention, uniform across internal metamodels and example metamodel
packages: the flat subpath exports the JSX components, `<subpath>/model`
exports the type schemas. The root (`.`) exports nothing.

## Metamodel ownership and type identity

The CLI's model loader (apps/cli/src/models/loader.ts) resolves bare
imports of a workspace model against the CLI installation and marks them
external, so the model, the transformation, and the engine share one set of
aelastics module instances; a bundled private copy would break `isTypeOf`.
Relative imports are bundled per transpiled module, so even two parts of
one package cannot share a metamodel through relative imports. A metamodel
must therefore be a resolvable package. The rules:

- A metamodel shared by several examples is a package in the suite's
  `metamodels/` folder. Examples depend on it like any dependency.
- A metamodel package owns all its facets: the type module (`/model`), the
  JSX components (flat), and the metamodel-as-model (exported so manifests
  can reference it; today three examples carry duplicated compiled copies).
- Manifest `source`/`target.metamodel` strings are the metamodel package
  specifiers. This is also the identity the chain type-check compares.
- Loader enhancement: resolution tries the CLI installation first (framework
  packages keep their single instance), then falls back to the installed
  transformation packages' own vendored dependencies, resolving each bare
  specifier at most once per process and memoizing the result, so all
  importers in a run share one module instance even when two installed
  packages vendor their own copies. Manifest `parts` with bare specifiers
  route through the same resolver.

## CLI changes, exhaustively

1. Package rename to `@aelastics/synthesis-cli`; dependency updates.
2. Emit sites write the new specifiers: generated models import
   `@aelastics/synthesis/jsx` (tx/execute.ts), generated configuration
   models import `@aelastics/synthesis/metamodels/...` (tx/config-model.ts).
3. `synth example ls|describe|run` deleted; the two test fixtures that
   deep-imported `@synthesis/examples/lib/...` become self-contained.
4. The loader fallback described above (models/loader.ts, tx/modules.ts).
5. `deriveMetamodel` (models/stamp.ts) drops its standard-metamodels
   branch; the rule becomes: first bare import that is not `@aelastics/*`.
6. `transformation init` scaffold placeholders stop suggesting
   `@synthesis/standard-metamodels/...`.
7. Test and fixture strings updated throughout.

## Out of scope, recorded elsewhere

- The rich relational metamodel and flagship example design
  (design/engine-follow-ups.md and the flagship session).
- The `inlineReferences` question in sql-tutorial-configuration-based.
- Packaged chains (design/packaged-chains.md; that note gets the new names
  only).
- Publishing (versions, tags, npm); the cli-v0.1.0 tag predates the rename.
