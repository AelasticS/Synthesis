# Bidirectional Transformations — Design Notes

**Status**: Draft
**Companion to**: [bidirectional-requirements.md](bidirectional-requirements.md)
**Builds on**: [incremental-design.md](incremental-design.md)
**Author**: Sinisa Neskovic

## 1. Position in the BX Design Space

The classical bidirectional transformation literature offers several distinct approaches. Briefly:

| Approach | Idea | Why we do / don't use it |
| --- | --- | --- |
| **Classical lenses** (Foster/Pierce et al.) | `get: S → V`, `put: S × V' → S'`; rules built from invertible combinators; laws statically guaranteed | **Rejected.** Requires restricting rule bodies to a small invertible algebra; incompatible with Synthesis's "rule body is arbitrary TypeScript + JSX" model. |
| **Symmetric / complement lenses** | Both sides editable; "complement" stores what each side doesn't know about the other | Interesting for the round-trip case but adds significant machinery (the complement value). Defer. |
| **Triple Graph Grammars (TGG)** | Each rule is a *relation* between source pattern and target pattern; engine derives forward and backward from one spec | **Rejected for v1.** Would mean rewriting the rule DSL into a pattern language. Large conceptual shift, not justified by current use cases. |
| **QVT-R** | Declarative bidirectional relations; check or enforce direction | Same objection as TGG. |
| **Edit lenses / delta lenses** (Hofmann/Pierce, Diskin) | Operate on *edits* / *deltas* rather than whole states; `put: Δ_V → Δ_S` instead of `put: V' → S'` | **Selected.** Fits Synthesis directly: phase 1 already gives us deltas on both sides and a trace that maps target edits to producing rules. |

The phase 2 design is **delta lenses scoped to one rule at a time**, with explicit user-written inverses and lens laws checked by property tests. This is pragmatic, not theoretically maximal, but it is the smallest design that solves the actual user problems without compromising Synthesis's existing DSL ergonomics.

## 2. Architectural Layering (additions over phase 1)

```text
┌──────────────────────────────────────────────────────────────┐
│  Target layer (phase 1) + new target event log               │
│  • Immutable persistent store                                │
│  • TargetEventLog captures created/deleted/propertyChanged   │
│  • → produces TargetDelta on demand                          │
└──────────────────────────┬───────────────────────────────────┘
                           │ TargetDelta
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Engine layer (phase 1) + backward routing                   │
│  • Target → producing-entry reverse index                    │
│  • propagateBackward(prev, targetDelta)                      │
│  • Per-rule put hooks; auto-derived for trivial rules        │
│  • Lens-law test harness                                     │
│  • Cycle detection (dev mode)                                │
└──────────────────────────┬───────────────────────────────────┘
                           │ SourceDelta (computed from put)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Source layer (existing)                                     │
│  • Source delta applied via EventLog                         │
│  • Phase 1 transformIncremental re-stabilizes the target     │
└──────────────────────────────────────────────────────────────┘
```

Source and target are now both *event-emitting* and *delta-consuming*. The engine sits between them and arbitrates which direction propagation flows for any given operation. Within a single `propagateBackward` call, the flow is strictly target → engine → source → (phase 1 incremental) → target.

## 3. Trace Reverse Index

Phase 1's trace is indexed by source (`sourceIndex: Map<source, TraceEntry[]>`). Phase 2 adds:

```ts
class M2MContext {
  // existing
  sourceIndex: Map<IModelElement, TraceEntry[]>
  // new
  targetIndex: Map<IModelElement, TraceEntry>   // each target produced by exactly one entry
}
```

Building `targetIndex` is incremental and free: it's populated during the same JSX render pass that fills `sourceIndex`, with one entry per target element. Lookup is O(1).

Under structural sharing, `targetIndex` for version `v+1` shares entries with version `v` for unchanged trace entries — same persistent-map semantics as the rest of the trace.

## 4. The `put` Hook

```ts
type PutFn<S extends IModelElement, T extends IModelElement> =
  (source: S, td: TargetDeltaForElement<T>) => SourceDelta

type TargetDeltaForElement<T> = {
  // The full TargetDelta filtered to changes affecting elements of type T
  // that this rule's invocation produced.
  created: ...; deleted: ...; updated: ...
}

@E2E({ put: (entity: IEntity, td) => { ... } })
Entity2Table(e: IEntity): JSX.Element { ... }
```

### 4.1 Contract

- `put` is called **once per producing rule entry** affected by a `TargetDelta`. The runtime groups the incoming delta by producing entry before invocation.
- `put` sees the *current* source element (post-any-prior-edits in the same propagateBackward call). Order of invocation follows reverse-topological order on the trace DAG (consumers before producers), so a `put` for a rule that reads another rule's output sees a stable upstream source state.
- Throwing `NonInvertibleEditError` is a legal response; the engine surfaces it without retrying.
- The returned `SourceDelta` is **merged** with deltas from other rule's `put` invocations into a single source delta, which is then applied atomically before `transformIncremental` is called.

### 4.2 Why the source is passed in

Many inverses need read access to other parts of the source (e.g., to translate a target id back to the source attribute it derived from). The `put` body is allowed to read the entire source model; it just must not mutate it directly. Mutations happen via the returned `SourceDelta`.

## 5. The `propagateBackward` Algorithm

```text
function propagateBackward(prev, targetDelta):
    // 1. Group target changes by producing rule entry
    perEntry := Map<TraceEntry, TargetDeltaForElement>()
    for each change c in targetDelta:
        entry := prev.context.targetIndex[c.elementId]
        if entry is undefined:
            throw OrphanTargetEditError(c)
        perEntry[entry].add(c)

    // 2. Reverse-topo-sort the affected entries
    work := reverseTopoSort(perEntry.keys())   // consumers before producers

    // 3. Invoke per-rule put hooks
    sourceDelta := emptyDelta()
    for entry in work:
        rule := lookupRule(entry.rule)
        if rule.put is undefined and not isTriviallyInvertible(rule):
            throw NonInvertibleRuleError(rule, perEntry[entry])
        partial := rule.put(entry.source, perEntry[entry])
        sourceDelta := merge(sourceDelta, partial)

    // 4. Apply source delta + re-stabilize target
    applyDeltaToSource(prev.context.source, sourceDelta)
    next := transformIncremental(prev, sourceDelta)

    // 5. Optional cycle check (dev mode)
    if devMode and detectCycle(targetDelta, next, prev):
        throw BidirectionalCycleError(...)

    return next
```

### 5.1 Why reverse-topological

If rule B reads rule A's output, then B's `put` may want to suggest source-side changes that should land *before* A's `put` reconsiders them. Running B first gives B a stable source. After all `put`s collect their `SourceDelta`s, they are merged and applied in one go. This is the same intuition as MobX's glitch-free derivation order, played backwards.

### 5.2 Merge semantics

When two `put` calls produce overlapping source changes (same source element, same property), the merge is conservative:

- **Same value** → keep one copy
- **Different values** → throw `ConflictingInverseError` naming both producing rules

We do not silently pick a winner. Real conflicts mean the two inverses disagree about what source state would produce the requested target state; that is a bug in one of the rules, not something the engine should paper over.

## 6. Auto-Derivation for Trivial Rules

Many rules in practice are 1-to-1 mappings:

```tsx
@E2E()
Attribute2Column(a: IAttribute) {
  return <Column name={a.name} type={this.getColumnType(a.domain)} isKey={a.isKey} />
}
```

For rules whose JSX is *purely structural* (every attribute on the output is either a constant, or an unmodified read from a single source property), the engine can synthesize `put`:

```ts
put: (a, td) => {
  if (td.kind === 'propertyChanged' && td.property === 'name')
    return updateSource(a, 'name', td.newValue)
  if (td.kind === 'propertyChanged' && td.property === 'isKey')
    return updateSource(a, 'isKey', td.newValue)
  throw NonInvertibleEditError(...)   // type came from getColumnType — not auto-invertible
}
```

### 6.1 Detection algorithm (conservative)

Walk the JSX tree returned by a sample invocation of the rule. For each attribute value:

- Literal → not invertible (target change is a no-op on source)
- Direct property read of the rule's argument (e.g., `a.name`) → invertible; record the source property
- Anything else (function call, expression, conditional) → not auto-invertible for that attribute

Auto-derivation is **opt-in via a flag** (`@E2E({ autoPut: true })`) to avoid surprising users with mechanically generated behavior. Default remains: forward-only unless explicit `put`.

### 6.2 Why opt-in

A "trivial" detection heuristic that fires automatically risks producing bidirectional behavior the user did not intend. Making it explicit keeps responsibility with the rule author.

## 7. Lens Law Test Harness

```ts
import { checkLensLaws } from '@synthesis/engine/testing/bidirectional'

test('Entity2Table satisfies GetPut and PutGet', () => {
  checkLensLaws({
    transformation: new EER2RelTransformation(store),
    rule: 'Entity2Table',
    sourceArbitrary: arbEntity(),
    targetEditArbitrary: arbEntityTargetEdit(),
    iterations: 1000,
  })
})
```

The harness generates random source elements and random target edits, runs the round-trips, and asserts:

- **GetPut**: `propagateBackward(prev, emptyDelta) === prev` (no spurious changes)
- **PutGet**: applying `targetDelta`, propagating backward, and re-rendering yields a target whose differences from `prev.target` are exactly those described by `targetDelta` (or a subset if the edit was partially invertible)
- **PutPut** (optional): two consecutive `propagateBackward(td1)` then `propagateBackward(td2)` is equivalent to `propagateBackward(merge(td1, td2))` for compatible deltas

Failed laws produce a minimized counterexample for debugging.

## 8. Composition Across Rules (Limits)

When a target edit crosses multiple producing rules (e.g., a `Column` referencing a foreign-key `Table`, where renaming the FK semantically means editing both the `Column` rule's output and the `Table` rule's output), the algorithm in §5 handles it correctly **as long as each rule's `put` is honest about its local effect**. The merge step catches contradictions.

What is **not** supported in v1: rule B's `put` computing a `SourceDelta` that implicitly depends on running rule A's `put` first and seeing its source-side effect. Each `put` sees the pre-application source. If you need staged backward propagation, write it as multiple `propagateBackward` calls.

## 9. Vertical Slice Plan

Target: prove the design on `EER2RelTransformation`, building on the phase 1 slice.

1. **Target event log** — minimal change-capture layer on the immutable target store. Mirrors `aelastics-store`'s `EventLog` shape.
2. **`targetIndex`** — populated during render, shared across versions.
3. **`put` hook on `@E2E`** — type-level support and runtime invocation.
4. **`propagateBackward`** — the algorithm in §5.
5. **One hand-written `put`** for `Entity2Table` (table rename → entity rename).
6. **Lens law harness** — minimal property-based test for GetPut/PutGet on that one rule.
7. **Demo**: target rename → propagateBackward → transformIncremental → identical end state to source rename.

Estimated effort: ~2 weeks after phase 1 is in place. Auto-derivation, cycle detection, and the broader rule coverage add another 2–3 weeks.

## 10. Open Questions

1. **Source element identity across edits.** When `put` returns a `SourceDelta` that *creates* a new source element, how does that element get an id that the trace can hook into for the next forward pass? Probably the engine assigns one, but the contract needs spelling out.
2. **Inverses for `@SpecPoint` and `@VarPoint`.** When a target edit affects a specialized output (e.g., a relationship mapped via the "child-merging-to-parent" strategy), should the inverse propagate to the variability/specialization choice, the source element, or both? Likely needs a separate `put` per option. Out of scope for v1 slice.
3. **User-portal integration.** The user-portal at `apps/user-portal/.../dms/$repoId` is the most likely first consumer. What change events does it emit when a user edits a target view? Does it already serialize them into a delta-compatible shape, or will an adapter be needed?
4. **Conflict policy.** Is `ConflictingInverseError` always a bug, or are there legitimate cases (commutative updates with different normalizations) where the engine should pick one? Probably bug-only for v1; revisit with examples.
5. **Cycle detection cost.** Running detection in dev mode means a second `propagateBackward` simulation per call. Acceptable for dev; verify before considering it for production.
6. **Composition with phase 1 incremental.** After `propagateBackward` applies a source delta, the subsequent `transformIncremental` must not re-trigger backward propagation for its own resulting target delta. Need a flag on the source delta marking it as "already from backward routing" to prevent infinite loops.
7. **Bidirectional + decision-framework.** A decision change can produce a forward-only re-transformation (no backward equivalent). When mixed with bidirectional rules in the same transformation, the interaction is unexplored. Likely deferred to phase 3.
