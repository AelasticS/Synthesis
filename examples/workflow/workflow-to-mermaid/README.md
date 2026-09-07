# workflow-to-mermaid

Model-to-text over the workflow metamodel: a block-structured workflow model
(a process tree) rendered as a Mermaid flowchart of nested
subgraphs, the suite's structure view. It draws the SOURCE the chain
consumes (the model's entry process, the first definition no
invocation calls), where `bpmn-to-mermaid` draws the flattened graph
the chain produces. A task is a box; a sequence is a subgraph whose
consecutive children chain with edges, and every implicit sequence (a
process body, a branch, a loop body) chains the same way; a parallel
is a subgraph with no edges between its children; a choice is a
subgraph of guard-labeled branch subgraphs, the guardless branch
labeled else; a loop is a subgraph labeled with its kind and guard; an
inline process is a subgraph carrying its recursively rendered body; a
process invocation is a subroutine shape and a task invocation a box,
both named by the occurrence. The logic is fixed: the manifest
declares no parts and the CLI runs it without configuration flags. The
conventions are explained canonically in the docs page "The workflow suite".

Try it (from a workspace):

```bash
synth transformation install <path-to>/workflow-to-mermaid
synth model import <path-to>/sample/release.tsx --as demo/release
synth transformation run workflow-to-mermaid --in demo/release --out-dir ./generated
cat generated/Release.mmd
```

The sample `release.tsx` exercises tasks, a parallel, and an inline
process; `scripts/verify.mjs` renders three of the suite's samples,
asserts every convention, and exercises the metamodel's declared
constraints through `synth model validate`.
