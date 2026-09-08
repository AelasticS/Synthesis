# workflow-to-bpmn

Model-to-model transformation flattening a block-structured workflow
model (a process tree, `workflow-metamodel`) into a graph-based BPMN
process (`bpmn-metamodel`): every step contributes nodes and flows
plus an entry and an exit, parallels and choices become gateway
pairs, a loop becomes a converging entry and a diverging exit gateway
whose kind places the test, and invocations become occurrence-named
tasks or embedded sub-processes. The logic is fixed: the manifest
declares no parts and the CLI runs it without configuration flags.

## Run

```bash
npm run build   # from the repository root: rush build -t workflow-to-bpmn

synth init
synth namespace mk demo
synth transformation install .
synth model import sample/approval.tsx --as demo/approval

synth transformation run workflow-to-bpmn --in demo/approval --out demo/approval-bpmn
synth model show demo/approval-bpmn
```

Three further samples cover an inline process (`reviewed-approval.tsx`),
choices, loops, and a twice-invoked shared definition
(`expense-approval.tsx`), and a higher-order template
(`templated-approval.tsx`).

`npm test` runs the CLI smoke: install and one real run in an
isolated workspace.

The flattening rules are explained on the suite page
[The workflow suite](https://AelasticS.github.io/aelastics/developer-guide/examples/workflow#flattening-the-tree-into-a-graph).
