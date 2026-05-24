# Bidirectional Inverse Generation — Two Paths

**Status**: Draft
**Companion to**: [bidirectional-design.md](bidirectional-design.md)
**Author**: Sinisa Neskovic

## Purpose

The bidirectional design requires a `put` function per rule that wants to be invertible. Writing every `put` by hand is the obvious cost of the design. This document explores **two alternative paths to automate `put` derivation**, with explicit and honest correctness claims for each.

The two paths are presented as alternatives, not as a single pipeline that escalates. They differ in their correctness guarantee, in the rule expressiveness they permit, and in the engineering investment they require. They can coexist (a project can adopt path A now and migrate selected rules to path B later) but the design choices for each are largely independent.

| | Path A — High-Confidence Pipeline | Path B — Verified Derivation |
| --- | --- | --- |
| Correctness | 100% on trivial rules; "production-grade" (typically >> 99.9%) on the rest | 100% on all rules within the supported DSL fragment |
| Method | Symbolic AST inversion → LLM fallback → property-based test gate | Translate rule + generated `put` to a decidable logical IR; discharge lens-law obligations via SMT or proof assistant |
| Rule DSL constraints | None (TypeScript + JSX as today) | Restricted to a decidable fragment (no opaque function calls, no I/O, recursion only with measure) |
| Engineering effort | Moderate (existing PBT harness from FR-4 + symbolic walker + LLM glue) | Large (formal IR, translation, integration with SMT / Lean / Coq, restricted DSL design) |
| Runtime overhead | Zero — codegen happens at design time | Zero — verification happens at design time |
| Status | Recommended for the v1 bidirectional rollout | Long-term research track; revisit when path A's failure modes are characterized in practice |

## Honest scope of "correct"

Before describing either path, two terms are used precisely throughout this document.

- **Provably correct** — there exists a mechanical argument that the `put` satisfies the lens laws on *all* inputs in the supported domain. The argument is either by construction (the inverse is the only possible one) or by formal proof.
- **Falsified-not-found** — the `put` has been exercised against a large but finite sample of inputs (property-based testing, possibly mutation- and counterexample-augmented) and no lens-law violation was observed. This is *not* a proof. The probability of a remaining bug is small but not zero; the magnitude depends on input-space coverage, generator quality, and mutation budget.

Path A delivers *provably correct* on the trivial subset and *falsified-not-found* on the rest. Path B delivers *provably correct* on its entire supported subset, at the price of a smaller supported subset.

---

## Path A — High-Confidence Inverse Generation Pipeline

### A.1 Pipeline shape

```text
            ┌─────────────────────────────────────────────┐
            │ For each @E2E rule without explicit put:    │
            └─────────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────────────┐
            │ 1. Symbolic AST inversion                   │
            │    Walk the rule body's TS AST. Detect      │
            │    trivial 1-to-1 mappings. Emit put.       │
            └──────────┬──────────────────────────────────┘
                       │ fully trivial?  ── yes ──► emit put, label PROVEN, done
                       │                ── no  ──┐
                       ▼                         │
            ┌─────────────────────────────────────────────┐
            │ 2. LLM generation                           │
            │    Prompt: rule body + source/target types  │
            │    + lens law spec. Output: TS put fn.      │
            └──────────┬──────────────────────────────────┘
                       │
                       ▼
            ┌─────────────────────────────────────────────┐
            │ 3. Property-based test gate                 │
            │    Run GetPut / PutGet / PutPut against     │
            │    N=10000 randomized + shrunk inputs.      │
            │    Augment with mutation testing on the     │
            │    put fn to surface oracle blind spots.    │
            └──────────┬──────────────────────────────────┘
                       │ pass ──► emit put, label TESTED, done
                       │ fail ──► report counterexample, hand to author
```

All stages run **at design time**. The runtime engine only executes the final `put` and never invokes an LLM.

### A.2 Stage 1 — Symbolic AST inversion

Walk the JSX subtree returned by a representative invocation of the rule. For each attribute on each emitted JSX element, classify the value expression:

| Expression form | Classification | Inverse |
| --- | --- | --- |
| Literal (string, number, boolean) | Non-invertible | Edits to this target property silently no-op on source; flag as warning |
| Direct property read of the rule's argument (`a.name`) | Trivially invertible | Source delta sets the same property |
| Identity-preserving transform with known inverse (`a.name.toLowerCase()` where target type permits) | Conditionally invertible | Emit with a constraint check |
| Anything else | Not handled by symbolic path | Fall through to stage 2 |

If every attribute is classified as invertible (or marked harmless literal), the rule is **fully trivial** and the generated `put` is **provably correct by construction** — the inversion is mechanical and there is only one possible mapping. Label `PROVEN_TRIVIAL` and skip stages 2 and 3 entirely.

In practice this covers a sizeable fraction of attribute-copy rules in real transformations. The EER → Relational example's `Attribute2Column` is partially trivial: `name` and `isKey` are direct reads (provably invertible), `type` involves `this.getColumnType(domain)` (not handled symbolically; the rule falls through to stage 2 unless `type` is excluded from the bidirectional surface).

### A.3 Stage 2 — LLM generation

For rules that fall through, prompt an LLM with:

- The rule body (TypeScript source)
- The source and target element type signatures
- The lens-law specification (textual + example)
- Any helper functions the rule calls (resolved + included in the prompt context)
- A small library of example `put` functions for similar patterns

Request a TypeScript function matching the `PutFn` signature. Apply standard codegen hygiene: schema-constrained output, deterministic decoding where possible, syntactic validation before passing to stage 3.

**Important non-claims about this stage**:
- The LLM is *not* trusted to produce correct code. It is treated as a candidate generator whose output must pass stage 3.
- The LLM is not invoked at runtime. The generated function is committed to source control (or to a sidecar file) and reviewed.
- Multiple candidates can be generated; stage 3 picks the first that passes (or reports all failures).

### A.4 Stage 3 — Property-based test gate

Reuse the lens-law harness specified in FR-4 of the bidirectional requirements doc. Per rule, generate `N` randomized source elements and target edits, run the round-trips, assert GetPut, PutGet, and (where defined) PutPut.

Augmentations that materially raise confidence without changing the theoretical bound:

- **Shrinking** — when a counterexample is found, automatically minimize it for human review (standard PBT feature).
- **Mutation testing on the generated `put`** — flip operators, swap branches, drop conditions; any mutant that *still* passes the property tests indicates the oracle is too weak and the test generators or laws need strengthening. This catches the "tests pass because they don't probe the buggy region" failure mode.
- **Counterexample seeding** — every counterexample found across the codebase is checked into a corpus and replayed on future regenerations. Prevents regression.
- **Coverage-guided generation** — bias generators toward unexercised branches of the rule body (using TS source-map instrumentation) so the property tests exercise the rule's full state space, not just its happy path.

Output label `TESTED(N=10000, mutationScore=0.91)`. This is **falsified-not-found**, never **proven**.

### A.5 Lifecycle and drift detection

The forward rule body can change. When it does, the generated `put` may silently become incorrect (the forward and inverse disagree). Mitigations:

- **Content hash of the forward rule body** stored alongside the generated `put`. On rule body change, the codegen tool flags the `put` as `STALE` and refuses to use it until regenerated and re-gated.
- **CI integration** — the gate runs on every commit; failures block the merge.
- **Explicit labeling in code** of which `put`s are generated vs hand-written:

  ```ts
  @E2E({
    // generated by put-gen v1.2.0
    // lens laws: TESTED(N=10000, mutationScore=0.91)
    // forward-rule-hash: sha256:a3f9...
    put: (a, td) => { ... }
  })
  ```

Reviewers see at a glance which inverses are mechanical and which need human attention.

### A.6 Pros and cons

**Pros**

- Works with the existing rule DSL — no restrictions on rule bodies
- Incremental adoption — turn on per rule via a flag, not a global commitment
- The PBT gate has independent value even without LLM generation (it validates hand-written `put`s the same way)
- Runtime is offline and deterministic — no LLM dependency in production

**Cons**

- Cannot honestly promise 100% correctness on non-trivial rules
- LLM call cost and latency at design time (mitigated by caching keyed on the forward-rule hash)
- Mutation testing budget can be significant for large rule sets
- The gap between "tests pass" and "is correct" remains; users must accept *falsified-not-found* as the correctness contract for non-trivial rules

---

## Path B — Verified Inverse Derivation

### B.1 Approach

Translate the rule body and the generated `put` into a decidable logical intermediate representation, then discharge the lens-law obligations via an automated solver (SMT) or a proof assistant (Lean, Coq, Isabelle). If the proof succeeds, the `put` is **provably correct** on all inputs in the supported domain.

This is essentially the QVT-R / TGG / Boomerang approach adapted to Synthesis. It is honest about correctness in a way path A cannot be.

### B.2 Cost: restricted rule DSL

The catch is that TypeScript with arbitrary library calls, mutation, and unbounded recursion is not decidable. To verify rules, the rule DSL must be restricted to a fragment that the chosen verifier can reason about.

A workable restricted fragment for Synthesis rules might require:

- **No opaque function calls.** Helpers like `this.getColumnType(domain)` must either be inlined or themselves be expressible in the fragment. External library calls are forbidden.
- **No I/O or side effects.** Rule body is a pure function from source element to JSX tree.
- **No unbounded recursion.** Recursion permitted only with an explicit termination measure on a well-founded order.
- **Datatypes restricted to algebraic / record / enum types** with decidable equality. Pattern matching is preferred over conditional chains.
- **No identity escape.** Object references and stable IDs must be modeled as opaque values, not as memory addresses.

JSX is a natural fit because it is already declarative; the challenge is constraining the *TypeScript* inside `{ ... }` interpolations to the verified fragment.

### B.3 Verification toolchain options

| Option | Best for | Cost |
| --- | --- | --- |
| **SMT-based** (Z3, CVC5) via a TypeScript-to-SMT compiler | Bounded data, first-order logic, automated proof | Build the compiler; design the SMT encoding of the rule fragment; accept undecidability when types get too rich |
| **Lean / Coq / Isabelle** with a TypeScript embedding | Rich types, dependent verification, full proof of lens laws | Manual proofs per rule (or per rule shape); large up-front investment in the embedding |
| **Boomerang / bx-style combinator library in TypeScript** | Restrict rule authors to bidirectional combinators that are correct by construction | Most ergonomic — proof obligations discharged once when designing the combinator library; rule authors compose verified primitives. Closest to the "lens-combinator DSL" approach rejected for v1 of the bidirectional design, but reconsidered here as a verified path |

The combinator-library option is the most pragmatic. It avoids verifying *each* rule and instead verifies a small set of combinators once, then guarantees correctness of any rule built from them. The price is that rules become combinator expressions rather than free-form JSX. This is a real loss of expressiveness but a known and accepted one in the BX literature (Boomerang is a canonical example).

### B.4 Proof obligations

For each rule (or each combinator), the verifier discharges:

- **GetPut** — ∀ s. put(s, get(s)) = s
- **PutGet** — ∀ s, v'. get(put(s, v')) = v'
- **PutPut** (where applicable) — ∀ s, v', v''. put(put(s, v'), v'') = put(s, v'')

In a verified setting these are theorems, not test outcomes. They hold for every input in the supported domain.

### B.5 Pros and cons

**Pros**

- 100% correctness on every supported rule (within the DSL fragment)
- No flaky CI on the lens gate — the proof is checked once
- A correctness story that holds up to formal scrutiny (regulated domains, safety-critical generation)

**Cons**

- Substantial up-front engineering investment (compiler / embedding, verifier integration, restricted DSL)
- Loss of rule-author ergonomics — arbitrary TypeScript bodies must be rewritten in the supported fragment
- Some real rules genuinely cannot be expressed (e.g., rules that legitimately depend on opaque host-language operations) — these remain outside the verified set and need path A treatment or hand-written `put`s
- Maintenance burden when the DSL fragment evolves (proofs may need re-discharging)

---

## Comparison

| Dimension | Path A | Path B |
| --- | --- | --- |
| Correctness on trivial rules | Provably 100% | Provably 100% |
| Correctness on non-trivial rules | Falsified-not-found (≈ 99.9%+ in practice with mutation testing) | Provably 100% — within the supported DSL fragment |
| Rule-author ergonomics | Unchanged | Restricted DSL |
| Up-front engineering cost | Moderate (build symbolic walker + LLM glue + extend PBT harness) | Large (compiler, verifier integration, possibly a combinator library) |
| Per-rule cost | Low (codegen + PBT) | Variable — low if combinator-based, high if per-rule proofs |
| Runtime cost | Zero | Zero |
| External dependencies at design time | LLM provider | SMT solver or proof assistant |
| Maintenance under DSL evolution | Regenerate + retest | Re-discharge proofs |
| Failure mode | Silent incorrectness on inputs the PBT did not exercise | Cannot express the rule in the fragment — fall back to path A or hand-written |

## Recommendation

**Adopt path A for the v1 bidirectional rollout.** It composes cleanly with the design in [bidirectional-design.md](bidirectional-design.md): the property-based test gate is already required by FR-4 for hand-written `put`s, so reusing it for generated `put`s is small additional work. The symbolic stage handles the trivial cases with full correctness, and the LLM stage with a strong gate is a real productivity multiplier for the rest.

**Keep path B as a long-term research track.** Revisit when:

- Path A's empirical failure rate is characterized (need data from real use)
- A specific subset of rules emerges where falsified-not-found is genuinely insufficient (e.g., generated production database migrations)
- A combinator-library design for Synthesis's rule patterns becomes feasible without unacceptable loss of expressiveness

The two paths are not mutually exclusive. A future system can mix them — verified `put`s for the critical subset, generated `put`s for the rest, hand-written for the rest of the rest. The labeling discipline in §A.5 makes the mix explicit and auditable.

## Open questions

1. **What does "production-grade" mean in numbers?** Specifying a target mutation score (e.g., ≥ 0.85) and a target test budget (e.g., N=10000) turns "falsified-not-found" from a vibe into a contract. Needs calibration against real rules.
2. **LLM provider choice and reproducibility.** Generated code must be reproducible (same prompt → same code) for review and CI. Implies pinning model versions and decoding parameters. Local models (deterministic decoding) vs hosted (better quality, less reproducible) is a real trade.
3. **Cost of mutation testing at scale.** Mutation testing N rules with M mutants each multiplies the PBT budget by M. Profile before assuming this is free.
4. **What constitutes the symbolic-invertible fragment in practice?** The classification table in §A.2 is a sketch. A more rigorous specification (and probably an `ast-classifier` library) is needed before the symbolic stage can be implemented.
5. **Cross-rule lens composition.** When a rule reads another rule's output via `resolveTarget`, both `put`s must compose correctly. Both paths defer this to the broader bidirectional-design open questions; codegen needs to detect it and either generate composed inverses (path A, with weaker confidence) or refuse and require manual handling (path B).
6. **Path B combinator-library design.** If path B is ever pursued, the most pragmatic shape (per §B.3) is a combinator library. Designing it requires a separate document and a survey of which existing rule patterns it would have to cover. Not in scope here.
