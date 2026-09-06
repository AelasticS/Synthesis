# The execution seam: a library host API for running transformations

The named next major workstream (user, 2026-09-06): extract the CLI's
load-bearing execution machinery into a documented library host API,
so the platform's Node backend (ADR-015's models domain) becomes a
second client of the same engine the CLI drives today. This record is
the design for the user's review; nothing is built until it is
approved.

## Why now, and what the platform fixes as the target

ADR-015 (platform-core, revised 2026-07-02) settles where Synthesis
lands: a per-tenant `models` domain owns the modeling discipline,
model-per-row storage holds the serialized model (JSX for Synthesis)
in the row's content, the metamodel is data, and the domain reserves
a transformation/generation layer, which is exactly Synthesis's slot.
Orchestrators interpret models at run time; there is no
code-generation deploy step. Two consequences bind this design:

- **The envelope rule.** Everything about a model as an ARTIFACT
  (conformance, references, versions, provenance) lives in the
  envelope: today the `$synth` header plus workspace ref, tomorrow
  the models-domain row. The host API must therefore consume envelope
  FACTS through an interface, never parse `$synth` headers itself.
- **Type identity is a service contract.** The engine's `isTypeOf`
  checks work only when the model, the transformation, and the engine
  share ONE module instance per metamodel package. The CLI guarantees
  this with its loader (bare imports externalized and resolved
  against one resolution root); the host API must state the same
  guarantee as a contract the platform can implement: one module
  resolver per process, one metamodel module instance per version.

## The seam inventory (what the CLI does today)

The load-bearing pieces, by file, with their host-coupling:

**`models/loader.ts`.** `transpileModel` (esbuild with the
externalize-bare-imports plugin over `resolveBareSpecifier`),
`importModel`, `renderFactory`, `renderModel`,
`renderReferenceClosure`/`renderModelClosure` (depth-first envelope
closure), `writeGatedModelFile` (atomic gated writes). Host-agnostic
at heart; coupled to files (paths, temp dirs) and to the CLI's
resolution roots.

**`tx/load.ts`.** `resolveInstalledTx` (workspace config),
`renderTxParts` (manifest-ordered parts into a store),
`renderModelWithTxContext` (parts + closure + file), `renderForGate`.
The parts rendering is pure engine work over a package directory; the
resolution and gating are CLI storage policy.

**`tx/decisions.ts` and `tx/config-model.ts`.** The decision-model
index, structural validation of a configuration against decision
model, binding model, and input, default materialization, the
default-configuration generator invocation, and the configuration
serializer. Pure model computation end to end; nothing in them needs
a file system. They live in the CLI only for historical reasons.

**`tx/execute.ts`.** `executeRun`, 900 lines that interleave four
different responsibilities: (1) POLICY: the consent gate (explicit
configuration or `--default-configs`, never silent defaults),
mutual-exclusion rules of the flag surface; (2) STRUCTURE: chain
type-checking from manifests, the coverage judgment
(`uncoveredDecisionSteps`), pairwise ref-claim checks; (3) ENGINE
WORK: closure and model rendering into one store, per-step parts
rendering, configuration resolution/validation/materialization,
instantiation (`importTxModule` + manifest entry/exportName),
`transform(root)` hand-off in memory, m2t `generate`; (4)
PERSISTENCE and UX: serialized-output verification against the
components module, provenance headers, gated workspace writes, doc
file placement, trace persistence, announcements, exit codes, JSON
reporting.

The extraction line runs between (2)+(3), which are the same for any
host, and (1)+(4), which are the host's own voice: the CLI speaks
flags, files, and exit codes; the platform will speak rows, API
results, and domain events.

## The proposed host API

A documented library surface, working name `@aelastics/synthesis/host`
(a subpath of the single library, per the consolidation doctrine),
built around three abstractions:

**`ModelSource`** is how a host hands models to the engine:

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

The CLI implements it over the workspace models tree (ref to path,
`$synth` parse); the platform over models-domain rows (envelope
columns, content column). The closure walk
(`renderReferenceClosure`) moves into the library and walks a
`ModelSource`, so the depth-first-references-first semantics is
written once.

**`ModuleHost`** is the type-identity contract made explicit: it
turns model content and package module specifiers into imported
modules whose bare dependencies resolve through ONE resolver.

```ts
interface ModuleHost {
  /** Import a model module from JSX text (transpile + import). */
  importModel(content: string, label: string): Promise<Record<string, unknown>>
  /** Import a module of an installed transformation package. */
  importPackageModule(packageDir: string, specifier: string): Promise<Record<string, unknown>>
}
```

The default implementation is today's esbuild pipeline with the
externalizing plugin, lifted from the CLI. The contract in one
sentence: every metamodel module reachable from a store must be the
same instance for every importer of that store's session.

**`ExecutionSession`** is the engine work of `executeRun` with the
policy and persistence stripped out. A host constructs a session over
a `ModelSource` and `ModuleHost`, then drives it:

```ts
const session = createSession({ source, modules })
const loaded = await session.loadInput(inRef)            // closure + model, one store
const tx = await session.loadTransformation(packageDir)  // manifest + parts
const cfg = await session.resolveConfiguration(tx, loaded, choice)
  // choice: an explicit configuration ref, or 'defaults'; the result
  // carries the validated, materialized configuration model and the
  // structured decision list (issue, option, element, isDefault)
const run = await session.execute(tx, loaded, cfg)
  // { targetRoot, targetJsx, traceJsx, store } for m2m;
  // { documents } (name and text) for m2t
```

Everything the session returns is data: the serialized target JSX
(with the tag list for component verification), the trace JSX, the
structured decision announcements, generated documents as name/text
pairs. PERSISTENCE STAYS WITH THE HOST: the CLI keeps its provenance
headers, gated atomic writes, and doc placement; the platform will
write rows and emit events. CONSENT STAYS WITH THE HOST as policy,
but the judgment it needs (which steps would run on generated
defaults) is session logic, exposed as data.

Chains stay a host-level loop over sessions (the in-memory hand-off
is just passing the previous `targetRoot` as the next input), with
the manifest type-check exposed as a library function, which is also
exactly the seam packaged chains (design/packaged-chains.md) will
need.

## What does NOT move

The workspace (refs, directories, `$synth` headers, `synth.json`
discovery on install), the gated writer, `model import`/`validate`
UX, interactive flows, completion, exit codes, and every message the
CLI prints. The CLI after the extraction is the same product,
implemented as the first client of the API it used to inline.

## Open decisions for the user

1. **Package shape.** Subpath export `@aelastics/synthesis/host`
   (recommended: one library, per consolidation), or a separate
   `@aelastics/synthesis-host` package.
2. **Who owns esbuild.** The transpile step needs esbuild. Options:
   esbuild becomes a dependency of the library (heavier library,
   simplest for hosts; recommended, since the platform host needs
   transpilation exactly like the CLI), or the `ModuleHost` default
   implementation ships in a separate entry so pure-engine consumers
   never load it (middle road: subpath `host/node` holding the
   esbuild-backed implementation, `host` holding only contracts).
3. **Manifest reading.** `loadTxManifest` (synth.json) moves into the
   library as the one manifest reader (recommended), or stays a host
   concern with the manifest passed in as data.
4. **Trace and configuration persistence contracts.** Recommended:
   the session returns serialized artifacts and the host persists;
   the alternative (session-side persistence hooks) couples the
   engine to storage again.
5. **Scope of stage one.** The extraction can start with the pure
   moves (decisions/config-model computation into the library) before
   any interface is introduced; low risk, immediately useful to both
   futures.

## Execution sketch (after approval)

Stage 1: pure moves, no interfaces: the decision/configuration
computation (index, structural validation, materialization, coverage
judgment) relocates into the library with its tests; the CLI
re-exports. Stage 2: `ModelSource` + `ModuleHost` contracts in the
library; the closure walk generalized over `ModelSource`; the CLI
loader becomes the file-backed implementation. Stage 3:
`ExecutionSession` extracted from `executeRun`; the CLI becomes its
first client, behavior-preserving (the whole CLI test suite and every
smoke is the regression net). Stage 4: the proof: a small in-repo
Node host (a test or example) that runs a transformation end to end
through the API with no CLI involved, which is the shape the platform
backend will copy. Docs: a developer-guide page for the host API and
the architecture note; CHANGELOG.

Full ladder per stage, merge --no-ff, no push, as always.

## Status

Drafted 2026-09-07 autonomously (user away), from the CLI seam
inventory at main 15cb340 and ADR-015 (platform-core). AWAITING the
user's review: the five open decisions above, then staging.
