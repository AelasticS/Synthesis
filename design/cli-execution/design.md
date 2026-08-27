# CLI Execution — Consolidated Design

Internal design document. Not part of the published documentation; the
Docusaurus pages are rewritten only in the final phase, after the
implementation works.

Status of decisions: everything here was agreed in design discussion
(2026-08-26/27) except items explicitly marked **OPEN**.

## 1. Goals

Make the `synth` CLI actually execute transformations — the current `run`,
`m2t`, and `config init` commands are stubs — with a consistent command
surface, a real workspace model format, and metadata that supports
validation, dependency-driven loading, and interactive assistance. Publish
only after this works.

## 2. Command surface

Resource → verb everywhere: every command is `<resource topic> <verb>`,
and an argument's resource type is always determined by the topic it was
typed under — never guessed from what happens to exist in the workspace.

### Canonical names and typing aliases

Every resource topic has a full-word CANONICAL name — the one shown in
help, documentation, and error hints — and may additionally have a
two-letter typing alias: a pure shortcut with identical behavior.

| resource | canonical topic | alias | alias rationale |
|---|---|---|---|
| transformation | `transformation` | `tx` | first letter + x |
| namespace | `namespace` | `ns` | compound-word initials |
| pipeline | `pipeline` | `pl` | compound-word initials |
| model | `model` | — | short already |
| config | `config` | — | short already |
| workspace | `workspace` | — | rarely typed |
| example | `example` | — | rarely typed |

Mechanically the aliases are per-command oclif aliases (`tx:run` on
`transformation:run`, etc.); the alias topics are declared (hidden) in
the `oclif.topics` map so `synth tx`/`synth ns`/`synth pl` render their
own topic help, while the root help lists only the canonical topics.

### Execution

- `synth transformation run <tx> [<tx> ...] --in <ref> ...` — run ONE
  transformation or an ad-hoc **chain** (several names, executed in
  order; rules below). M2M vs M2T is decided by the manifest `kind`,
  never by the command name. `--save-as <name>` saves the steps of a
  successful run as a pipeline.
- `synth pipeline run <name> --in <ref> ...` — run a saved pipeline: the
  run verb ON the pipeline resource. The pipeline substitutes its steps;
  everything else is the identical request path as `transformation run`
  with those steps (full pre-flight, explicit data flags, normal consent
  policy).
- There is NO top-level `synth run`. The Phase-5 polymorphic `run
  <tx|pipeline>` was removed: a verb that guesses its argument's
  resource type needs resolution-order rules and shadow warnings — the
  two-verb surface needs neither. `transformation run` arguments are
  always transformations; `pipeline run`'s argument is always a
  pipeline.
- `synth m2t` — **removed** in Phase 4 (no deprecation alias; nothing
  was ever published). `example list` → renamed `example ls`.

### Pipelines (final Phase-5 design)

A pipeline is a NAMED PROCESS: an ordered list of transformation steps,
stored as **plain JSON, not a model**, at `pipelines/<name>.json` in the
workspace (sibling of `models/` and `transformations/`; `init` creates
the directory, `doctor` tolerates its absence).

Schema — process only: `{ name, steps, description, createdAt,
modifiedAt }`. Unknown fields are validation errors. A pipeline stores
NO data bindings — no `in`/`out`/`outDir`, no `config`, no
`defaultConfigs`/`keepIntermediates` consents. Rationale: stored data
bindings silently steer replays — the same hazard as implicit defaults
(the Phase-4 consent policy exists precisely to prevent unreviewed
decisions); and a stored configuration is provably wrong for any other
input, since a configuration model's `references.sourceModel` must equal
the model named with `--in`. Every `pipeline run` therefore names its
own data and consents explicitly, per the normal policy — `--in` is
always required (a missing `--in` is a clear error, not a fallback).
`src/pipelines/store.ts` owns the schema (hand-rolled validation with
precise per-field errors, like the manifest reader) and the
load/save/list/scan primitives; the commands are thin.

- **Authoring**: `pipeline mk <name> <tx...> [--description]
  [--overwrite]` validates STATICALLY — nothing executes: name segment
  grammar (`[A-Za-z0-9_-]+`), no shadowing of an installed
  transformation name (one name meaning two runnable things invites
  invoking the wrong one), at least one step, every step installed, the
  chain type-checks from the manifests (step N target metamodel = step
  N+1 source metamodel, incompatible pair named), only the last step may
  be m2t. The chain checks are the SAME code the execution pre-flight
  runs (`src/tx/chain.ts`) — authoring-time and run-time judgments
  cannot drift. An existing pipeline requires `--overwrite`
  (`createdAt` survives; `--description` overrides, else preserved).
- **Saving from a run**: `transformation run ... --save-as <name>`
  persists the steps after a SUCCESSFUL run — same name checks as
  `pipeline mk`, in pre-flight before any engine work;
  `--save-as` + `--save-config` together is an error.
- **Running**: `pipeline run <name> [data flags]` loads the pipeline
  (unknown name → exit 3; schema-invalid file → exit 2 listing every
  problem, repair path `pipeline edit`), substitutes its steps, and
  executes through the shared core exactly like `transformation run` —
  full pre-flight, `--config` on step 1 only, `--default-configs`
  consent, claimed-refs, m2t-last. A pipeline is convenience, never a
  bypass.
- **Management**: `pipeline ls` (name, steps, description; `--json`),
  `pipeline show <name>` (all fields; `--json`), `pipeline rm <name>`
  (no dependency check — nothing references a pipeline), `pipeline edit
  <name>` (`$EDITOR`; after the editor closes the file gets the same
  static validation as `pipeline mk` — schema, steps installed, chain
  compatibility — reported as warnings). All pipeline commands require
  an initialized workspace; `jsonAwareFail` everywhere.
- **Uninstall guard**: `transformation uninstall` refuses (exit 2)
  while any saved pipeline lists the transformation as a step, naming
  the pipelines (the repair is updating them or `pipeline rm`). The
  existence check comes FIRST (an unknown transformation exits 3
  without any pipeline scan), and the step scan is LENIENT — a pipeline
  file that fails schema validation still protects the steps its raw
  JSON names, because repairing it with `pipeline edit` must stay
  possible. Model deletion is NOT guarded by pipelines anymore: with no
  stored model bindings there is nothing to dangle.
- **doctor** applies the `pipeline mk` static checks to every pipeline
  file (schema, steps installed, chain compatibility) — problems are
  warnings naming the pipeline; a broken pipeline never blocks the
  workspace.

### Chaining rules (as delivered in Phase 4, verbs renamed in Phase 5)

- Step N's output model feeds step N+1 in memory (same `ModelStore`,
  `transform(root)` hand-off); intermediates are not persisted unless
  `--keep-intermediates`, which writes each one through the same gated
  writer as a final M2M result, at `<in-ns>/<in-name>-<step-tx>`
  (provenance header, `--overwrite` rules).
- The chain is type-checked from manifests before execution: step N's
  target metamodel must equal step N+1's source metamodel; the error
  names the incompatible pair.
- Only the last step may be M2T (text is terminal; an M2T step
  mid-chain is rejected). Last step M2T → `--out-dir` required (`--out`
  is an error); otherwise `--out <ref>` (default `<in>-<last-tx>`, tx
  name sanitized to ref-safe characters).
- Configuration consent is uniform and explicit (§7): `--config` binds
  to step 1 ONLY (step 1 not decision-based + `--config` → error).
  Every other decision-based step — and step 1 without `--config` —
  requires `--default-configs`; otherwise the run aborts (exit 2)
  BEFORE any engine work with a teaching message. Per-step/positional
  `--config` was dropped as illogical: an explicit configuration cannot
  exist for a model that is only produced mid-run — the configured path
  is stepwise (`transformation run` + `config init` against a kept
  intermediate). `--save-config` is single-step only.
- These rules apply identically to ad-hoc chains (`transformation run`
  with several names) and to saved pipelines (`pipeline run`): both go
  through the one shared execution core (`src/tx/execute.ts`).

## 3. Workspace model format: TSX

Models are **code**, matching the engine's only working import/export path
(`jsx-file` dynamic import + `exportToJSX`). JSON/DTO serialization is
explicitly rejected as the workspace format.

- A model file is a `.tsx` module: `export default (store: ModelStore) =>
  <ExprNode>`, plus an exported `$synth` header (below).
- Namespace = directory path, name = file name:
  `com.example/persons` ↔ `models/com/example/persons.tsx`.
  Refs and disk locations are mechanically derivable from each other; the
  ref itself is NOT stored in the header (no drift possible).
- Loading: esbuild transpile (JSX pragma `createExprNode`) → dynamic
  `import()` → `default(store).render(ctx)`. Module resolution for
  metamodel imports: CLI-shipped standard metamodels + installed
  transformation packages' bundled dependencies. (A workspace-level
  metamodel registry may come later; not in scope.)
- M2M results are written back via `exportToJSX` with a tool-generated
  header including provenance.

## 4. The `$synth` model header

An exported **pure literal** constant in every workspace model file.
Written by tools (`model import`, `run`, `config init`), never required
from humans; a hand-authored file gets its header derived at import.

Read paths:
- Fast path (ls/doctor/pickers/completion): static parse of the literal —
  no transpile, no execution.
- Authoritative path (import/run): `module.$synth` after dynamic import,
  cross-checked against rendered content. Disagreement = `doctor` finding;
  `doctor --fix` re-derives via the import code path.

### Attributes (PROPOSAL — pending user approval)

Tool-maintained (derived; never hand-edited):
| field | meaning |
|---|---|
| `kind` | `model \| metamodel \| decision-model \| binding-model \| configuration-model` |
| `metamodel` | package/URI of the metamodel the content instantiates |
| `references` | map of workspace refs this model depends on (e.g. `sourceModel`, `bindingModel`) |
| `generatedBy` | `{ tx, txVersion, config, date }` when produced by a run; `null` for authored models |
| `createdAt` / `modifiedAt` | ISO dates, maintained on import/write |

Human-meaningful (settable via flags at import, or later via `model edit`):
| field | meaning |
|---|---|
| `author` | who wrote the model; default from `git config user.name/user.email`, override `--author` |
| `version` | the model's own semver, default `0.1.0` |
| `description` | one-line description; shown in `model ls`, pickers |
| `tags` | string list for search/filtering in pickers |
| `license` | optional, for models meant to be shared |

Escape hatch: `custom: {}` — arbitrary user metadata the CLI ignores.

Not stored: the ref/name (derived from location).

## 5. `model import` as the validation gate

`model import <file> --as <ns>/<name>`:
1. Transpile + render into a throwaway store — full structural validation
   (broken JSX, unresolvable metamodel, dangling `$refByName` → rejected).
2. Check model references against the workspace; missing dependency →
   error naming it (interactive session: offer to import it first if found
   next to the source file).
3. Derive/verify + write the `$synth` header, stamp authorship fields.
4. Copy into the namespace-shaped tree.

Invariant: everything in the workspace was loadable when it entered.
`doctor` re-checks it workspace-wide. Run time is **strict-only**: `--in`
accepts workspace refs, not file paths; interactive sessions soften this
by offering an immediate import.

`model export` copies the file out verbatim (header included).

## 6. Transformation manifest

Declares what the CLI needs without loading code:
- `kind`: `m2m | m2t`
- source/target metamodel (+ version ranges)
- entry point + export name of the transformation class
- entry points of the package's own parts: metamodel module(s), decision
  model, binding model (these ship WITH the transformation; they are not
  workspace models)
- `variability` presence = the transformation is decision-based; it
  REFERENCES the decision/binding model modules — never duplicates the
  issue list (single source of truth; `transformation show` loads the decision model
  to display issues/options/defaults).

**OPEN:** manifest location — separate `synth.json` (docs' original spec)
vs `synth` block in `package.json` (partially implemented). Until decided,
the reader supports both; the writer/scaffolder follows the decision when
made. `transformation install` verifies manifest claims against the loaded class.

## 7. Execution semantics (`transformation run`, single step)

1. Read tx manifest → register metamodel schemas → render the package's
   decision + binding models (if decision-based).
2. Read input model header → topологically load its reference closure from
   the workspace → render input model.
3. Configuration — **uniform explicit-consent policy** (Phase 4,
   BREAKING; replaces the earlier "implicit defaults" behavior):
   decisions are NEVER applied without explicit user consent. A
   decision-based tx requires either `--config <ref>` or the
   `--default-configs` flag; with neither, the run aborts (exit 2)
   BEFORE any engine work, pointing at `config init` and
   `--default-configs`.
   - `--config <ref>`: load; **nominal check** (stamped tx/version,
     binding model, source model match) then **structural check** (binding
     model identity; every Choice's issue exists; every selectedOption
     belongs to its issue; ElementChoice elements resolve in the input
     model; uncovered issues fall back to `isDefault` — those defaults
     stay announced `(default)` and are materialized as real Choices;
     the consent flag governs only the WHOLLY-implicit case).
   - `--default-configs`: run `SourceModelToDefaultConfigurationModel`
     (source + binding → default ConfigurationModel), print every choice
     it contains, proceed. Fail only if an issue has no default.
     `--save-config <ref>` persists the generated config and is only
     valid together with `--default-configs` (`--config` +
     `--save-config` stays an error). The engine transformation ALWAYS
     receives a real ConfigurationModel — no special no-config path.
   - `--config`, `--default-configs`, or `--save-config` on a
     non-decision tx: error.
4. Execute. M2M → `exportToJSX` result to `--out` ref with provenance
   header. M2T → engine `generate` writes files under `--out-dir`.

`config init <tx> --for <model> [--out <ref>]` = the same default-config
generation, saved instead of used.

## 8. Interactive layer

- Candidate provider module: answers "which refs are valid here?" from
  manifests + headers only (fast, no engine). Filters by type: input
  models by the tx's source metamodel; chain continuations by the previous
  step's target metamodel; configs by binding model.
- Prompts: `@inquirer/prompts` (`select`, `search` type-to-filter) when a
  required value is missing AND stdin is a TTY (never in CI/`--json`).
- Shell tab-completion (extending `@oclif/plugin-autocomplete` scripts via
  a hidden fast completion command) comes later, wired to the same
  provider.

## 9. Out of scope for this effort

- Bidirectional/incremental transformations (parked design branch).
- Workspace metamodel registry (`metamodels/`).
- npm publishing of transformation packages (tx publish already shells to
  npm; untouched).
- JSON interchange export (possible later; workspace format stays TSX).
