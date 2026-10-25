# workflow-to-mermaid

Model-to-text transformation drawing a block-structured workflow model
(a process tree, `workflow-metamodel`) as a classic Mermaid flowchart,
the suite's flowchart view: tasks as boxes with their performers,
invocations as subroutine boxes, choices as decision diamonds with
guarded branch edges, loops as guard diamonds with a back edge, and
parallels as fork and join bars. It draws the source the suite's
chain consumes, where `bpmn-to-mermaid` draws the flattened graph the
chain produces. The logic is fixed: the manifest declares no parts
and the CLI runs it without configuration flags.

## Run

```bash
npm run build   # from the repository root: rush build -t workflow-to-mermaid

synth init
synth namespace mk demo
synth transformation install .
synth model import sample/release.tsx --as demo/release

synth transformation run workflow-to-mermaid --in demo/release --out-dir ./generated
cat generated/Release.mmd
```

`npm test` runs the CLI smoke plus `scripts/verify.mjs`, which renders
three of the suite's samples and asserts every drawing convention.

The drawing conventions are explained on the suite page
[The workflow suite](https://AelasticS.github.io/Synthesis/developer-guide/examples/workflow#the-flowchart-view-the-workflow-model-to-mermaid).
