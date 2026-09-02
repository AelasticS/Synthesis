# workflow-metamodel

Block-structured workflow metamodel: a `Process` is a tree of
activities (`Task`, `Sequence`, `Parallel`, `SubProcess`), the domain
the documentation's template examples are written in. The graph view of
the same processes is produced by the `workflow-to-bpmn` transformation.

Subpaths: the bare package exports the JSX components; `/model` exports
the type schemas.
