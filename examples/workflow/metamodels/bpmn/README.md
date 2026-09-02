# bpmn-metamodel

Simplified graph-based BPMN metamodel: a `Process` is `nodes` (`Task`,
`Gateway`, `StartEvent`, `EndEvent`, `SubProcess` with its own nodes and
flows) connected by `Flow` edges with typed `from` and `to` links and an
optional `guard`. Target of `workflow-to-bpmn`, source of
`bpmn-to-mermaid`.

Subpaths: the bare package exports the JSX components; `/model` exports
the type schemas.
