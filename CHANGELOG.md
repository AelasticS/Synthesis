# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
intends to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Each release section corresponds to a tag on `main`. The CLI is released
independently via `cli-vX.Y.Z` tags; library packages share the repository's
overall version history.

## [Unreleased]

## [cli-v0.3.1] - 2026-10-27

### Fixed

- **Windows install and uninstall instructions.** The install step
  wrote the combined system and user `PATH` into the user `PATH` and
  asked for an elevated PowerShell, which is not needed. It now appends
  only `C:\synthin` to the user `PATH` and shows the `tar` command
  that extracts the bundle. The uninstall section has Windows steps
  (delete the folder, remove the `PATH` entry, delete the workspace at
  `%USERPROFILE%\.synth`), and the upgrade section no longer adds a
  second `PATH` entry. Release metadata (`CITATION.cff`) is now 0.3.1.

## [cli-v0.3.0] - 2026-10-26

### Added

- **Release metadata.** `CITATION.cff` describes the software for
  citation, and `PAPERS.md` maps the listings of the papers that cite
  this repository to their source files and to the `synth` commands that
  produce the generated ones.

- **Model expression samples in the workflow suite.**
  `workflow-to-bpmn/sample` gains `model-expression.tsx` (all four
  operators in one literal: model creation, element creation,
  computation and a reference to a model-level process), `configurable-approval.tsx` (a model template) and
  `generic-approval.tsx` (a higher-order model template whose writing
  step is a template parameter). `npm test` of `workflow-to-bpmn` now
  also runs `scripts/verify.mjs`, which imports and validates the three,
  transforms each to BPMN and checks the element names and counts.

- **`Step` component in `workflow-metamodel`.** The abstract step, for
  the base skeleton of a specialization point. It connects like
  `Sequence` and `Parallel`.

- **The simple-eer-to-sql-variability suite.** A simple counterpart to the
  eer-database-suite: two small metamodels (`simple-eer-metamodel-variability`,
  `simple-relational-metamodel-variability`) and `simple-eer-to-relational-variability`, a
  configuration-based transformation with three design issues
  (`OneToManyStrategy`, `PrimaryKeyStrategy`, `NamingConvention`). Its
  README maps the paper's listings to files and walks the loop: build,
  install, generate the default configuration with `config init`, edit
  it, run with it, and export the result and the trace. `npm test`
  runs the CLI smoke and `scripts/verify.mjs`, which asserts both
  runs' tables and the trace resolutions behind them.

- **The simple-eer-to-sql suite.** The same mapping without variability:
  `simple-eer-metamodel`, `simple-relational-metamodel` and
  `simple-eer-to-relational`, a plain `abstractM2M` transformation
  with fixed foreign key, auto increment and camelCase behavior, and its
  own docs page.

- **Declared constraints on the decision-framework metamodels.**
  `BindingElement` must reference only issues of its binding model's
  decision model (sub-issues of opening options included), and
  `ConfigurationModel` must select options only from that decision
  model, hold at most one `ElementLevelChoice` per element and issue
  and one `ModelLevelChoice` per issue. `ElementLevelChoice` and
  `ModelLevelChoice` accept only options of an element-level and a
  model-level issue respectively. All run under `synth model validate`.

- **Trace reference components.** `SourceElement` and `ChoiceRef` join
  the trace metamodel's JSX components: a `RuleInvocation` names its
  source element with `<SourceElement $refByName=…/>`, and a `Resolution`
  lists the configuration choices it consulted with
  `<ChoiceRef $refByName=…/>`, so serialized traces tag each reference
  by its role.

- **An invocation carries its own performer.** An optional override
  of the called definition's default, as BPMN call activities do; the
  flowchart view shows the effective performer. A new declared
  constraint requires invoking model-level definitions only.

- **The $synth header is typed.** `@aelastics/synthesis/envelope`
  publishes `SynthHeaderInput` (the authored form, only `kind` and
  `metamodel` required) and `SynthHeader` (the normalized form).
  Headers are authored `as const satisfies SynthHeaderInput`; the CLI
  shares the same types.

- **The workflow suite v2.** The metamodel splits definition from
  occurrence: `WorkflowModel` roots `Document` vocabulary and
  `Task`/`Process` definitions; `Invocation` steps call them and bind
  `DataObject`s through reads/writes; inline activities are
  single-use sugar; `Sequence`, `Parallel`, `Choice`, and `Loop`
  complete the control flow of the block-structured workflow model (a
  process tree); conformance is declared constraints. The three views
  follow, `org-to-approval` joins as the generative example, and the
  new `transformation run --param <json>` feeds the engine's
  parameter channel with verbatim `generatedBy.param` provenance.

- **The advanced-eer-to-sql suite draws its design space.** `rel-to-mermaid`
  renders the configuration-based mapping's output as a Mermaid
  erDiagram, so different configurations of one source become visibly
  different diagrams; the suite page shows three side by side.

- **The advanced-eer-to-sql suite gains its diagram view.** `eer-to-mermaid-er`
  renders the EER source as a Mermaid erDiagram. Fixed logic, no
  configuration flags.

- **The EER metamodel says what the language means.** A weak mapping
  nests in its weak entity; a Specialization IS a mapping whose
  bounds carry completeness and disjointness; subtypes are top-level
  entities; declared rules cover the links JSX cannot force;
  SingleTable honors the bounds.

- **Row history as a composite design option.** The per-entity
  RowHistory issue derives a `<table>_history` table (base key plus
  temporal discriminator, no foreign keys) through the higher-order
  `withHistoryTable` template; HistoryTable is the first live
  CompositeOption, opening the HistoryDiscriminator sub-issue; the
  DDL generator emits capture trigger stubs.

- **Default configurations traverse chosen composite options.**
  `config init` and `--default-configs` answer, recursively, the
  sub-issues a chosen option opens.

- **The advanced-eer-to-sql suite maps full EER semantics (v2).** Aggregations
  with the cardinality key rule, binary-only relationships, integrity
  rules as referential actions and trigger stubs, user-defined
  domains, composite attributes, an ordered PrimaryKey element,
  entity name scopes, and the simplified withAuditColumns form.

- **Dialects are configurations.** ReferentialActions,
  DomainHandling, SqlDialect, and Clustering join IdentifierQuoting;
  three presets ship as configuration models built by extension;
  `--config` accepts source-agnostic configurations.

- **Declared constraints with a validation point.** Metamodels
  declare semantic rules with addValidator; `synth model validate`
  runs them after the gate render.

### Changed

- **org-to-approval: the specialization point has a base skeleton.**
  `OrgUnit2Approval` returns a `Step` with the description
  `Approval by <unit>`, merged with the selected option's `Task` or
  `Parallel`. The generated approvals now carry that description; the
  board member tasks and `WriteDocument` do not. The BPMN and Mermaid
  outputs of the chain are unchanged.

- **Examples renamed.** `examples/advanced-eer-to-sql` is now
  `examples/eer-database-suite` (it holds m2m and m2t transformations
  and Mermaid diagram views, not only EER to SQL). The earlier simple
  suite moved from `examples/simple-eer-to-sql` to
  `examples/simple-eer-to-sql-variability`; `examples/simple-eer-to-sql`
  is now the version without variability. Docs pages follow the same
  names and are ordered simple, simple with variability, then the
  eer-database-suite. The packages of the variability suite are renamed
  to match (`simple-eer-metamodel-variability`,
  `simple-relational-metamodel-variability`,
  `simple-eer-to-relational-variability`); the unsuffixed names now
  belong to the suite without variability. Reinstall transformations and
  reimport sample models that used the old names.

- **Terminology follows the metamodel.** The decision framework's
  `ElementIssue` is `ElementLevelIssue`, "variation points" are
  "variability points" (the tutorial pages `3-variation-points` and
  `2-variation-points` are renamed accordingly), and "composite"
  options are "opening" options throughout the docs and design notes.

- **`model import` takes `--tx` and `--dependency`.** A configuration
  model needs its transformation's render context (`--tx`) and names
  its source model (`--dependency`, auto-detected when exactly one
  installed model defines the referenced schema).

- **The docs are published from this repository.** The site moves to
  `https://AelasticS.github.io/Synthesis/`, built and deployed by the
  `Deploy Docs` workflow with the official GitHub Pages actions; it no
  longer publishes to a separate Pages repository and needs no deploy
  token. Links in the docs and READMEs follow the new address.

- **The transformation entry rule is `main`.** Renamed from
  `template`: all rules are templates, and the entry rule's
  distinction is its position. Breaking for transformations authored
  against cli-v0.2.0.

- **The decision framework drops its option and choice unions for
  concrete subtypes.** `Option`'s `optionType` tagged union
  (`SimpleOption`/`CompositeOption`) is gone: a plain option is
  authored as a bare `Option`, and one that opens sub-issues is
  authored directly as `OpeningOption` (renamed from
  `CompositeOption`), no `optionType` wrapper needed. `Issue`'s
  `possibleOptions` is renamed `options`, and `Option`'s `ParentIssue`
  is renamed `parentIssue` and declared as that property's inverse
  (`t.inverseProps`), so the renderer wires it automatically instead
  of authors setting it. The configuration model sheds the parallel
  `Decision` container: `BaseChoice` is renamed `Choice`, and its two
  concrete subtypes `ElementLevelChoice`/`ModelLevelChoice` (previously
  `ElementDecision` and the base `Decision`) are themselves single
  choices rather than containers holding a nested `choices` array;
  `ConfigurationModel`'s `decisions` is renamed `choices`, now one
  flat list. A `Choice` no longer carries its own `issue` field — it
  is recovered from `selectedOption.parentIssue`. Every decision-model
  author (eer-to-relational, rel-to-sql-ddl, both tutorial
  configuration-based companions) drops the `optionType={<SimpleOption
  .../>}` boilerplate, and presets build a `ModelLevelChoice` with
  `selectedOption` set directly instead of nesting a nameless `Choice`
  inside it.

- **The trace is a call tree.** The trace model's `ElementMapping`/
  `TraceEntry` list is replaced by `Invocation` (one executed call) and
  its subtype `RuleInvocation` (an `@E2E` rule: `source` and `targets`),
  and `TraceModel.elementMappings` is renamed `invocations`. Each
  invocation's `parent` is the invocation that was executing when it
  began, tracked through the call stack; `function` names the concrete
  method that ran (for a rule with a variability or specialization
  point, the executed option method, still one RuleInvocation). A
  `@VarOption`/`@SpecOption` executed outside any `@E2E` rule is a
  plain `Invocation`. `Resolution` records one `@VarPoint`
  consultation on the invocation that carried it: `byDefault` is true
  when the `@Default` option ran because no condition was met, and
  `choices` lists the configuration choices for that issue in scope,
  always, including those whose condition was not satisfied. The
  per-model `NonRuleResolution`/`ElementResolution` records and the
  `trace-extensions` package are removed. `ReadRecord.entry` now links
  an `Invocation`. `@E2E` now validates its input: calling an `@E2E`
  method whose first argument is not a `ModelElement` throws an Error.

- **The CLI follows the new decision and configuration metamodel.**
  Decision and configuration handling (`transformation run`,
  default-configuration generation, validation) reads `issue.options`,
  `OpeningOption.subIssues` and the flat `ConfigurationModel.choices`,
  and writes `ModelLevelChoice`/`ElementLevelChoice` directly. Existing
  configuration files using `GlobalChoice`/`ElementChoice` (nested
  `choices`, `issue=`) must be rewritten to the new names; there is no
  backward compatibility. `--trace` output now contains
  `RuleInvocation`, `Invocation` and `Resolution` elements.

- **Docs pages link their sources.** Example, tutorial, and guide
  pages link the repository folders holding their packages and
  metamodels.

- **The full-example suite moves to `examples/advanced-eer-to-sql`.**
  Renamed from `examples/eer-to-sql` to make room for a simple
  counterpart. Packages, names, and the documentation page keep their
  names; the Rush project folders, the lockfile links, and the links
  in the docs, READMEs, and design notes follow the new path. The
  simple suite's EER metamodel package is `simple-eer-metamodel-variability`, so
  the two never share a package name.

- **Docs follow the `main` entry rule and the run flags.** The
  developer guide, both tutorials, the design notes, the starter
  template, and the decision-support description name the entry rule
  `main`; the command reference lists `transformation run --param` and
  `--trace`.

### Fixed

- **Release download links match the release files.** `oclif pack
  tarballs` put the commit hash in each tarball name
  (`synth-v0.2.0-3ec82a1-linux-x64.tar.gz`), so the links on the
  download page returned "not found". `apps/cli/config/pack-tarballs.mjs`
  now drops the hash, and the files are named
  `synth-v<version>-<target>.tar.gz`.

- **`@SpecOption` registration is per class and independent of
  declaration order.** A subclass option for an inherited `@SpecPoint`
  was added to the parent class's option list, so the parent and sibling
  subclasses saw it, and a parent instance could dispatch to a method it
  lacks (`this[option.specMethod] is not a function`). An option written
  above its point was dropped, or the class failed to load. Each class
  now has its own copy of the inherited options, `@SpecPoint` keeps
  options registered before it, and a subclass option for a type the
  parent covers overrides the parent's option for subclass instances.
  Two options for the same type on one class are still rejected.

- **`npm test` of the CLI runs on Windows.** The script set
  `NODE_OPTIONS` with POSIX shell syntax, which `cmd.exe` rejects. It
  now passes `--experimental-vm-modules` to `node` directly.

- **The transformation template's smoke test is isolated on Windows.**
  `templates/transformation-template/scripts/smoke.mjs` sets
  `USERPROFILE` as well as `HOME`, as the example scripts already do, so
  `npm test` no longer fails with "Workspace not initialized".

- **A `@SpecPoint` skeleton merge is serialized as the merged
  element.** The target JSX that the CLI writes for `--out` printed the
  base skeleton with its own tag and props and lost the option's
  element, although rendering created the right element. It now shows
  the option's tag, the skeleton's props under the option's, and both
  children lists. Transformations whose points are pure dispatchers are
  not affected.

- **`@SpecPoint` selects the most specific applicable option.**
  Dispatch now tests the element's runtime type against the option's
  declared type: an option for `O` applies to elements of `O` and its
  subtypes. The test was reversed, so an option for a subtype caught
  elements of its supertype and an option for a supertype never caught
  a subtype. Among the applicable options the most specific one wins,
  independent of declaration order. Options without a unique most
  specific one are an error, and a second option for the same type on
  one point is rejected when the class is decorated. A type no option
  applies to is still the error `No specialized method found`. No
  shipped example changes its output.

- **The eer-database-suite verify scripts run again.**
  `scripts/verify.mjs` in `eer-to-relational`, `rel-to-sql-ddl`,
  `eer-to-mermaid-er` and `rel-to-mermaid` imported `sample/library.tsx`,
  which does not exist (the file is `library.eer.tsx`), so none of their
  assertions ran. With the path fixed, two scripts still asserted formats
  that had since changed: the patched configuration used the retired
  `Choice`/`NoHistory` names instead of `ElementLevelChoice` named
  `ec_<Entity>_RowHistory`, and the trace checks looked for `rule=` and
  `issue=` attributes instead of `function=` and `Resolution` entries
  that point at the deciding choice. Both are updated, and all four
  scripts pass.

- **The simple suite's foreign key option puts the column on the right
  table.** For a 1:N relationship the `ForeignKey` option now adds the
  nullable foreign key column to the table of the entity whose role has
  upper bound 1 (`Person`), named after and referencing the other
  entity (`CompanyIdFK` referencing `Company`). It previously added a
  column named after the first entity to the other entity's table. The
  suite's `verify.mjs` asserts the placement.

- **`synth model import` works on Windows.** The model loader treated a
  Windows absolute path (`C:\...`) as a package name and marked the
  model file itself external, so every import failed. It also emitted
  package imports as plain absolute paths, which the ESM loader rejects
  on Windows. Imports are now emitted as `file://` URLs on every
  platform.

- **The CLI tests and the example scripts run on Windows.** They
  isolated the workspace through `HOME`, but `os.homedir()` reads
  `USERPROFILE` on Windows, so they used the developer's real
  `~/.synth` and collided with each other. They now set both. The test
  harness starts the CLI without a shell, so arguments arrive verbatim
  on every platform, and the tests accept Windows line endings, path
  separators and oclif's Windows wrap prefix.

### Removed

- **Legacy trace types.** `M2M_Trace`, `E2E_Trace`, `IM2M_Trace`,
  `IE2E_Trace`, the unused `transformation.model.components_v2.ts` and
  the context field `transformation.instance`. The engine records
  traces as a `TraceModel` and never produced these.

## [cli-v0.2.0] - 2026-09-05

### Added

- **Tutorial Part 4: Name scopes.** The model-to-model tutorial gains a
  closing part that keeps Part 1's rules and changes the naming world:
  both tutorial metamodel packages gain an additional `name-scopes`
  stage (the known stage plus one `declareNamespace` line, `Entity` on
  the EER side, `Table` on the relational side), and the new companion
  package `eer-tutorial-name-scopes` reworks Part 1 onto them with
  natural names (`id`, `title`), referenced-entity foreign key names
  (`authorId`), and path references (`Author/id`). Parts 1 to 3, the
  model-to-text tutorial, and the flat metamodel stages are untouched.

- **The trace model records outcomes, and the CLI can persist it.** A
  transformation's trace now has one entry per executed rule (named for
  its rule and source element, the rule field carrying the executed
  concrete method), and every resolved configuration option is recorded,
  always: a choice consulted inside another rule is attached to the
  entry of the element it was decided for, a global choice is recorded
  once on the trace model, and each resolution carries decision-model
  issue and option names, a reference to the explicit Choice or a
  `byDefault` marker. The previous `VariabilityPointTraceEntry` /
  `SpecializationPointTraceEntry` entry kinds and the `ruleType` field
  are retired; trace references are full element paths. For future
  incremental transformation (design/synchronizing-transformations/),
  entries reserve a `reads` containment and an optional `parentInvocation`
  link, and the trace model gains transformation and source version
  slots. `transformation run --trace <ref>` persists the trace as a
  workspace model (single step, m2m and m2t); when the run used
  generated defaults, the effective configuration is persisted next to
  it at `<ref>-config` so the trace's configuration reference resolves.
  The trace file is written directly rather than through the
  self-contained import gate: it is a provenance report whose
  references resolve against the models of its run, named in its
  header's `references` map. The engine no longer dumps trace and
  target JSX through `console.log`; hosts read `context.traceJsx` and
  `context.output.jsx`.
- **Hierarchical name scopes by classification.** A metamodel concept
  declared with `declareNamespace(Type)` (exported from
  `@aelastics/synthesis/metamodel`, one line next to the type
  definition) scopes its contained elements' names: equal names coexist
  in different scopes (`//model/A/id` and `//model/B/id`), element
  paths nest, and a bare `$refByName` canonicalizes against the current
  scope and probes the enclosing scopes outward to the model, innermost
  match winning. Existing flat metamodels are untouched: nothing is
  scoped until a metamodel opts in. The `Namespace` TYPE is removed
  (namespace-ness is a cross-cutting classification single inheritance
  could not express; `Model` now declares it via the same call, and
  `INamespace` remains as a deprecated type alias).

- **relational-metamodel carries the rich content.** `Table` now
  contains real `ForeignKey` elements (composite capable: one
  `ForeignKeyColumn` pair per participating column) and `Index`
  elements, with `ownerTable` inverses throughout. `Table` is declared
  a namespace, so column names are per-table (`book/id` and `copy/no`
  coexist; a foreign key names a sibling table's column as
  `copy/book_id` and outward probing resolves it). One `Column` tag
  serves every context via ordered connection candidates (`columns`,
  then `fkColumn`/`refColumn`, then an index's column list). The
  authoring sample `rel-to-sql-ddl/sample/rich-db.tsx` guards it all on
  every suite smoke. The legacy `Column.isForeignKey`/`references`
  marks remain, now optional, until rel-to-sql-ddl adopts the rich
  content; `Domain` stays untouched pending discussion.
- **eer-to-relational is the flagship transformation.** Reworked
  against the rich relational metamodel with every template kind: pure
  @SpecPoint dispatch over the entity kinds, seven configuration issues
  (TableAuditing with the higher-order withAuditColumns applied inside
  the audited option and on by default, JPA-style InheritanceStrategy
  per hierarchy with JoinedTables/SingleTable/TablePerClass, an
  index-per-foreign-key policy, collision-driven foreign key column
  naming, plus the retained naming, primary key, and 1:N issues).
  Authority over source elements is partitioned at the composition
  site (subtypes belong to their hierarchy's rule; an abstract root
  under TablePerClass gets no table), emission order is a topological
  sort over table-producing units, and one foreignKeyTo plan drives
  weak entities (composite keys down the chain), joined subtypes, and
  relationship keys alike. The suite's verification runs the Library
  sample under the default and a patched configuration and asserts
  exact tables, keys, indexes, and trace resolutions.

- **rel-to-sql-ddl generates DDL from the rich content.** CREATE TABLE
  statements carry composite-aware PRIMARY KEY clauses; foreign keys
  become named ALTER TABLE ADD CONSTRAINT statements in a separate
  section (foreign keys can be circular, so no creation order can
  satisfy them inline); indexes become CREATE INDEX statements. An
  incomplete foreign key or index is a clear error. The legacy flat
  `Column.isForeignKey`/`references` marks are now fully removed from
  the relational metamodel. The suite's chain verification runs EER to
  relational to DDL end to end and asserts the composite constraint
  down the weak chain. Pair references skip an occupied slot instead
  of reconnecting it (the flow-endpoint idiom), so the first Column
  reference in a pair fills fkColumn and the second refColumn.

- **Docs follow the delivered behavior.** The variability guide's
  Execution Trace section describes the outcome trace and
  `transformation run --trace`; the building-models guide documents
  name scopes (`declareNamespace`, nested paths, outward-probing
  references); the tutorial's unique-names lesson presents name scopes
  as a metamodel choice (the tutorial's simplified metamodel keeps the
  flat rule); the eer-to-sql READMEs and catalog rows describe the
  flagship design space.

### Changed

- **Guides catch up with name scopes and connection candidates.** The
  metamodel guide gains a Name scopes section and its relational
  example drops the retired `isForeignKey` mark (and a broken
  `inverseProps` line) for the derived-references shape with
  `declareNamespace(Table)`; the components guide documents ordered
  connection candidates (`defaultConnectionInfo([...])`,
  first-available semantics, `isReconnectAllowed` and the pair idiom)
  and scope-aware `$refByName` resolution; the concepts page and three
  model-to-text tutorial passages scope their flat-naming claims to
  the metamodels at hand; CONTRIBUTING's release ladder lists the real
  per-package commands (there is no repository-wide `rush test`), and
  the example catalogs credit the gate ladder rather than a CI job.

- **metamodel-core reduced to the semantic core.** `ModelElement` now
  carries exactly `name`, `label`, `description`, `path`, and
  `parentModel`; `Model` adds `elements`. Dropped as dead weight, with
  artifact-level concerns belonging to the envelope (the `$synth`
  header and manifest) instead of element types: the repository fields
  (`ownerRepository`, `ownerPackage`, `category`,
  `objectClassification`, `id`), `content`, `MDA_level` (superseded by
  the conformsTo relationship at the artifact level), the `namespace`
  link, and `diagrams` with the diagram types (a diagram references
  model elements from outside; the element graph does not contain
  diagrams). Samples, fixtures, and docs no longer pass the
  `content=""` and `MDA_level="M1"` ceremony. Per-element decision
  matching keys on element identity (ids were store-generated and
  remain matched when present on older data).

- **Repository consolidated around one Synthesis library.** The former
  packages `@synthesis/engine`, `@synthesis/jsx-runtime`,
  `@synthesis/metamodel-core`, `@synthesis/decision-framework`, and the
  types metamodel of `@synthesis/standard-metamodels` are now one package,
  `@aelastics/synthesis`, with a namespaced export surface (`./jsx`,
  `./metamodel`, `./store`, `./m2m`, `./m2t`, `./variability`,
  `./metamodels/*`; the root exports nothing). The CLI package is renamed
  `@aelastics/synthesis-cli`; the binary remains `synth`. Decision record:
  `design/consolidation.md`.
- **Metamodels are packages owned by the example suites.**
  `@synthesis/standard-metamodels` is dissolved: the tutorial metamodels
  live in `examples/tutorial/metamodels` (`eer-tutorial-metamodel`,
  `rel-tutorial-metamodel`), the full-example metamodels in
  `examples/eer-to-sql/metamodels` (`eer-metamodel`,
  `relational-metamodel`). Each owns its type schemas (`/model`), JSX
  components (flat), and metamodel-as-model (`/as-model`); manifests
  reference these package specifiers. The accidental relational variants
  (v1, v2) are deleted; git history preserves them. bpm is now an engine
  test fixture.
- **CLI: bare imports resolve from the CLI installation first, then from
  installed transformation packages' dependencies**, one resolution per
  specifier per process, preserving aelastics type identity. This lets a
  transformation ship its metamodel as an ordinary dependency. Manifest
  `parts` may reference bare package specifiers.
- **Examples regrouped by suite** (`examples/tutorial/`,
  `examples/eer-to-sql/`) and the starter template now uses the tutorial
  relational metamodel.

- **CLI (breaking): `synth.json` is the only transformation manifest
  location.** The fallback that read a `synth` object from `package.json`
  is removed. A package that still carries a `synth` block fails
  manifest loading with a migration hint pointing at `synth.json`.
  Decision recorded in `design/engine-follow-ups.md`.

### Fixed

- **eer-metamodel authoring repaired for the full concept set.**
  `Specialization` connects as a top-level schema element (it
  previously named a parent property no type declares) and `Subtype`
  nests inside its `Specialization` via `subtypes` (maintaining the
  `supertype` inverse) while remaining valid at top level. A rich
  all-concepts sample (`eer-to-relational/sample/rich-library.tsx`)
  now renders kernels, a specialization with subtypes, a weak entity
  with its weak mapping, an aggregation with its mapping, and a
  relationship with roles on every suite smoke, so no authoring path
  can silently rot again. `Entity` additionally carries `isAbstract`
  (an optional domain fact: an abstract entity has no direct
  instances), in this metamodel only; the tutorial metamodels stay
  deliberately simple.
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
- **A transformation with a design space is called
  "configuration-based", not "decision-based".** The term is swept
  through CLI messages and help text, documentation, examples, and
  package descriptions. The names of the models themselves are
  unaffected: a decision model still declares issues and options, and a
  configuration model still records the choices.
- **Monorepo architecture documentation moved out of the site** to
  [design/architecture.md](design/architecture.md); it is contributor
  material, now linked from the README and CONTRIBUTING instead of shown as
  user documentation. The duplicated Contributing page on the site was
  dropped in favor of the repository's CONTRIBUTING.md.

### Removed

- **`synth example` command group**, together with the in-process example
  registry (`@synthesis/examples`) and `@synthesis/runner`. The
  installable packages under `examples/` are the example story; they run
  through `synth transformation install` and `run`.

### Added

- **`@SpecPoint` pure-dispatch mode.** A specialization point whose base
  rule returns nothing now returns the chosen option's result as is:
  one expression, an array of expressions, or any other value. A base
  skeleton combined with an array-returning option (or a base returning
  an array) raises a clear error instead of corrupting state. The
  existing skeleton-merge behavior is unchanged, and `@E2E` already
  traces array results. Closes the engine's own TODO on array handling.
- **JSX connection property candidates.** A component's parent-property
  connection may declare ordered candidates (`propName: string[]`); the
  first available property declared on the parent's type wins (an
  occupied single-valued slot that refuses reconnection is skipped, so
  flow endpoints can connect into `from`, then `to`), so one tag can
  connect into different containments under different parents (a
  workflow activity landing in a process body or a block's children).
  Single-string connections behave exactly as before.
- **Top-level `examples/` catalog of installable transformation
  packages.** Each example is shaped like a package an author would
  publish: TypeScript sources, a `synth.json` manifest, a sample model,
  and a walkthrough README. The catalog is grouped by suite:
  `examples/tutorial` (the six tutorial companions and the tutorial
  metamodel packages) and `examples/eer-to-sql` (`eer-to-relational`, a
  configuration-based m2m, and `rel-to-sql-ddl`, an m2t generator, with
  their metamodel packages). A generic smoke harness
  (`examples/smoke.mjs`) runs the full install-and-run loop for every
  example from its `test` script.
- **Transformation-authoring tutorial in the developer guide.** The
  Tutorial section holds two tutorials. The model-to-model tutorial
  teaches one growing transformation, each part a folder of sub-pages
  with its own companion package: Part 1 builds a simple EER to
  relational transformation with fixed logic, Part 2 specializes the
  entity rule per entity subtype with `@SpecPoint` and `@SpecOption`,
  and Part 3 turns the one genuinely open choice, how a 1:N relationship
  is mapped, into a configuration-based rule with a decision model,
  binding model, and manifest parts. The model-to-text tutorial is
  reserved while its structure is designed. Every listing and command
  output was executed against the real tools.
- **`eer-tutorial-metamodel`**, a simplified EER metamodel in two
  complete stages: `basic` (entities with attributes over domains,
  binary relationships with cardinality roles) and `advanced` (adds the
  `Kernel` and `Weak` entity subtypes, weak entities carrying an owner
  link). A type metamodel has to be an importable package, because
  workspace model rendering resolves bare imports centrally so that
  models, transformations, and the engine share the same type
  instances.
- **`templates/transformation-template`**, a working starter for new
  transformation packages: it builds, installs, and runs on day zero,
  uses the smoke harness as its `test` script, and carries a CI workflow
  that activates once the template is extracted to its own repository.

### Fixed

- **Decision framework: trace generation no longer fails when a rule
  returns a reference node.** A `@VarOption` rule that grafts children
  into an existing element via `$refByName` (for example the ForeignKey
  option of eer-to-relational) produced a trace target named
  `.../undefined`, and the dangling reference failed the entire run. The
  trace target now uses the referenced element's name, and is omitted
  when no stable name exists.
- **Documented rule dispatch now matches the engine.** The polymorphic
  dispatch guide and the developer-guide concepts page claimed that the
  most specific matching rule wins and that the base rule runs as a
  fallback. Neither holds: selection takes the first registered option
  whose declared type is a subtype of the source element's runtime type,
  and dispatch is total, so an element matching no option raises an
  error instead of falling back.
- **`transformation show` is described accurately.** The configurations
  guide and the eer-to-relational README claimed it lists a
  transformation's issues, options, and defaults. It reports the
  manifest facts, including whether the transformation is
  configuration-based; issues and options surface through `config init`,
  `config show`, and the decision lines printed by a run.
- **eer-to-relational no longer generates colliding column names.** Its
  foreign key columns were named after the referenced entity alone, so a
  model with two relationships referencing the same entity failed to
  render on a duplicate name. Element names are unique per model rather
  than per table, so the columns now carry the relationship name.
- **Text generation keeps the directory nesting a transformation
  declares.** The engine's `generate` reported every item by its bare
  name, so the `<Dir>` elements around a document were lost and two
  documents of the same name in different directories were
  indistinguishable. Each item now carries its path relative to the
  generation root, and `transformation run --out-dir` writes the
  documents into the nested directories. Real-mode generation also awaits
  its own writes, which it previously did not.

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
  [Installation](https://AelasticS.github.io/Synthesis/user-guide/getting-started/installation)
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
  configuration-based transformation runs only with an explicit `--config <ref>`
  or the `--default-configs` consent flag; with neither, the run aborts
  (exit 2) before any engine work with a message teaching both paths. The
  previous behavior of silently generating and applying default
  configurations is gone. In chains and pipelines, `--config` binds to
  step 1 only; every other configuration-based step takes `--default-configs`
  or the stepwise path (`--keep-intermediates` + `config init` against
  the kept intermediate).
- **BREAKING (CLI): canonical command names with typing aliases.** Every
  resource topic has a full-word canonical name (`transformation`,
  `namespace`, `pipeline`, `model`, `config`, `workspace`, `example`),
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

[Unreleased]: https://github.com/AelasticS/Synthesis/compare/cli-v0.3.1..HEAD
[cli-v0.3.1]: https://github.com/AelasticS/Synthesis/compare/cli-v0.3.0..cli-v0.3.1
[cli-v0.3.0]: https://github.com/AelasticS/Synthesis/compare/cli-v0.2.0..cli-v0.3.0
[cli-v0.2.0]: https://github.com/AelasticS/Synthesis/compare/cli-v0.1.0..cli-v0.2.0
[cli-v0.1.0]: https://github.com/AelasticS/Synthesis/compare/8b82ae4..cli-v0.1.0
