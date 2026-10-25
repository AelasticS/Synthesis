# The outcome trace model

Agreed 2026-09-03/04 and delivered with the trace groundwork stage of
the eer-database-suite work (engine, trace metamodel, and CLI persistence, all
on main). Extracted 2026-09-08 from the retired flagship record when
that record was deleted; this document is the standing record of the
trace design and its rationale.

## The principle: outcomes, not mechanics

The trace records outcomes, not execution mechanics: nothing about how
dispatch selected a rule, no entries for abstract points, no repetition
of a choice per consulting call site.

Trace detail is therefore the AUTHOR'S dial: the trace records rule
executions plus the configuration options that selected them, so
behavior factored into rules is recorded and behavior inlined into a
rule's template is not. Choices that produce model elements should be
rule-shaped (a stacked `@E2E` `@VarPoint`), so their invocations carry real
targets; choices that return plain values (booleans, strings) cannot be
rules and are recorded on a plain `Invocation` of their option method. The
full-featured eer-to-relational transformation deliberately factors
fine-grained rules, being the detail showcase.

## The shape

- ONE invocation kind per call. An `Invocation` records a call of a
  transformation function: `function` (the executed concrete method,
  e.g. `kernelToTable`, `joinedHierarchy`; that an abstract point
  dispatched there is not recorded, the name is the record), an optional
  `parent`, optional `reads`, and `Resolution` children. A
  `RuleInvocation` (an `@E2E` rule) is the subtype that also carries
  `source` and `targets` (the rule's returned roots). An option method
  executed outside any `@E2E` rule is a plain `Invocation`; an option
  that is the direct target of an `@E2E` point is absorbed into that
  rule's invocation (the rule's `function` becomes the executed option
  method). The old entry kinds (`TraceEntry`, `VarPointTraceEntry`,
  `SpecPointTraceEntry`) and `ruleType` are retired. Invocation names are
  `function_source` (bare `function` when there is no source element),
  with an `_<n>` suffix from the second occurrence. A rule without a
  recorded outcome, or a discarded call, leaves no trace; its children
  are re-attached to its parent.
- `Resolution`: one consultation of a variability point (`@VarPoint`) by
  the option the carrying invocation executed. It holds `byDefault`
  (true when no condition was met and the `@Default` option ran) and
  `choices`: the configuration Choice elements in scope for the issue,
  including those whose option was not executed (condition not met).
  The executed option is the carrying invocation's `function`; issue and
  option names are not persisted (the resolution is named
  `r<counter>_<option>`, unique within the trace model).
- Attribution: every `Resolution` is a child of the invocation that
  executed the option, never of the model. Rule-shaped options carry it
  on their `RuleInvocation`, with real targets; an option that is not
  rule-shaped (a boolean strategy, a naming string) gets a plain
  `Invocation`, with `source` only when the element is named.
  `TraceModel` itself has no resolutions.
- Every resolved option is recorded, always: the option wrapper
  (`@VarOption`, `@SpecOption`) attaches the pending resolution set by
  `@VarPoint` to the invocation it enters.
- Trace references are FULL PATHS derived from the actual created
  elements (never reconstructed as model path plus name), which also
  keeps them correct under hierarchical name scopes.

## Metamodel diagram

```plantuml
@startuml trace-model
hide empty methods

class TraceModel {
  timestamp : string
  transformation : string [0..1]
  transformationVersion : string [0..1]
  sourceVersion : string [0..1]
}
class Invocation { function : string }
class RuleInvocation
class Resolution { byDefault : boolean }
class ReadRecord <<reserved>> {
  property : string [0..1]
  issue : string [0..1]
}

Model <|-- TraceModel
ModelElement <|-- Invocation
ModelElement <|-- Resolution
ModelElement <|-- ReadRecord
Invocation <|-- RuleInvocation

TraceModel --> "1" Model : source
TraceModel --> "*" Model : targets
TraceModel --> "0..1" ConfigurationModel : config
TraceModel *-- "*" Invocation : invocations
Invocation --> "0..1" Invocation : parent
Invocation *-- "*" Resolution : resolutions
Invocation *-- "*" ReadRecord : reads
RuleInvocation --> "1" ModelElement : source
RuleInvocation --> "*" ModelElement : targets
Resolution --> "*" Choice : choices
ReadRecord --> "0..1" ModelElement : element
ReadRecord --> "0..1" Invocation : entry
@enduml
```

## Forward compatibility for incremental transformation

The trace's second purpose (user requirement): supporting future
incremental transformation, per the design notes at
`design/synchronizing-transformations/` (MobX-inspired; the store is
already MobX-observable end to end, so automatic per-rule read-set
tracking is feasible later with no rule-code changes). The outcome
trace is the right spine but not sufficient alone (cross-element and
collection-membership reads are invisible), so the delivered v1
includes, at near-zero cost:

- stable invocation identity: (executed function name, source element path), not
  timestamps;
- `Resolution.byDefault` and `choices` as above;
- model-level slots on `TraceModel`: `source`, `targets`, `timestamp`,
  and optional `config`, `sourceVersion`, `transformation`,
  `transformationVersion`;
- a RESERVED, empty-by-default `reads` containment on the invocation
  (`ReadRecord`: optional `element`, `property`, `entry` (an
  invocation reference) and `issue`), so
  dependency data lands later without a metamodel migration;
- `parent` (the render walker knows the enclosing invocation).

Full read-set capture is future work.

## Per-element decision matching

The suspected id-assignment bug was DISPROVED during delivery:
aelastics-store's `Repository.deepCreate` passes a uuid generator into
the types layer's `newInstance`, so every created element carries a
generated `id` and per-element matching works correctly (the earlier
claim came from a truncated search that saw only the immutable store
branch). The outcome-trace test pins the behavior (two elements, two
element decisions, divergent choices). The matcher is hardened anyway:
object identity first, id equality only when both sides carry one.
Standing caveat: if `id` is ever dropped from metamodel-core, matching
must move fully to identity/path in the same change, since `id` is its
only other mechanism.

## CLI persistence

`transformation run --trace <ref>` writes the trace model to the
workspace the way `--out` writes the target model, single step, m2m and
m2t alike. The trace metamodel's components live on the
`@aelastics/synthesis/metamodels/trace` subpath (uniform with
decision/binding/configuration), so the write gate accepts its tags.
With `--default-configs` the effective configuration is synthesized per
run and would leave the trace's config reference dangling, so it is
persisted next to the trace at `<ref>-config`. The trace itself is
written UNGATED as a provenance report, with header references
`{sourceModel, targetModel, configModel}`.

Known cosmetic: the trace's transformation slot records the
esbuild-renamed class name; the authoritative manifest name and version
live in the header's `generatedBy`.
