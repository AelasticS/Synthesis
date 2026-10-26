# workflow-metamodel

The metamodel of block-structured workflow models (process trees): a
`WorkflowModel` carries `Document` vocabulary and activity definitions
(`Task`, `Process`), and a process body is an implicit sequence of
steps, the operators (`Sequence`, `Parallel`, `Choice` with guarded
`Branch`es, `Loop` with kind and guard), inline single-use
activities, and `Invocation`s calling definitions under occurrence
names and binding `DataObject`s through reads and writes. It is the
source language of `workflow-to-bpmn` and `workflow-to-mermaid`, and
the target language of `org-to-approval`.

Subpaths: the bare specifier `workflow-metamodel` exports the JSX
components (`<Invoke>` is the general invocation tag, `<SubProcess>`
its process-call sugar, `<Step>` the abstract step a specialization
point can return as its base skeleton); `workflow-metamodel/model` the
type schemas.

The metamodel is explained on the suite page
[The workflow suite](https://AelasticS.github.io/Synthesis/developer-guide/examples/workflow#the-metamodels).
