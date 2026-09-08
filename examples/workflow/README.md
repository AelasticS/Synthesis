# The workflow suite

The documentation's workflow domain as an executable example suite:
three suite-owned metamodels, a chain of two transformations over
them, a flowchart view of the source, and an organizational example
generating the chain's input.

- [metamodels/workflow](./metamodels/workflow/): package `workflow-metamodel`, block-structured workflow models (process trees)
- [metamodels/bpmn](./metamodels/bpmn/): package `bpmn-metamodel`, simplified graph-based BPMN (nodes and flows)
- [metamodels/org](./metamodels/org/): package `org-metamodel`, organizational hierarchies (departments run by managers, boards)
- [workflow-to-mermaid](./workflow-to-mermaid/): m2t, draws the workflow model as a classic Mermaid flowchart
- [workflow-to-bpmn](./workflow-to-bpmn/): m2m, flattens the workflow model into the BPMN graph
- [bpmn-to-mermaid](./bpmn-to-mermaid/): m2t, renders the graph as Mermaid flowchart text
- [org-to-approval](./org-to-approval/): m2m, derives an approval workflow from an organization, parameterized by `--param`

The two chain steps compose (`workflow-to-bpmn` produces exactly what
`bpmn-to-mermaid` consumes), so a workflow model becomes a diagram in
one run; `org-to-approval` extends the chain to three steps by
generating its input from an organizational model, and
`workflow-to-mermaid` is a sibling view drawing the source instead.

The suite is explained on the docs page
[The workflow suite](https://AelasticS.github.io/aelastics/developer-guide/examples/workflow);
each package's README holds its usage loop.
