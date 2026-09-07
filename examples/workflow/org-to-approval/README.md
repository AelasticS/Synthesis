# org-to-approval

Model-to-model transformation deriving a block-structured workflow
model (a process tree) from an organizational hierarchy
(`org-metamodel`). The run is parameterized through the engine's
parameter channel: `--param '{"worker":"<name>","sensitivity":<levels>}'`
names the worker whose document needs approval and how many levels of
the hierarchy approve it. The worker's unit chain is unfolded upward
that many levels, and each unit contributes one approval step by kind
(`@SpecPoint`/`@SpecOption`): a department the approval task of its
manager, a board a parallel block of its members' approval tasks. The
verbatim parameter is recorded in the generated model's `generatedBy`
provenance, so a parameterized run stays reproducible from its output.
The suite is explained canonically in the docs page "The workflow suite".

Try it (from a workspace):

```bash
synth transformation install <path-to>/org-to-approval
synth model import <path-to>/sample/acme.tsx --as demo/acme
synth transformation run org-to-approval --in demo/acme --out demo/approval \
  --param '{"worker":"Judy","sensitivity":2}'
synth model show demo/approval
```

The generated model is an ordinary workflow model, so the suite's
chain continues from it: run
`org-to-approval workflow-to-bpmn bpmn-to-mermaid` with `--out-dir`
for the flattened drawing, or `workflow-to-mermaid` on the persisted
result for the flowchart view.

The sample `acme.tsx` is a small organization: an executive board of
three over two nested departments, each naming its manager. The test
script runs `scripts/verify.mjs` directly instead of the generic smoke
harness, because the transformation requires a parameter the harness
cannot supply; the verification covers both sensitivities, the
recorded provenance, the parameter's error paths, and the onward
chain.
