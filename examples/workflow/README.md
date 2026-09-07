# The workflow suite

The documentation's workflow domain as an executable example suite. Two
metamodels owned by the suite, a chain of two transformations over
them, and a structure view of the source:

```text
metamodels/workflow/   package workflow-metamodel: block-structured workflow models (process trees)
                       (Process with one body block; Task, Sequence, Parallel, SubProcess)
metamodels/bpmn/       package bpmn-metamodel: simplified graph-based BPMN
                       (nodes and flows; tasks, gateways, events, sub-processes)
workflow-to-mermaid/   m2t: draws the workflow model as nested Mermaid subgraphs
workflow-to-bpmn/      m2m: flattens the workflow model into the graph
bpmn-to-mermaid/       m2t: renders the graph as a Mermaid flowchart
```

The two chain steps compose (`workflow-to-bpmn` produces exactly what
`bpmn-to-mermaid` consumes), so a block-structured workflow model becomes a diagram in
one run; `workflow-to-mermaid` is a sibling view drawing the SOURCE
instead. The suite is explained canonically in the docs page "The
workflow suite: block-structured workflows to BPMN to diagrams" (developer guide,
Examples section); design/workflow-suite.md holds the design record,
and each package's README the usage loop.
