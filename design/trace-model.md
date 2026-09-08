# The outcome trace model

Agreed 2026-09-03/04 and delivered with the trace groundwork stage of
the eer-to-sql work (engine, trace metamodel, and CLI persistence, all
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
rule-shaped (a stacked `@E2E` `@VarPoint`), so their entries carry real
targets; choices that return plain values (booleans, strings) cannot be
rules and are covered by the recording safety net below. The
full-featured eer-to-relational transformation deliberately factors
fine-grained rules, being the detail showcase.

## The shape

- ONE entry kind. An entry: source element, `rule` (the executed
  concrete method, e.g. `kernelToTable`, `joinedHierarchy`; that an
  abstract point dispatched there is not recorded, the name is the
  record), targets (the rule's returned roots), and `Resolution`
  children. `VarPointTraceEntry`, `SpecPointTraceEntry`, and `ruleType`
  are retired. Entry names are `rule_source` with an occurrence suffix.
- `Resolution`: issue name and option name in DECISION-MODEL language
  (`Option("...")` carries its declared name into the registration), a
  reference to the configuration's Choice element or `byDefault: true`,
  and an OPTIONAL element reference for consultations scoped to an
  element other than the entry's source.
- Attribution: a resolution (issue, element) rides the entry whose
  source is that element when one exists; otherwise it sits at model
  level with an explicit element reference. Global (ModelIssue)
  resolutions are recorded once, at model level. Design guidance: bind
  each ElementIssue to an element some rule transforms and the trace
  stays fully regular.
- The two-tier guarantee: every resolved option is recorded, always.
  Tier one, rule-shaped choices carry their resolution on their own
  entry with real targets. Tier two, non-rule choices (a boolean
  strategy, a naming string): each VarPoint firing records one fact
  (issue, element or global, option, choice or default) into a per-run
  map, deduplicated (resolution is deterministic per issue and
  element), attached at trace assembly per the attribution rule.
- Trace references are FULL PATHS derived from the actual created
  elements (never reconstructed as model path plus name), which also
  keeps them correct under hierarchical name scopes.

## Forward compatibility for incremental transformation

The trace's second purpose (user requirement): supporting future
incremental transformation, per the design notes at
`design/synchronizing-transformations/` (MobX-inspired; the store is
already MobX-observable end to end, so automatic per-rule read-set
tracking is feasible later with no rule-code changes). The outcome
trace is the right spine but not sufficient alone (cross-element and
collection-membership reads are invisible), so the delivered v1
includes, at near-zero cost:

- stable entry identity: (executed rule name, source element path), not
  timestamps;
- the `Resolution` element reference and `byDefault` as above;
- model-level slots: configuration reference, source model reference
  plus version/hash slot, transformation name plus version;
- a RESERVED, empty-by-default `readSet` containment on the entry
  (elements, properties, entry references, consulted issues), so
  dependency data lands later without a metamodel migration;
- `parentRule` (the render walker knows the enclosing entry).

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
