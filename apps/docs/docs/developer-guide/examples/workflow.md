---
sidebar_position: 3
title: "The workflow suite: block structure to BPMN to diagrams"
---

# The workflow suite: block structure to BPMN to diagrams

The `examples/workflow` suite turns a block-structured workflow into a
graph-based BPMN process and renders that graph as a Mermaid diagram.
Its goal is to show a CHAIN done right: two small metamodels at
different levels of abstraction, two transformations whose manifests
make them composable (the first's target metamodel is the second's
source), and a structural translation, tree to graph, that is the
interesting step. The result of a run is a BPMN process model and,
from it, one `.mmd` Mermaid flowchart per process, ready to render.

This page is the canonical explanation of the suite; the package
READMEs stay short and point here. Everything below is exercised by
the suite's smokes on every gate run.

## The metamodels

The suite owns both metamodels, under `examples/workflow/metamodels/`.

### The workflow side

A block-structured process: a `Process` has one body activity, and an
activity is a `Task` (atomic), a `Sequence` (children run in order), a
`Parallel` (children run concurrently), or a `SubProcess` (a named
process fragment with its own body). Structure is pure nesting; there
are no edges to draw and none to get wrong.

```tsx
<Process name="Approval" store={store}>
  <Sequence name="main">
    <Task name="Write" />
    <Parallel name="approvals">
      <Task name="Approve 1" />
      <Task name="Approve 2" />
    </Parallel>
  </Sequence>
</Process>
```

### The BPMN side

A simplified graph-based BPMN: a `Process` is `nodes` (`Task`,
`Gateway`, `StartEvent`, `EndEvent`, and `SubProcess` carrying its own
nodes and flows) connected by `Flow` edges, each with typed `from` and
`to` links and an optional `guard` label. What the workflow side
guarantees by nesting, the BPMN side states explicitly as edges, which
is exactly the gap the transformation bridges.

## The transformation, rule by rule

### Flattening blocks into a graph

`workflow-to-bpmn` follows a FRAGMENT CONTRACT: every activity
contributes its nodes and flows, plus an entry port and an exit port,
and the rule for a composite activity wires its children's ports
without knowing what is behind them.

- A `Task` becomes one BPMN task; it is its own entry and exit.
- A `Sequence` emits its children's fragments and one flow from each
  child's exit to the next child's entry.
- A `Parallel` wraps its children between a gateway pair
  (`<name>_split`, `<name>_join`): flows from the split to every
  child's entry and from every child's exit to the join.
- A `SubProcess` becomes one BPMN sub-process node whose body is the
  recursively flattened fragment between its own start and end events.
- The process itself gains `start` and `end` events wired to its root
  activity's ports.

The dispatch is one pure `@SpecPoint` rule (`activityToGraph`) with
one `@SpecOption` per activity kind, and two helper points
(`toEntryOf`, `fromExitOf`) answer the ports the same way. Flow
elements are named `f1..fn`; all names are unique per model.

### Rendering the graph

`bpmn-to-mermaid` is model-to-text: one document per process, a
declaration line per node and an edge line per flow. Node lines are
chosen by specialization, one option per kind: tasks render as boxes,
gateways as diamonds, events as stadium shapes, and a sub-process as a
nested `subgraph` holding its own body. A flow with a `guard` renders
its label on the edge.

## No design space, on purpose

Neither transformation declares a configuration issue: at this scale
every question has one defensible answer, and a design space with
nothing genuinely open in it would be ceremony (the
[full-featured EER to SQL suite](./eer-to-sql.md) is where
configuration-based transformation is shown in earnest). What the
suite adds instead is the composition story: the chain
(`synth transformation run workflow-to-bpmn bpmn-to-mermaid --in demo/approval --out-dir ./generated`)
type-checks against the manifests before anything runs, and the
`templated-approval.tsx` sample builds its workflow from a
higher-order template, a template taking the writing step as a
template parameter, resolved in two steps to a model.

## Where the pieces live

- `examples/workflow/metamodels/workflow` and
  `examples/workflow/metamodels/bpmn`: the two metamodel packages,
  each exporting JSX components (bare specifier) and type schemas
  (`/model`).
- `examples/workflow/workflow-to-bpmn`: the m2m half, with the
  `approval`, `reviewed-approval` (recursion), and
  `templated-approval` (higher-order) samples.
- `examples/workflow/bpmn-to-mermaid`: the m2t half.
- `design/workflow-suite.md` in the repository records the design.
