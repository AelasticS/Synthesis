# Incremental Forward Transformations — Design Notes

**Status**: Draft
**Companion to**: [incremental-requirements.md](incremental-requirements.md)
**Author**: Sinisa Neskovic

## 1. Architectural Layering

```text
┌───────────────────────────────────────────────────────────┐
│  Source layer (existing)                                  │
│  • aelastics-store: mutable, MobX-observable              │
│  • EventLog captures objectCreated/Deleted/PropertyChanged│
│  → produces SourceDelta on demand                         │
└──────────────────────────┬────────────────────────────────┘
                           │ delta
                           ▼
┌───────────────────────────────────────────────────────────┐
│  Engine layer (extended)                                  │
│  • Trace with parentRule + reads edges                    │
│  • Incremental scheduler (dirty-set + topo sort)          │
│  • Find-or-create rendering of rule output                │
└──────────────────────────┬────────────────────────────────┘
                           │ new target version
                           ▼
┌───────────────────────────────────────────────────────────┐
│  Target layer (new)                                       │
│  • Immutable persistent store                             │
│  • Structural sharing of unchanged subtrees               │
│  • ID-based cross-references                              │
└───────────────────────────────────────────────────────────┘
```

Source stays mutable because that is how users edit it and how the EventLog captures deltas. Target becomes immutable because versioning and diffing are first-class concerns for incremental workflows.

## 2. Trace Extension

Today's `Invocation` ([trace-meta.model.ts](../../libraries/engine/src/transformations/trace/trace-meta.model.ts)):

```ts
type TraceEntry = {
  rule: string
  timestamp: number
  source: ModelElement
  targets: ModelElement[]
  ruleType: string
}
```

Add two fields:

```ts
type TraceEntry = {
  rule: string
  timestamp: number
  source: ModelElement
  targets: ModelElement[]
  ruleType: string
  parentRule: TraceEntryId | null   // containment: JSX-nesting parent
  reads: TraceEntryId[]             // lateral: resolveTarget() calls
}
```

**`parentInvocation`** captures JSX containment. When the template nests `<Column>` inside `<Table>`, the column's trace entry has the table's entry as parent. Recording this is cheap: the JSX render walker already knows the enclosing entry. When a parent rule is re-run, all child invocations are conceptually re-attached under the new parent target.

**`reads`** captures lateral data dependencies. Whenever a rule body calls `context.resolveTarget(otherSource, otherRule)`, the engine appends the resolved entry's id to the calling entry's `reads`. This is the edge MobX would record automatically by intercepting observable reads; for us it is recorded at the single chokepoint of `resolveTarget`.

Both fields together form a DAG over trace entries that the scheduler uses for transitive dirty propagation and topological ordering. Cycles (a rule that reads a target which transitively depends on its own output) are forbidden and detected at trace-build time.

## 3. The `SourceDelta` Type

```ts
type ElementId = string

type SourceDelta = {
  created:  { id: ElementId, typeName: string, initialProps: Record<string, unknown> }[]
  deleted:  { id: ElementId, typeName: string }[]
  updated:  { id: ElementId, changes: { property: string, oldValue: unknown, newValue: unknown }[] }[]
  // Containment changes are modeled as updates to the containing property.
}
```

Constructible from an `EventLog` action via a helper:

```ts
function deltaFromEventLog(log: EventLog, since: ActionId): SourceDelta
```

Causality ordering: creates come before any updates that reference them; deletes come last. The exact ordering algorithm is deferred to implementation but is straightforward over the event log timestamps.

## 4. The Incremental Algorithm

```text
function transformIncremental(prev, delta):
    // 1. Build the dirty set
    dirty := ∅
    for each updated/deleted element e in delta:
        for each entry in prev.context.sourceIndex[e]:
            dirty.add(entry)
    propagate(dirty)   // close under parentRule and reads edges (reverse direction)

    // 2. Identify new and orphaned invocations
    newSources    := delta.created
    orphanEntries := { entry ∈ prev.trace | entry.source ∈ delta.deleted }

    // 3. Topo-sort the work
    work := topoSort(dirty ∪ entriesForNewSources(newSources))
    // Order: producer before consumer; parent before child.

    // 4. Execute
    newTarget := prev.target          // persistent: starts as same reference
    newTrace  := prev.trace
    for entry in work:
        result := invokeRule(entry.rule, entry.source)   // returns ExprNode
        (newTarget, newEntry) := renderFindOrCreate(result, prev, entry)
        newTrace := newTrace.replace(entry.id, newEntry)
    for entry in orphanEntries:
        (newTarget, newTrace) := removeTargets(newTarget, newTrace, entry)

    // 5. Return a new version
    return { target: newTarget, trace: newTrace, version: prev.version + 1 }
```

`renderFindOrCreate` is the immutable-update primitive: given a JSX `ExprNode` produced by a rule and a prior trace entry, it either reuses the prior target element (if structurally unchanged) or produces a new immutable element with the path-from-root rebuilt.

## 5. Immutable Target Store

### 5.1 Why immutable

- **Versioning is free.** Each `TransformResult` keeps a reference to its target root; old versions remain valid until released.
- **Diffing is reference equality.** A consumer comparing `prev.target` and `next.target` walks until reference-equal subtrees, ignoring whole branches.
- **No identity-management bugs in re-run.** The engine never has to ask "is this the same element I produced last time, and should I mutate it or replace it?" — the answer is always "produce a new node; structural sharing handles the rest."

### 5.2 Why structural sharing is cheap, not expensive

A common worry is that "producing a new version copies the unchanged elements". It does not. With persistent data structures, the new root shares all unchanged subtrees by reference with the old root. Only the path from root to changed nodes — typically `O(log n)` or `O(depth)` — gets new identity. This is the same mechanism that makes React reconciliation and Clojure persistent maps practical.

### 5.3 Cross-reference representation — the crux

Structural sharing collapses if target elements reference each other by **direct object pointer** across a graph (not just a tree). Example: a `Column` holds a foreign-key pointer to a `Table`. If `Table T` changes, every `Column` pointing to `T` must be re-created with a new pointer, every `Table` containing such a `Column` must be re-created, and so on — the sharing benefit vanishes.

The fix is to represent cross-references by **stable ID** and resolve them through a root-level index map. Then a change to `T` produces a new `T` entry in the map; references to `T` (which are strings or symbols) remain valid without copying their holders.

This is the approach MST (mobx-state-tree) and Datomic use. Immer-style direct refs work only within a single tree, not across a reference graph.

**Required audit** (see Open Questions): how do current target metamodels represent cross-references? If they use direct object refs, the immutable layer must include an ID-resolution scheme, and the JSX render layer must translate between object refs (ergonomic for rule authors) and ID refs (required for sharing).

### 5.4 Implementation options

| Option | Pros | Cons |
| --- | --- | --- |
| Use [Immer](https://immerjs.github.io/immer/) | Mature, ergonomic, integrates with TS | Optimized for trees, not reference graphs |
| Use [mobx-state-tree](https://mobx-state-tree.js.org/) snapshots | Models + snapshots + structural sharing in one library | Heavy; opinionated; duplicates aelastics-store concerns |
| Hand-rolled persistent store with HAMT/RRB-tree | Tailored to Synthesis metamodel; smallest dependency surface | Implementation cost |
| Adapt aelastics-store with a "snapshot at version" API | Minimal new code; reuses metamodel | Mutable substrate is awkward for sharing; risk of subtle bugs |

Recommendation: **prototype with Immer** for the first vertical slice, refactor to a hand-rolled store if the reference-graph problem (5.3) makes Immer impractical. Defer the choice until after the metamodel audit.

## 6. Find-or-Create Rendering

The current `render<D>(context)` ([abstractM2M.tsx](../../libraries/engine/src/transformations/abstractM2M.tsx)) creates target instances on the fly. For incremental, rendering must consult the previous trace:

```text
function renderFindOrCreate(exprNode, prevContext, priorEntry):
    if priorEntry exists and exprNode structurally matches priorEntry.targets:
        return (priorTargets, priorEntry)              // reuse — structural share
    else:
        newTargets := createImmutableNodes(exprNode)
        return (newTargets, makeTraceEntry(newTargets, ...))
```

"Structurally matches" means: same node type, same own properties, same child JSX structure (recursively, with same find-or-create check on children). When a match succeeds at any subtree, the entire subtree is reused.

## 7. Vertical Slice Plan

Target: prove the design on `EER2RelTransformation`.

1. **Trace extension** — add `parentInvocation` and `reads` to `Invocation`; record them in `M2MContext`.
2. **Delta builder** — `deltaFromEventLog` helper in `aelastics-store` or `engine`.
3. **Scheduler** — pure-function `computeDirtySet(prev, delta)` and `topoSort`. Unit-testable in isolation.
4. **Immutable target layer (minimal)** — Immer-based wrapper around the existing target metamodel. Accept the cross-reference limitation for the slice; document the workaround.
5. **`transformIncremental` entry point** on `abstractM2M`.
6. **Property-based test** — random deltas, compare incremental vs batch results for structural equality.

Estimated effort: ~1 week to a working slice on the EER example, plus 2–3 weeks to cover deletes, decision-framework integration, and a proper persistent-store backend.

## 8. Open Questions

1. **Target cross-reference representation.** Object refs or IDs in current metamodels? Audit needed before locking the persistent-store design.
2. **Cycle detection in the trace.** Can two rules legitimately read each other? If yes, what is the intended semantics?
3. **Decision-framework re-execution.** When a `@VarPoint` decision changes (not a source element change), how does it map to a `SourceDelta`? Likely needs a separate `DecisionDelta` type. Out of scope for slice but should not be designed-out.
4. **Rule purity enforcement.** The design assumes rules do not mutate source or perform I/O. Is this enforced anywhere, or only conventional? Worth either documenting in `writing-transformations.md` or runtime-asserting in dev mode.
5. **Trace entry identity (`TraceEntryId`).** How is it generated? Stable across re-runs of the same `(source, rule)` pair? Probably yes; needed for `reads` references to remain valid.
6. **Version retention policy.** Who decides when an old `TransformResult` can be released? Consumer's responsibility, or engine-side LRU? Affects memory characteristics in long-running sessions.
7. **Bidirectional readiness.** Will the abstractions chosen here (especially trace + delta + immutable target) generalize cleanly to phase 2 bidirectional, or are we baking in forward-only assumptions? Worth a pass before locking the API.
