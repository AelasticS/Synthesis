# Incremental Forward Transformations — Requirements

**Status**: Draft
**Phase**: 1 of synchronizing transformations
**Author**: Sinisa Neskovic

## Problem Statement

`abstractM2M.transform(source)` is fully batch: every invocation walks the entire source model, re-executes every rule, and produces a fresh target model and trace. For workflows where the source is edited interactively or repeatedly (decision-framework choice exploration, live editing in the user-portal, regeneration after small refactorings), the cost of re-transformation scales with **model size** rather than **change size**.

## Goals

1. **Re-run only affected rules.** Given a delta of source changes, identify the minimal set of rule invocations that must be re-executed using the trace as the dependency map.
2. **Produce a new target version**, not a mutated one. Old and new versions must coexist so consumers can diff them.
3. **Preserve semantic equivalence with batch.** For every source state `S` and delta `Δ`, the result of `transformIncremental(prev, Δ)` must equal `transform(applyDelta(prev.source, Δ))` modulo non-deterministic rule output.
4. **Reuse the existing trace abstraction.** Extend, do not replace, `Invocation` and `M2MContext`.
5. **Leverage existing change detection.** Build the delta from the `EventLog` that `aelastics-store` already attaches to observable source models — no new instrumentation on user code.

## Non-Goals (Phase 1)

- **Bidirectional propagation.** Target-side edits do not flow back to source. That is phase 2.
- **Concurrent mutation.** Source must be quiescent during `transformIncremental`. No locking or transactions.
- **Decision-framework integration.** `@SpecPoint` / `@VarPoint` rules are out of scope for the first slice. They can be re-added once the core scheduler is proven on `@E2E` rules.
- **Glitch-free guarantees for arbitrary rule graphs.** Topological scheduling is required, but cycles (rules that mutually read each other's output) are rejected at trace-build time rather than handled.
- **Replacing the batch path.** `transform()` remains the cold-start path and the correctness oracle.

## Assumptions

- Source models created via `Repository.create()` are MobX-observable and have an `EventLog` attached. Change types available: `objectCreated`, `objectDeleted`, `propertyValueSet`, `objectInserted`, `objectRemoved`.
- Rule methods decorated with `@E2E()` are pure with respect to side effects outside the engine: they read source state and (optionally) call `context.resolveTarget(...)`, and they return a JSX `ExprNode` tree. They do not mutate source, do not mutate target directly, and do not perform I/O.
- Target elements are produced by exactly one rule invocation (already enforced by JSX template structure).
- A rule invocation can produce one *or more* target elements (already supported in `TraceEntry.targets: ModelElement[]`).

## Functional Requirements

### FR-1 Delta type

A `SourceDelta` value captures one round of source changes:

- Per-element operation list: `Created | Deleted | Updated(propertyChanges[])`
- Stable ordering by causality (parent-before-child for creates; child-before-parent for deletes is optional but useful)
- Constructible from an `EventLog` action segment

### FR-2 Incremental entry point

```ts
class abstractM2M<S, D, EM, P> {
  transformIncremental(prev: TransformResult<D>, delta: SourceDelta, param?: P): TransformResult<D>
}

type TransformResult<D> = {
  target: D
  trace: TraceModel
  version: number  // monotonically increasing
}
```

- Result is a **new** `TransformResult`. The `prev` argument is not mutated.
- On any internal error, falls back to batch `transform()` and logs. (Soft requirement; correctness over performance.)

### FR-3 Dirty-set computation

Given `delta`, the runtime must identify:

- **Directly dirty invocations** — rule invocations whose source element appears in the delta (looked up via `M2MContext.sourceIndex`)
- **Transitively dirty invocations** — rule invocations that read (via `parentInvocation` or `reads` edges, see design doc) a target produced by a directly dirty invocation, recursively to fixpoint
- **New invocations** — rules that should run for newly created source elements (determined by re-invoking the template's element-selection logic, scoped to the delta)
- **Orphaned invocations** — invocations whose source element was deleted; their targets must be removed

### FR-4 Scheduling

Re-execution order must be a topological sort of the dirty subgraph (parent before child, producer before consumer). Cycles are an error; the runtime rejects the delta and falls back to batch.

### FR-5 Target versioning

Each `TransformResult` is immutable. Re-execution produces a new target tree that **shares structure** with the previous version: unchanged subtrees are the same object references. (See design doc for the persistent-data-structure rationale.)

### FR-6 Trace versioning

The new `TraceModel` is also versioned and shares structure with the previous trace. Trace entries for invocations that did not re-run are reused by reference; entries for re-run invocations are new objects with updated `timestamp` and `targets`.

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | For a delta touching `k` source elements out of `n` total, work performed scales with `O(k + d)` where `d` is the number of transitively-dirty invocations, not with `n`. |
| NFR-2 | Memory overhead per retained version is proportional to changed nodes only (structural sharing). Keeping the last `V` versions costs `O(V × Δ̄)`, not `O(V × n)`. |
| NFR-3 | Incremental code path is **opt-in**. Existing examples and consumers using `transform()` are unaffected. |
| NFR-4 | Any divergence between incremental and batch results is treated as a correctness bug, not a performance tradeoff. A property-based test compares both paths on randomized deltas. |

## Out of Scope for This Document

- The concrete shape of `SourceDelta` (covered in design doc)
- Choice of persistent-data-structure library or in-house implementation (design doc)
- How target cross-references are represented under structural sharing (design doc; depends on metamodel audit)
- Migration path for the decision-framework's extended trace entries (deferred)

## Success Criteria

A working slice of the EER → Relational example where:

1. A property change on one `Entity` re-runs `Entity2Table` for that entity only.
2. The produced target is structurally equal to a fresh batch transformation.
3. Unchanged `Table` elements in the new target version are reference-identical to those in the previous version.
4. A randomized property-based test (≥ 1000 deltas) shows zero divergence between incremental and batch paths.
