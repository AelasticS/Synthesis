# workflow-metamodel

Block-structured workflow metamodel (a process tree): a
`WorkflowModel` carries the model-level vocabulary, `DocumentType`s
and activity definitions (`Task`, `Process`), and a process body is an
implicit sequence of steps: the operators (`Sequence`, `Parallel`,
`Choice` with guarded `Branch`es, `Loop` with kind and guard), inline
single-use activities, and `Invocation`s calling definitions under
their own occurrence names and binding the process's `Document`s
through reads/writes. `<Invoke>` is the general invocation tag and
`<SubProcess $refByName="X" />` its process-call sugar. The graph view
of the same block-structured workflow models is produced by the
`workflow-to-bpmn` transformation; `workflow-to-mermaid` draws the
tree itself.

Subpaths: the bare package exports the JSX components; `/model` exports
the type schemas.
