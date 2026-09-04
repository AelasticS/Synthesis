# Bidirectional Transformations — Requirements

**Status**: Draft
**Phase**: 2 of synchronizing transformations
**Depends on**: Phase 1 (incremental forward) must be in place
**Author**: Sinisa Neskovic

## Problem Statement

The current engine, even with phase 1's incremental forward path, is strictly source-driven: changes to the source produce changes to the target. In several scenarios this is not enough:

- **User-portal editing** — users edit a target representation (a relational schema, a UI form) and expect those edits to flow back to the source model that produced it.
- **Decision-framework exploration** — users tweak target-side outcomes to see what source-side variability point or attribute would have to change to produce them.
- **Round-trip development** — generated code or models are hand-edited downstream; those edits must be reflected in the source so the next regeneration does not overwrite them.

A purely forward engine handles none of these without ad-hoc, error-prone reverse mappings written outside the transformation.

## Goals

1. **Target-to-source change propagation.** Given a target-side delta, the engine routes it through the trace to the producing rule's inverse, computes a source-side delta, and applies it.
2. **Opt-in per rule.** Rules without a declared inverse remain forward-only. Editing a target element they produced throws an explicit error rather than silently doing the wrong thing.
3. **Reuse phase 1 infrastructure.** Trace (with `parentRule` and `reads` edges), `SourceDelta`, immutable target store with structural sharing, and `transformIncremental` carry over. Bidirectional adds a backward routing pass, not a new engine.
4. **Lens laws as correctness oracle.** Well-behaved rules satisfy GetPut, PutGet, and (where applicable) PutPut. The test harness checks these per rule with property-based testing.
5. **Re-stabilization is automatic.** After applying the inverted source delta, the engine runs `transformIncremental` to bring the target back to a consistent state. The roundtrip should be a no-op for well-behaved rules.

## Non-Goals (Phase 2)

- **Pure-lens combinator DSL.** Restricting rule bodies to invertible combinators is rejected as too restrictive given the existing JSX + TypeScript freedom. Inverses are written by hand, not derived from rule structure (except for the trivial-mapping case in NFR-4).
- **Triple Graph Grammar (TGG) DSL.** Declaring rules as bidirectional *relations* instead of forward functions is a larger conceptual shift; revisit only if delta lenses prove inadequate.
- **Full statically-checked lens laws.** Laws are checked by test, not by the type system.
- **Conflict resolution for concurrent source-and-target edits.** Bidirectional propagation is one direction at a time. Concurrent edits and merge are out of scope.
- **Inverting `resolveTarget` composition automatically.** When rule B reads rule A's output via `resolveTarget`, composing their inverses for a target-side change to B's output may require source changes on A's input. Phase 2 supports this only if both rules' inverses are explicit; no auto-composition.

## Assumptions

- Phase 1 is implemented and stable. In particular:
  - Trace entries carry `parentRule` and `reads` edges.
  - `SourceDelta` and `transformIncremental` exist.
  - The target store is immutable with structural sharing.
- The target store can emit a `TargetDelta` analogous to how `aelastics-store` + `EventLog` emit source-side changes. If the target store does not yet have an event log (likely the case, since it is new in phase 1), one must be added — small scope.
- Rules are pure with respect to the engine: they do not mutate the source mid-transformation. Same assumption as phase 1.
- Each target element is produced by exactly one rule invocation. (Phase 1 requirement.) This is the only way the backward router can unambiguously identify the producing rule for a given target edit.

## Functional Requirements

### FR-1 `TargetDelta` type

A `TargetDelta` value captures one round of target-side changes, with the same shape as `SourceDelta`:

```ts
type TargetDelta = {
  created: { id: ElementId, typeName: string, initialProps: Record<string, unknown> }[]
  deleted: { id: ElementId, typeName: string }[]
  updated: { id: ElementId, changes: { property: string, oldValue, newValue }[] }[]
}
```

Constructible from a target-side event log, the same way phase 1's `SourceDelta` is constructed from `EventLog`.

### FR-2 `put` hook on `@E2E`

Each rule may optionally declare an inverse:

```ts
@E2E({
  put: (source: SourceElement, td: TargetDelta) => SourceDelta
})
RuleName(source: SourceElement): JSX.Element { ... }
```

The `put` function:

- Receives the **current** source element (post-any-prior-edits) and a `TargetDelta` filtered to changes that affect targets this rule produced
- Returns a `SourceDelta` describing the source-side changes to apply
- May throw `NonInvertibleEditError` for changes it cannot reverse (e.g., aggregation results, derived computed values)

### FR-3 Backward routing entry point

```ts
class abstractM2M<S, D, EM, P> {
  propagateBackward(
    prev: TransformResult<D>,
    targetDelta: TargetDelta,
    param?: P
  ): TransformResult<D>
}
```

The algorithm:

1. For each target element id in `targetDelta`, look up the producing trace entry. (Requires a target → entry reverse index, added in phase 2.)
2. Group changes by producing rule entry.
3. For each group, invoke the rule's `put`. If absent, throw `NonInvertibleRuleError` identifying the rule and target element.
4. Merge the resulting per-rule `SourceDelta`s into a single source-side delta.
5. Apply the source delta to the source model (via the same EventLog channel).
6. Call `transformIncremental(prev, sourceDelta)` to re-stabilize the target.
7. Return the new `TransformResult`.

### FR-4 Lens law test harness

A reusable test helper:

```ts
checkLensLaws({
  rule: 'Entity2Table',
  source: arbitrarySource(),
  targetEdits: arbitraryTargetEdits(),
  iterations: 1000,
})
```

Checks per-rule:

- **GetPut**: `transform(s)` followed by `propagateBackward` with an empty target delta yields the same source.
- **PutGet**: `propagateBackward(prev, td)` followed by re-reading the target yields a target consistent with `td`.
- **PutPut** (where defined): two successive `propagateBackward` calls collapse to the second one's effect.

### FR-5 Cycle detection

If applying a source delta and re-running `transformIncremental` produces a target delta that, when run through `propagateBackward`, produces a source delta that overlaps the original, the engine rejects the operation with `BidirectionalCycleError`. The detection runs only in dev mode by default; production builds rely on tests + correctness of per-rule `put`.

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Forward-only rules (no `put` declared) are unaffected by phase 2. Their forward path and trace are identical to phase 1. |
| NFR-2 | The target-side event log is opt-in. Applications using only forward transformation do not pay for change capture on the target. |
| NFR-3 | A target → producing-trace-entry index is built once per `TransformResult` and shares structure across versions just like the trace itself does. |
| NFR-4 | For rules whose JSX template is a *trivial* structural mapping (1-to-1 attribute copies, no computation), the engine auto-derives `put`. Detection is conservative: any branch, function call, or non-identity expression disables auto-derivation. The user can always override with an explicit `put`. |
| NFR-5 | Error messages on `NonInvertibleRuleError` and `NonInvertibleEditError` name the rule, the source element, the target element, and the offending property. |

## Out of Scope for This Document

- Concrete shape of the target-side event log (covered in design)
- Auto-derivation algorithm for trivial rules (covered in design)
- How `put` composes when target edits cross multiple producing rules (covered in design, with limits)
- Integration with the decision-framework's variability/specialization choices (deferred to a future document)

## Success Criteria

Working slice on `EER2RelTransformation`:

1. Renaming a `Table` (target edit) propagates back to renaming the corresponding `Entity` (source) and the next forward pass shows the new name with no further drift.
2. Adding a `Column` to a `Table` propagates to adding an `Attribute` to the corresponding `Entity` (where the rule's `put` is defined to support this).
3. Editing a derived/computed `Column` property throws `NonInvertibleEditError` with a clear message.
4. Property-based tests checking GetPut and PutGet pass for at least 1000 randomized edits per rule.
5. A target edit followed by `propagateBackward` followed by `transformIncremental` produces a target that is structurally equal (reference-equal where unchanged) to the result of applying the equivalent source edit directly and running `transformIncremental`.
