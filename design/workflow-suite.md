# The workflow example suite

Agreed 2026-09-02. A third example suite, examples/workflow, giving the
documentation's workflow domain an executable home: every illustration
in the concepts page and the templates guide should be backed by
installable, runnable packages, like the tutorial and eer-to-sql suites.
Built on branch feat/workflow-suite (worktree Synthesis-wt-workflow);
documentation updates are a separate, later discussion.

## Layout

```text
examples/workflow/
  metamodels/
    workflow/          package workflow-metamodel: block-structured processes
    bpmn/              package bpmn-metamodel: simplified graph-based BPMN
  workflow-to-bpmn/    m2m: block structure flattened into a node-and-flow graph
  bpmn-to-mermaid/     m2t: the graph rendered as Mermaid flowchart text (stage E)
```

Delivery order: the m2m first (the tricky part), then bpmn-to-mermaid
and the executable higher-order template illustrations, then the
documentation pass.

## workflow-metamodel (block-structured)

| Concept | Definition |
| --- | --- |
| `Process` | subtype of `Model`, the root; contains `children: Activity[]` |
| `Activity` | abstract subtype of `ModelElement` |
| `Task` | subtype of `Activity` |
| `Sequence`, `Parallel` | subtypes of `Activity`, each `children: Activity[]` |
| `SubProcess` | subtype of `Activity`, `children: Activity[]`, body implicitly sequential |

## bpmn-metamodel (graph-based)

| Concept | Definition |
| --- | --- |
| `Process` | subtype of `Model`; `nodes: Node[]`, `flows: Flow[]` |
| `Node` | abstract subtype of `ModelElement` |
| `Task`, `StartEvent`, `EndEvent` | subtypes of `Node` |
| `Gateway` | subtype of `Node`, `kind` is `parallel` or `exclusive`; split versus join is determined by the edges, as in BPMN |
| `SubProcess` | subtype of `Node`, containing its own `nodes` and `flows` |
| `Flow` | subtype of `ModelElement`; `from` and `to` are typed links to `Node`, optional `guard` string |

Exclusive gateways are in the metamodel from day one; the v1
transformation emits only parallel ones because the structured source
has no conditional construct yet. Stated limitation, not an accident.

## The mapping (workflow-to-bpmn)

Fragment contract: every activity maps to a fragment, the set of nodes
and flows it contributes plus an entry port and an exit port (a port is
a node name and its kind, so flow endpoints can be written with the
right reference tag).

- `Task t`: one BPMN Task; entry = exit = t.
- `Sequence [c1..cn]`: the children's fragments plus chaining flows
  exit(ci) to entry(ci+1); entry = entry(c1), exit = exit(cn). An empty
  block is a transformation error.
- `Parallel p [c1..cn]`: a parallel Gateway pair `<p>_split` and
  `<p>_join`; flows split to every child entry, every child exit to
  join; entry = split, exit = join.
- `SubProcess s`: one BPMN SubProcess node containing `<s>_start`, the
  recursive graph of its body as a sequence, and `<s>_end`; externally
  entry = exit = s.
- The process: `start` and `end` events wrapping the implicit sequence
  of its children.

Naming rules (the model name scope is flat): task and subprocess names
pass through and must be unique per process; unnamed Parallel blocks get
generated names `par1`, `par2`, ... in traversal order; flow elements
are `f1..fn` with one global counter; subprocess-internal events are
`<s>_start` and `<s>_end`.

Implementation: `@E2E` rules for single-node emissions (task, gateway,
events, subprocess); plain helper methods do the fragment bookkeeping
and assemble the node and flow arrays into one `<Process>` expression;
flow endpoints use `$refByName` with the concrete tag of the target
kind.

Expected output for the approval sample (Write, then two parallel
approvals), asserted during verification: flows start to Write, Write to
par1_split, par1_split to each Approve, each Approve to par1_join,
par1_join to end.

## Risk checkpoints

Verified empirically before the approach is fixed, with fallbacks:

1. Unnamed container elements (Sequence, Parallel) must render.
   Fallback: components or samples provide names.
2. Reference tags over the abstract Node type may not work (abstract
   elements have special SpecPoint handling in the renderer). Fallback,
   assumed by the design: concrete-kind tags per flow endpoint.
3. `@E2E` is applied only to single-node rules; array assembly stays in
   plain methods.

## Packaging

Same conventions as the other suites: metamodel packages export `.`
(JSX components, flat) and `./model` (schemas); the transformation
package has synth.json (kind m2m, source workflow-metamodel, target
bpmn-metamodel with components bpmn-metamodel), a sample model under
sample/ (the approval process, plus a subprocess variant), and the
shared smoke harness as its test script. Dependencies:
@aelastics/synthesis plus the two metamodel packages;
@aelastics/synthesis-cli as devDependency for the smoke run.

## Stage E, on this branch after review

bpmn-to-mermaid (m2t; SubProcess becomes a Mermaid subgraph), the
executable higher-order template illustrations (a sample model defining
the Approval template with the write step as a task or a subprocess),
and the catalog README row.


## Design v2, agreed 2026-09-02 (supersedes the v1 mapping implementation)

Decisions from the review of the committed stage D code:

- workflow-to-bpmn is an EXAMPLE, not tutorial material (too complex for
  the tutorial). What the tutorial gets instead is a separate discussion
  after the suite is done.
- No planning phase, no bookkeeping interfaces: direct JSX composition.
- Engine change 1 (spec-decorators.ts): pure-dispatch @SpecPoint. If the
  base rule returns undefined/null there is no skeleton, so the chosen
  option result is returned as is (single expression, array, or any
  value). Skeleton + array option result throws a clear error. The
  original annotation becomes
  (...a: any[]) => ExprNode<any> | ExprNode<any>[] | undefined | null.
  The existing skeleton-merge path is unchanged. @E2E needs no change
  (already normalizes arrays).
- Engine change 2 (element.ts): ConnectionInfo.propName may be a
  candidate list (string | string[]); connectToParent connects via the
  first property declared on the parent type. Single-string behavior
  unchanged.
- workflow-metamodel: Process gains MANDATORY single containment
  body: t.link(schema, "Activity"). Activity components connect via
  candidates ["body", "children"] with isReconnectAllowed: false, so a
  second top-level block is an error. Authoring stays child-position.
- bpmn-metamodel components gain reference tags FromNode and ToNode
  (ExprNode over Node connecting into Flow.from / Flow.to, SecParent
  idiom).
- The transformation: three pure-dispatch @SpecPoint points
  (activityToGraph with Task/SubProcess/Sequence/Parallel options,
  toEntryOf and fromExitOf returning reference expressions, an entry is
  always a flow target and an exit always a flow source), rootOf(p) reads
  p.body, chainFlows writes <Flow>{fromExitOf}{toEntryOf}</Flow>, baseOf
  memoizes generated parallel names, nextFlowName counts f1..fn. No
  isTypeOf anywhere; the exact agreed source is in
  workflow-to-bpmn-v2.tsx.txt next to this file.

Execution order (user-fixed): (1) engine changes + engine tests + full
gates + CHANGELOG + commit; (2) metamodel changes + transformation
rework + verification + commit; (3) discuss the tutorial story, then
stage E (bpmn-to-mermaid, higher-order illustration file, catalog row),
then the documentation pass.
