# bpmn-to-mermaid

Model-to-text transformation rendering a graph-based BPMN process
(`bpmn-metamodel`) as a Mermaid flowchart: one `.mmd` file per process,
a declaration line per node (tasks as boxes, gateways as diamonds,
events as stadium shapes, sub-processes as nested subgraphs) and an
edge line per flow, with guard labels when present. Node lines are
chosen by specialization: one pure-dispatch point, one option per kind.

Try it (from a workspace):

```bash
synth transformation install <path-to>/bpmn-to-mermaid
synth model import <path-to>/sample/approval-bpmn.tsx --as demo/approval-bpmn
synth transformation run bpmn-to-mermaid --in demo/approval-bpmn --out-dir ./generated
```

It chains with `workflow-to-bpmn` (its source metamodel is that
transformation's target), so a block-structured workflow becomes a
diagram in one run:

```bash
synth transformation run workflow-to-bpmn bpmn-to-mermaid --in demo/approval --out-dir ./generated
```
