# The workflow suite

The documentation's workflow domain as an executable example suite.
Three metamodels owned by the suite, a chain of two transformations
over them, a structure view of the source, and an organizational
example generating the chain's input:

```text
metamodels/workflow/   package workflow-metamodel: block-structured workflow models (process trees)
                       (WorkflowModel with DocumentTypes and Task/Process definitions;
                        bodies of Sequence, Parallel, Choice/Branch, Loop, and Invocation steps)
metamodels/bpmn/       package bpmn-metamodel: simplified graph-based BPMN
                       (nodes and flows; tasks, gateways, events, sub-processes)
metamodels/org/        package org-metamodel: organizational hierarchies
                       (units and workers; departments run by managers, boards)
workflow-to-mermaid/   m2t: draws the workflow model as nested Mermaid subgraphs
workflow-to-bpmn/      m2m: flattens the workflow model into the graph
bpmn-to-mermaid/       m2t: renders the graph as a Mermaid flowchart
org-to-approval/       m2m: derives an approval workflow from an organization, parameterized by --param
```

The two chain steps compose (`workflow-to-bpmn` produces exactly what
`bpmn-to-mermaid` consumes), so a block-structured workflow model becomes a diagram in
one run; `org-to-approval` extends the chain to three steps by
generating its input from an organizational model, and
`workflow-to-mermaid` is a sibling view drawing the SOURCE instead.
The suite is explained canonically in the docs page "The workflow
suite: block-structured workflows to BPMN to diagrams" (developer guide,
Examples section); design/workflow-suite.md and
design/workflow-suite-v2.md hold the design records, and each
package's README the usage loop.
