# Transformation composition: binding, chaining, companion outputs, and the host API

This record designs how Synthesis transformations are combined and
run outside the command line tool. It covers four connected
capabilities: transformations with several input models, transformations
with several output models, chaining transformations in the engine
itself, and a library host API through which any application (the CLI
today, the platform backend tomorrow) runs transformations. Nothing
here is built until the user approves it; the open decisions are
collected in the closing sections.

Designed with the user on 2026-09-16 (binding, chaining, companion
outputs, trace) and 2026-10-11 (free binding order and design-space
exploration); the host API part was drafted 2026-09-07.

## 1. Motivation and scope

Three limits of the current engine motivate the design:

- A transformation takes exactly one input model. Real transformations
  often need context: a naming-convention model, an organizational
  model, a configuration. The configuration model already gets in
  through a special path; every other kind of context has none.
- A transformation produces exactly one target model (plus its trace,
  which is hard-wired). A transformation that should produce, say, a
  DDL model and a documentation model cannot express it.
- Chaining exists only in the CLI. An application that imports
  transformation classes directly has no way to chain them except by
  re-implementing what the CLI does.

Behind the last point stands a larger one: the CLI's execution
machinery (loading models, rendering packages, resolving
configurations, running, serializing) is interleaved with its storage
and user-interface policy, so no second host can reuse it. The
platform (ADR-015, the per-tenant `models` domain) needs exactly that
reuse.

Out of scope, stated once: symmetric model merge and weaving, where
no input drives the traversal (section 3.3); higher-order
transformations as pipeline citizens (a research topic, section 3.5);
property-granular dependency tracking for incrementality (section 8).

## 2. The baseline today

The facts this design builds on, from the current code:

- **`abstractM2M<S, D, EM, P>`** (`libraries/synthesis/src/engine/
  transformations/abstractM2M.tsx`). `topRule(source: S)` and
  `transform(source: S, param?: P): D` take one input model and return
  one output model. The constructor is
  `constructor(store?: ModelStore, extra?: EM)` where
  `EM extends { [key: string]: IModel }`: a named record of secondary
  models already exists, but the engine never reads it; only
  subclasses do, and no shipped transformation uses it.
- **Configuration as a third constructor argument.** The decision-aware
  subclass `DecisionAwareM2M` takes the configuration model after
  `extra`, and the CLI constructs configuration-based transformations
  as `new Transformation(store, {}, configModel)` (`apps/cli/src/tx/
  execute.ts`, around line 863).
- **The trace is an effect, not an output.** `transform()` renders the
  `topRule` tree into the target model, then builds a second JSX tree
  for the trace (`createTraceModel()`) and renders it into the same
  store as its own model. Its header names one `source` model and a
  `targets` array holding one target model.
- **One instance per run.** The `M2MContext` is created per instance,
  and `transform()` accumulates trace records into it, so an instance
  is good for one run.
- **The CLI chain is composition by model passing.** `transformation
  run a b c` type-checks adjacency from the manifests
  (`chainStructureProblems` in `apps/cli/src/tx/chain.ts`: step N's
  target metamodel must equal step N+1's source metamodel), then hands
  each step's output model to the next step in memory.
- **The reference closure is an implicit product.** The input model's
  header references its companion models; `renderReferenceClosure`
  loads the whole closure into one store, and rules reach companions
  through the store.

## 3. Conceptual foundations

### 3.1 Currying is not composition

Currying and chaining are often confused, so the distinction is stated
precisely.

**Composition** runs one transformation, obtains a model, and feeds it
to the next. The thing flowing between steps is a model. The CLI chain
is composition.

**Currying** turns a function of several inputs into a sequence of
single-input stages:

```
f : (E1, E2, S) -> D        curried:   f : E1 -> (E2 -> (S -> D))
```

Applying the curried `f` to `e1` yields not a result but a smaller
function still waiting for its other inputs. Only the last application
produces a value. A curried transformation is therefore a sequence of
**bindings** followed by exactly one **run**. Nothing executes during
binding; each binding only captures an input in a closure.

In Synthesis terms: a function still waiting for inputs is a
constructed transformation instance that has not run; binding an input
is storing a model on the instance; the final application is
`transform(source)`, the only stage that traverses, fires rules, and
produces a trace.

```ts
const t0 = new Eer2Sql(store)                 // waiting for: naming, org, source
const t1 = t0.with('naming', namingModel)     // waiting for: org, source
const t2 = t1.with('org', orgModel)           // waiting for: source
const sql = t2.transform(eerModel)            // runs: the only execution
```

The current code already does this in two stages: the constructor
binds all secondary inputs at once, and `transform()` binds the last.

Curry intermediates are half-bound transformations, not models, so
they cannot flow through a pipeline whose hand-off is a model. In the
CLI, currying therefore appears not as chain steps but as flags on a
single run: `--config` binds one model before execution, and the
proposed `--with role=ref` (section 6) binds others.

### 3.2 Tupling: the store as the product

The second classical way to remove multiple inputs keeps everything
single-input: pack the inputs into one product and treat the
transformation as a function of the pack. Synthesis already has this
product: the store. `transform(source)` is formally single-input, but
its real input is the source plus everything loaded with it. The
named `extra` record (section 4) makes this product explicit and typed
instead of implicit.

### 3.3 The pivot and the context inputs

A rule-based transformation needs one input to drive it: `topRule`
traverses one root, and the trace and resolve machinery are keyed to
the elements met during that traversal. One input is therefore the
**pivot**, the model the manifest's source metamodel and the chain
type-check refer to; all others are **context** inputs that rules
read, query, and resolve against. ATL and QVT-R make the same
distinction: several source models, one driving traversal.

The pivot-plus-context shape covers the cases in view (an EER model
plus a naming-convention model; an organizational model plus a
workflow template library). The genuinely symmetric case, model merge
or weaving where neither input drives, still types as a curried
function, but becomes a design pattern (iterate A, look up in B, sweep
B for unmatched elements) rather than something binding provides. It
is out of scope for this mechanism.

### 3.4 Binding order is free; the pivot is a role, not a position

The pivot is a role in execution, not a position in the argument
list. Because the inputs form a named record, any subset can be bound
first and the rest supplied later. Binding the context first and
leaving the source last gives a reusable stage applied to many
sources. Binding the transformation and the source first and leaving
the configuration last gives the opposite: one source run under many
configurations.

```ts
const runLibrary = bindSource(EerToRelational, store, libraryModel)
const joined = runLibrary(joinedConfig)
const single = runLibrary(singleTableConfig)
```

The second order is **design-space exploration**: one source, many
configurations, compared side by side. The eer-to-sql suite page's
"One source, three configurations" section and its verification
script do exactly this today, by hand, through the CLI. With free
binding order it is one line per configuration, or
`configs.map(runLibrary)`.

Free binding order puts three requirements on the engine, all
addressed in section 4:

1. **A fresh instance and context per run**, so traces never
   accumulate across runs.
2. **The bound source stays read-only.** Rules must not mutate the
   source model, or one run contaminates the next. This holds today by
   convention; the design makes it a stated contract.
3. **Distinct target names per run.** Several runs into one store
   would otherwise collide on target model names. Each run takes its
   own target name (recommended, so outputs can be compared in one
   store) or its own store.

### 3.5 Higher-order templates: the same construction one level down

Higher-order templates already use the same idea. The workflow suite's
`Approval` template is curried: `(WriteStep) => (props) => JSX` binds a
step template first and the properties later. The two constructions
are the same construction at two levels:

- At the **transformation** level, the staged arguments are models;
  the intermediates are transformation objects.
- At the **template** level, the staged arguments are templates; the
  intermediates are template functions.

Currying is about taking arguments one at a time; higher-order is
about arguments that are themselves functions. They are orthogonal
and rest on the same foundation, closures. They also answer different
questions: a context model parameterizes a transformation by **data**
(something one edits, versions, and passes on the command line), a
template parameter by **behavior**. Configuration models, context
models, and higher-order templates are points on that axis.

Neither curry intermediates nor higher-order values can flow through a
pipeline that carries models. Everything is applied away before
anything reaches the store: what remains is first-order, fully bound,
single-input transformations over models. Treating transformations
themselves as models flowing through pipelines is possible in
principle (there is a transformation metamodel), but that is
higher-order transformation, a research topic.

## 4. The engine API

All functions in this section are pure engine level: callers import
transformation classes directly and hold a `ModelStore`. Nothing in
the CLI blocks them.

### 4.1 Context lifecycle

Context creation moves inside `transform()`: each run gets a fresh
`M2MContext`, so one instance (or one bound stage) can run many times
without traces accumulating. This is the real cost of the binding
API; the binders themselves are small.

### 4.2 Two binders over one mechanism

The mechanism is one: the input record must be filled before
`transform()` runs. The constructor remains the primitive. Two
ergonomic surfaces sit on top, both provided:

**`with()`, stepwise binding.** A generic method on `abstractM2M`,
returning a **fresh instance** (never mutating), so a half-bound
transformation can be shared safely between parts of a program:

```ts
const named = new Eer2Sql(store).with('naming', namingModel)
const a = named.with('org', orgA).transform(modelA)
const b = named.with('org', orgB).transform(modelB)
```

A typed accumulator makes the run available only once every declared
input is bound, in any order:

```ts
type Curried<S, D, Rest extends Record<string, IModel>, P> =
  keyof Rest extends never
    ? { run(source: S, param?: P): D }
    : { with<K extends keyof Rest>(name: K, m: Rest[K]): Curried<S, D, Omit<Rest, K>, P> }
```

**`bindInputs()`, one-shot binding.** A free function in the engine's
transformations module (not a static: it stays tree-shakeable and
works for subclass constructors with extra parameters). It takes the
class, the store, and all context inputs, and returns the residual
single-input function:

```ts
export function bindInputs<S extends IModel, D extends IModel,
                           EM extends Record<string, IModel>, P>(
  Tx: new (store?: ModelStore, extra?: EM) => abstractM2M<S, D, EM, P>,
  store: ModelStore,
  extra: EM
): (source: S, param?: P) => D {
  return (source, param) => new Tx(store, extra).transform(source, param)
}
```

The closure captures the class, not an instance, so every call builds
a fresh instance with a fresh context.

### 4.3 Free binding order: `bindSource()` and `partial()`

Section 3.4's opposite order gets its own entry point, binding the
transformation and the pivot and leaving the configuration:

```ts
const runLibrary = bindSource(EerToRelational, store, libraryModel)
const outputs = configs.map((config) => runLibrary(config))
```

The general form is one generic `partial(Tx, store, bound)` where
`bound` may hold any of `source`, `extra` roles, and `config`, and the
result is a function of whatever was left unbound, with the types
tracking the remainder. `bindInputs` and `bindSource` are its two
common specializations. Each call honors the three requirements of
section 3.4: fresh instance and context, read-only source, a
per-run target name (derived from the configuration's name by
default, overridable).

### 4.4 Composition: `chainTx()`

Binding produces single-input stages; composition glues them. The
engine-level composer uses the RxJS-style `pipe` overload set, where
each overload forces step N's output type to equal step N+1's input
type:

```ts
export function chainTx<A, B, C>(s1: (a: A) => B, s2: (b: B) => C): (a: A) => C
export function chainTx<A, B, C, D>(s1: (a: A) => B, s2: (b: B) => C,
                                    s3: (c: C) => D): (a: A) => D
// implementation: (input) => steps.reduce((v, s) => s(v), input)
```

```ts
const toDdl = chainTx(
  bindInputs(EerToRelational, store, {}),
  bindInputs(RelToSqlDdl, store, { naming: namingModel })
)
const ddl = toDdl(eerModel)
```

A model-to-text step can only be last, since text is not a model a
further step can take; the overloads type the last stage's output
freely, which expresses this naturally.

Programmatic chains get **static** adjacency checking through
generics; file-based chains keep **dynamic** adjacency checking
through manifests (`chainStructureProblems`). Same condition, checked
at the two binding times the two audiences work at.

## 5. Declaring context inputs

A manifest section declares the context inputs as named roles with
their metamodels, the way `variability` already declares the
configuration part:

```json
"extra": { "naming": "naming-metamodel", "org": "org-metamodel" }
```

Pre-flight then type-checks context inputs exactly as it type-checks
the pivot chain. The trace header's singular `source` becomes a role-
keyed collection (section 8).

## 6. Companion outputs: the named output record

The engine already produces two output models per run: the target and
the trace, rendered into one store, the trace referencing elements of
both by full path. The mechanism for several outputs therefore exists;
it is hard-wired to the trace. This section offers it to authors.

**A named record, not an array, not a container.** Outputs, like
context inputs, are roles with meanings (the DDL model, the
documentation model). The output side mirrors the input side: a named
record `DM extends { [role: string]: IModel }`. A mega model wrapping
all outputs is rejected as the mechanism: each output must remain a
standalone artifact conforming to its own metamodel, which the envelope
discipline requires (one model, one artifact, one metamodel; on the
platform, one row). A weaving model with element-level correspondences
between outputs is simply one more named output.

**One root template per output role.** A template tree is single-
rooted, and every element rendered in it belongs to the model whose
subtree it sits under. So instead of scattering elements of different
models through one tree, the transformation declares one root rule per
companion role beside `topRule` for the primary target, and
`transform()` renders each tree into the shared store in declared
order. Sharing between the trees uses two existing mechanisms:
cross-model references by full path (how trace entries already point
into two models) and `Resolve`, through which a companion tree looks
up elements the primary tree created.

**Rendering order.** The primary renders first, author-declared
companions next in declared order, and the trace **always last**,
because it references elements of every output.

**The trace becomes the built-in companion.** It stops being a special
case: every `abstractM2M` produces it, beside author-declared
companions in the same record.

**The spine.** One pivot input drives the transformation and one
primary output is `transform()`'s return value; together they form the
spine along which chains compose. Context inputs bind before the run;
companion outputs come out beside the spine and are persisted per
role. Companions never flow through a chain; only the spine does.

**Deferred: the portal.** If a single rule must ever emit elements into
two models at once, a portal tag (`<Into role="doc">...</Into>`,
React's portal is the precedent) can reparent a subtree under another
role's root during render. Designed here, deferred until a real case
needs it; per-role root templates plus references cover everything in
view.

The manifest declares output roles (role to metamodel) mirroring the
`extra` section, and the CLI gains per-role output flags (section 7).

## 7. CLI surface

- **`--with role=ref`**, repeatable: resolves the ref, renders its
  reference closure into the shared store through the same path as the
  input (`renderReferenceClosure`), and passes the record as the
  constructor's `extra`, which today receives a placeholder `{}`.
  Provenance records the bindings verbatim, as it records `--param`.
- **Chains**: `--with` binds to step 1 only, mirroring `--config` and
  `--param`, at least initially.
- **Companion outputs**: per-role destination flags (for example
  `--out-role doc=<ref>`), with the primary keeping `--out`; the trace
  keeps `--trace`.

## 8. The trace with several inputs and outputs

### How the trace is generated today

The trace is never written by rules; it is collected around them, in
four phases:

1. **During rule execution.** Every rule carries `@E2E`. When a rule
   fires on a source element, the decorator intercepts the returned
   JSX, filters out `Resolve` placeholders, determines the executed
   rule name (the dispatched option's name, if a specialization or
   variation point dispatched), and calls
   `context.makeTrace(sourceElement, jsxNodes, ruleName)`, which
   appends a raw record indexed by source element and by JSX node.
2. **During target render.** The renderer calls `resolveTargetForJSX`
   as it creates elements, filling each record's `targets` with the
   real created elements, so trace references carry real full paths.
3. **After render.** `createTraceModel()` builds a second JSX tree: a
   `TraceModel` header (transformation, timestamp, source model
   reference, target model references) with one `TraceEntry` per
   record. The decision-aware subclass attaches configuration
   resolutions here.
4. **Second render.** The tree is serialized (`traceJsx`) and rendered
   into the same store as its own model.

### What changes

**The entry grain stays.** One entry per rule execution: one pivot
element, one executed rule, many created elements (`targets` is
already an array). This grain is also the right unit for incremental
transformation: re-execute this rule on this element, replace these
targets.

**The header becomes role-keyed.** `sources` with the pivot
distinguished and each context model tagged by its role; `targets`
with the primary distinguished and each companion tagged by its role.
Target element references inside entries need no change: full paths
already encode which model an element lives in.

**Entries gain a read set.** An entry records what a rule produced but
not what it consulted. With context models that gap matters: if a rule
fired on entity `E` but consulted the naming model to choose a table
name, a change in the naming model must invalidate that entry. Entries
therefore gain an optional `reads` collection: references to the
context-model elements the execution consulted. The configuration
resolutions the decision-aware trace already records are the existing
special case of this read set, specialized to the configuration model.

Reads are captured pragmatically: resolve calls against context models
log themselves into the executing entry automatically, and rules that
navigate a context model directly call `context.noteRead(element)` (or
use a logging query API). Property-granular dependency tracking is a
research program and out of scope.

### What incrementality requires, and where it is met

| Requirement | Source in the trace |
|---|---|
| Correspondence, for update and delete propagation | entry source and targets (present) |
| The executed rule, including dispatched variant and configuration choices | entry rule name and resolutions (present) |
| The dependency footprint | the pivot element (present) plus the read set (new) |
| Structural placement of targets | full-path references (present) |

With the role-keyed header and per-entry reads, the trace is a
sufficient dependency graph for incremental re-execution at
rule-execution granularity.

## 9. The host API

The engine API of section 4 serves callers that hold transformation
classes and a store. A host needs more: everything the CLI does around
`transform()`. This section extracts that machinery into a documented
library surface, so the platform backend becomes a second client of
the engine the CLI drives.

### Why, and what the platform fixes

ADR-015 (platform-core) settles where Synthesis lands: a per-tenant
`models` domain, model-per-row storage with the serialized model (JSX)
in the row's content, the metamodel as data, and a reserved
transformation and generation layer, which is Synthesis's slot.
Orchestrators interpret models at run time; there is no code-generation
deploy. Two consequences bind the design:

- **The envelope rule.** Everything about a model as an artifact
  (conformance, references, versions, provenance) lives in the
  envelope: today the `$synth` header plus workspace ref, tomorrow the
  models-domain row. The host API consumes envelope facts through an
  interface and never parses `$synth` headers itself.
- **Type identity is a service contract.** The engine's `isTypeOf`
  checks work only when the model, the transformation, and the engine
  share one module instance per metamodel package. The CLI guarantees
  this with its loader; the host API states the same guarantee as a
  contract the platform can implement: one module resolver per process,
  one metamodel module instance per version.

### What the CLI does today

The load-bearing pieces, by file:

- **`models/loader.ts`**: `transpileModel` (esbuild with the
  externalize-bare-imports plugin over `resolveBareSpecifier`),
  `importModel`, `renderFactory`, `renderModel`,
  `renderReferenceClosure`/`renderModelClosure` (depth-first envelope
  closure), `writeGatedModelFile` (atomic gated writes). Host-agnostic
  at heart; coupled to files and to the CLI's resolution roots.
- **`tx/load.ts`**: `resolveInstalledTx` (workspace config),
  `renderTxParts` (manifest-ordered parts into a store),
  `renderModelWithTxContext`, `renderForGate`. Parts rendering is pure
  engine work; resolution and gating are CLI storage policy.
- **`tx/decisions.ts` and `tx/config-model.ts`**: the decision-model
  index, structural validation of a configuration against decision
  model, binding model, and input, default materialization, the
  default-configuration generator, the configuration serializer. Pure
  model computation; they live in the CLI only for historical reasons.
- **`tx/execute.ts`**: `executeRun`, which interleaves four
  responsibilities: (1) policy: the consent gate and the flag rules;
  (2) structure: chain type-checking, the coverage judgment, ref-claim
  checks; (3) engine work: closure and model rendering, parts
  rendering, configuration resolution and validation, instantiation,
  the in-memory `transform()` hand-off, model-to-text generation;
  (4) persistence and user interface: output verification, provenance
  headers, gated writes, document placement, trace persistence,
  announcements, exit codes, JSON reporting.

The extraction line runs between (2) and (3), which are the same for
every host, and (1) and (4), which are the host's own voice: the CLI
speaks flags, files, and exit codes; the platform will speak rows, API
results, and domain events.

### The surface: three abstractions

Working name `@aelastics/synthesis/host`, a subpath of the single
library.

**`ModelSource`**, how a host hands models to the engine:

```ts
interface ModelEnvelope {
  kind: string
  metamodel: string
  references: Record<string, string>
}
interface ModelSource {
  /** The envelope facts and the JSX module text of one model. */
  fetch(ref: string): Promise<{ envelope: ModelEnvelope; content: string }>
}
```

The CLI implements it over the workspace models tree; the platform over
models-domain rows. The closure walk moves into the library and walks a
`ModelSource`, so its semantics are written once. Context inputs bound
through `--with` load through the same walk.

**`ModuleHost`**, the type-identity contract made explicit:

```ts
interface ModuleHost {
  /** Import a model module from JSX text (transpile and import). */
  importModel(content: string, label: string): Promise<Record<string, unknown>>
  /** Import a module of an installed transformation package. */
  importPackageModule(packageDir: string, specifier: string): Promise<Record<string, unknown>>
}
```

The default implementation is today's esbuild pipeline with the
externalizing plugin, lifted from the CLI. The contract in one
sentence: every metamodel module reachable from a store is the same
instance for every importer in that store's session.

**`ExecutionSession`**, the engine work of `executeRun` with policy and
persistence stripped out:

```ts
const session = createSession({ source, modules })
const loaded = await session.loadInput(inRef)              // closure and model, one store
const tx = await session.loadTransformation(packageDir)    // manifest and parts
const cfg = await session.resolveConfiguration(tx, loaded, choice)
  // choice: an explicit configuration ref, or 'defaults'; the result
  // carries the validated configuration model and the structured
  // decision list (issue, option, element, isDefault)
const run = await session.execute(tx, loaded, cfg, { extra, param })
  // m2m: { outputs (primary and companions), traceJsx, store }
  // m2t: { documents } as name and text pairs
```

Everything the session returns is data. **Persistence stays with the
host**: the CLI keeps its provenance headers, gated writes, and
document placement; the platform writes rows and emits events.
**Consent stays with the host** as policy, but the judgment it needs
(which steps would run on generated defaults) is session logic,
exposed as data.

Chains at the host level are a loop over sessions, passing each run's
primary output as the next input, with the manifest type-check exposed
as a library function. That function is also what packaged chains
(`design/packaged-chains.md`) need. The engine-level `chainTx` and the
host-level loop are the same composition at two layers: one over
classes in memory, one over installed packages and refs.

### What does not move

The workspace (refs, directories, `$synth` headers, `synth.json`
discovery on install), the gated writer, the `model import` and
`model validate` user experience, interactive flows, completion, exit
codes, and every message the CLI prints. After the extraction the CLI
is the same product, implemented as the first client of the API it
used to inline.

## 10. Decisions for the user

Host API:

1. **Package shape.** Subpath `@aelastics/synthesis/host`
   (recommended: one library) or a separate package.
2. **Who owns esbuild.** A library dependency (recommended: the
   platform host needs transpilation exactly like the CLI), or a
   separate entry (`host/node` holding the esbuild implementation,
   `host` holding only contracts).
3. **Manifest reading.** `loadTxManifest` moves into the library as the
   one manifest reader (recommended), or stays with hosts and is passed
   in as data.
4. **Persistence contracts.** The session returns serialized artifacts
   and the host persists (recommended), or session-side persistence
   hooks.
5. **Scope of the first stage.** Start with the pure moves before any
   interface exists (recommended).

Engine API and model:

6. **Final names.** `with`, `bindInputs`, `bindSource`, `partial`,
   `chainTx`. (`with` is the builder idiom and was preferred over
   `bind`, which functional programmers read as monadic bind.)
7. **Per-run target naming** for free binding order: derived from the
   configuration name (recommended) or a separate store per run.
8. **`--with` in chains:** step 1 only, like `--config` (recommended),
   or per-step binding syntax.
9. **Companion outputs in the first stage**, or after a driving example
   exists.
10. **Role-keyed trace header and the read set** in the first stage,
    or with incremental transformation.
11. **Order:** engine helpers before or after the host API's first
    stage. Nothing blocks the engine helpers.

## 11. Staging

- **Stage E (independent, can go first):** context lifecycle per run;
  `with`, `bindInputs`, `bindSource`/`partial`, `chainTx`; the
  read-only source contract; tests including a design-space
  exploration test over the eer-to-sql Library sample and three
  configurations.
- **Stage 1:** pure moves: the decision and configuration computation
  (index, structural validation, materialization, coverage judgment)
  relocates into the library with its tests; the CLI re-exports.
- **Stage 2:** `ModelSource` and `ModuleHost` contracts in the
  library; the closure walk generalized over `ModelSource`; the CLI
  loader becomes the file-backed implementation.
- **Stage 3:** `ExecutionSession` extracted from `executeRun`; the CLI
  becomes its first client, behavior-preserving (the whole CLI suite
  and every smoke is the regression net).
- **Stage 4:** the proof: a small in-repo Node host that runs a
  transformation end to end through the API with no CLI involved.
- **Stage 5:** the `extra` manifest section and `--with`; companion
  outputs and the role-keyed trace, per decisions 9 and 10.
- **Docs per stage:** a developer-guide page for the engine API and one
  for the host API; CHANGELOG entries.

Full ladder per stage, merged --no-ff.

## Status

Drafted 2026-10-11 from the design discussions of 2026-09-07,
2026-09-16, and 2026-10-11. Awaiting the user's review of the
decisions in section 10.
