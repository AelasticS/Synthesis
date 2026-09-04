# Synchronizing Transformations

This directory holds requirement and design documents for evolving the Synthesis transformation engine from a **batch** model (each `transform()` produces a complete target from scratch) to a **synchronizing** model that keeps source and target models continuously aligned in the presence of changes.

## Scope

The umbrella term *synchronizing transformations* covers two related capabilities:

1. **Incremental forward transformation** — given a delta of source changes (creates, updates, deletes), re-execute only the affected rules and produce a new target version. Source-to-target only.
2. **Bidirectional transformation (BX)** — given a delta on *either* side, propagate it to the other while preserving consistency. Source ↔ target.

Both share the same underlying machinery: a queryable trace, change detection on either model, dependency tracking between rule invocations, and delta-based execution scheduling. Bidirectional builds on incremental.

## Phases

| Phase | Status | Documents |
| --- | --- | --- |
| 1. Incremental forward | Design | [incremental-requirements.md](incremental-requirements.md), [incremental-design.md](incremental-design.md) |
| 2. Bidirectional | Design | [bidirectional-requirements.md](bidirectional-requirements.md), [bidirectional-design.md](bidirectional-design.md) |
| 2a. Bidirectional inverse codegen | Design | [bidirectional-codegen.md](bidirectional-codegen.md) |

## Motivation

Today, `abstractM2M.transform(source)` re-runs the entire template on every invocation. For small source edits this wastes work, and for live tooling (IDE integrations, design-time decision exploration in the decision-framework, UI-driven model editing) it makes round-trip latency proportional to model size rather than change size.

The engine already records enough information to do better: per-rule traces with source → target mapping, source models wrapped in MobX observables, and an event log capturing every mutation. What is missing is the runtime that consumes these to drive incremental re-execution, and an architectural decision about how to represent successive versions of the target model. Phase 1 addresses both.

## Inspiration

- **MobX** — fine-grained observable/derivation/reaction graph with topological re-execution
- **Persistent data structures** (Clojure, Immer, MST) — versioned immutable models with structural sharing
- **BX literature** — lenses, triple graph grammars, QVT-R; for phase 2

## Conventions for this folder

- Documents are written in plain Markdown. They are *internal* planning material, not part of the public docs site under `apps/docs/`.
- Each phase gets a `*-requirements.md` (what + why) and a `*-design.md` (how) document.
- Open questions are tracked inline in the design documents under an explicit **Open Questions** heading. When resolved, edit in place and note the resolution.
