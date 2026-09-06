# The workflow suite

The documentation's workflow domain as an executable example suite. Two
metamodels owned by the suite and a chain of two transformations over
them:

```text
metamodels/workflow/   package workflow-metamodel: block-structured processes
                       (Process with one body block; Task, Sequence, Parallel, SubProcess)
metamodels/bpmn/       package bpmn-metamodel: simplified graph-based BPMN
                       (nodes and flows; tasks, gateways, events, sub-processes)
workflow-to-bpmn/      m2m: flattens block structure into the graph
bpmn-to-mermaid/       m2t: renders the graph as a Mermaid flowchart
```

The two transformations chain (`workflow-to-bpmn` produces exactly what
`bpmn-to-mermaid` consumes), so a block-structured workflow becomes a
diagram in one run. The suite is explained canonically in the docs
page "The workflow suite: block structure to BPMN to diagrams"
(developer guide, Examples section); design/workflow-suite.md holds
the design record, and each package's README the usage loop.
