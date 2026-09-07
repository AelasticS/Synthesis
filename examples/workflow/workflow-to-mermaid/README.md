# workflow-to-mermaid

Model-to-text over the workflow metamodel: a block-structured workflow model
(a process tree) rendered as a Mermaid flowchart of nested
subgraphs, the suite's structure view. It draws the SOURCE the chain
consumes, where `bpmn-to-mermaid` draws the flattened graph the chain
produces. A task is a box; a sequence is a subgraph whose consecutive
children chain with edges; a parallel is a subgraph with no edges
between its children; a sub-process is a subgraph carrying its
recursively rendered body. The logic is fixed: the manifest declares
no parts and the CLI runs it without configuration flags. The
conventions are explained canonically in the docs page "The workflow
suite: block-structured workflows to BPMN to diagrams".

Try it (from a workspace):

```bash
synth transformation install <path-to>/workflow-to-mermaid
synth model import <path-to>/sample/release.tsx --as demo/release
synth transformation run workflow-to-mermaid --in demo/release --out-dir ./generated
cat generated/Release.mmd
```

The sample `release.tsx` exercises all four activity kinds;
`scripts/verify.mjs` renders the suite's two approval samples and
asserts every convention.
