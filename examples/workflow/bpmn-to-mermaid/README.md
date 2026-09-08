# bpmn-to-mermaid

Model-to-text transformation rendering a graph-based BPMN process
(`bpmn-metamodel`) as Mermaid flowchart text: one `.mmd` file per
process, a declaration line per node chosen by specialization (tasks
as boxes, gateways as diamonds, events as stadium shapes,
sub-processes as nested subgraphs), and an edge line per flow with
guard labels when present. Its source metamodel is
`workflow-to-bpmn`'s target, so the two chain: a block-structured
workflow model (a process tree) becomes a diagram in one run. The
logic is fixed: the manifest declares no parts and the CLI runs it
without configuration flags.

## Run

```bash
npm run build   # from the repository root: rush build -t bpmn-to-mermaid

synth init
synth namespace mk demo
synth transformation install .
synth model import sample/approval-bpmn.tsx --as demo/approval-bpmn

synth transformation run bpmn-to-mermaid --in demo/approval-bpmn --out-dir ./generated

# or chained, from an imported workflow model
synth transformation run workflow-to-bpmn bpmn-to-mermaid --in demo/approval --out-dir ./generated
```

`npm test` runs the CLI smoke plus `scripts/verify.mjs`.

The rendering rules are explained on the suite page
[The workflow suite](https://AelasticS.github.io/aelastics/developer-guide/examples/workflow#rendering-the-graph).
