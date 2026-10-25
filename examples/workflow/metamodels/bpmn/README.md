# bpmn-metamodel

Simplified graph-based BPMN metamodel: a `Process` is `nodes`
(`Task`, `Gateway`, `StartEvent`, `EndEvent`, and `SubProcess` with
its own nodes and flows) connected by `Flow` edges with typed `from`
and `to` links and an optional `guard`. It is the target language of
`workflow-to-bpmn` and the source language of `bpmn-to-mermaid`,
which is what lets the two chain.

Subpaths: the bare specifier `bpmn-metamodel` exports the JSX
components; `bpmn-metamodel/model` exports the type schemas.

The metamodel is explained on the suite page
[The workflow suite](https://AelasticS.github.io/Synthesis/developer-guide/examples/workflow#the-metamodels).
