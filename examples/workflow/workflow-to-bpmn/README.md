# workflow-to-bpmn

Model-to-model transformation flattening a block-structured workflow
(`workflow-metamodel`: tasks, sequences, parallels, sub-processes) into
a graph-based BPMN process (`bpmn-metamodel`: nodes and sequence flows).

The mapping follows a fragment contract: every activity contributes
nodes and flows plus an entry and an exit port. A `Sequence` chains its
children's fragments; a `Parallel` wraps its children in a parallel
gateway pair (`<name>_split`, `<name>_join`); a `SubProcess` becomes one
BPMN sub-process node carrying its recursively flattened body between
its own start and end events; the process itself gains `start` and `end`
events. Flow elements are named `f1..fn`; all names are unique per
model.

Try it (from a workspace):

```bash
synth transformation install <path-to>/workflow-to-bpmn
synth model import <path-to>/sample/approval.tsx --as demo/approval
synth transformation run workflow-to-bpmn --in demo/approval --out demo/approval-bpmn
```

The sample `approval.tsx` is the documentation's approval process
(write, then two parallel approvals); `reviewed-approval.tsx` replaces
the writing step with a two-task sub-process to exercise recursion.
