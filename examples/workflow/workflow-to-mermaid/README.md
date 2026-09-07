# workflow-to-mermaid

Model-to-text over the workflow metamodel: a block-structured workflow model
(a process tree) rendered as a classic Mermaid flowchart, the suite's
flowchart view. It draws the SOURCE the chain consumes (the model's
entry process, the first definition no invocation calls), where
`bpmn-to-mermaid` draws the flattened graph the chain produces. The
chart runs from a start stadium to an end stadium; every step wires
its entry and its exits into the sequence around it. A task is a box,
its performer a parenthesized second label line; an invocation is a
subroutine box named by the occurrence, while an inline process
expands in place into its steps; a choice is one decision diamond
asking its guard as a question, its branch edges labeled with their
guards (the guardless branch's edge labeled else) and its branches
reconverging on whatever comes next without a merge node; a loop is a
guard diamond with a back edge, tested after the body (repeatUntil)
or before it (while); a parallel is a fork bar fanning out to its
children and a join bar they converge on. The logic is fixed: the
manifest declares no parts and the CLI runs it without configuration
flags. The conventions are explained canonically in the docs page
"The workflow suite".

Try it (from a workspace):

```bash
synth transformation install <path-to>/workflow-to-mermaid
synth model import <path-to>/sample/release.tsx --as demo/release
synth transformation run workflow-to-mermaid --in demo/release --out-dir ./generated
cat generated/Release.mmd
```

The sample `release.tsx` exercises tasks, a fork/join parallel, and
an inline process expanding in place; `scripts/verify.mjs` renders
three of the suite's samples, asserts every convention, and exercises
the metamodel's declared constraints through `synth model validate`.
