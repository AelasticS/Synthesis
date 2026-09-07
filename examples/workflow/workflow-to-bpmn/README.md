# workflow-to-bpmn

Model-to-model transformation flattening a block-structured workflow
model (a process tree, `workflow-metamodel`) into a graph-based BPMN
process (`bpmn-metamodel`: nodes and sequence flows).

The mapping follows a fragment contract: every step contributes nodes
and flows plus an entry and an exit. The flattened process is the
model's entry process (the first definition no invocation calls), and
it gains `start` and `end` events. Sequential blocks, implicit
sequences included (a process body, a branch, a loop body), chain
their children's fragments with flows. A `Parallel` wraps its children
in a parallel gateway pair (`<base>_split`, `<base>_join`); a `Choice`
becomes an exclusive pair with each branch's guard on its outgoing
flow, the else flow unguarded; a `Loop` becomes a converging entry and
a diverging exit gateway whose kind places the test, a repeatUntil
closing with the `not <guard>` back edge. A task invocation becomes a
task named by the occurrence; a process invocation and an inline
process expand as an embedded BPMN sub-process with
occurrence-prefixed inner names. Flow elements are named `f1..fn`.

Try it (from a workspace):

```bash
synth transformation install <path-to>/workflow-to-bpmn
synth model import <path-to>/sample/approval.tsx --as demo/approval
synth transformation run workflow-to-bpmn --in demo/approval --out demo/approval-bpmn
```

The sample `approval.tsx` is the documentation's approval process
(write, then two parallel approvals); `reviewed-approval.tsx` replaces
the writing step with a two-task inline process to exercise recursion;
`expense-approval.tsx` exercises the choice, the loop, a twice-invoked
shared definition, and document bindings; `templated-approval.tsx`
builds its model from a higher-order template.
