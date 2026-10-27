# org-to-approval

Model-to-model transformation deriving a block-structured workflow
model (a process tree, `workflow-metamodel`) from an organizational
hierarchy (`org-metamodel`). The logic is fixed, but every run
requires `--param '{"worker":...,"sensitivity":...}'`: `worker` names
the worker whose document needs approval, `sensitivity` how many
levels of the unit chain approve it. A department approves through
its manager, a board in parallel through its members. The
specialization point `OrgUnit2Approval` returns a base skeleton (a
`Step` with the description `Approval by <unit>`) that is merged with
the selected option's Task or Parallel, so each approval carries that
description. The
verbatim parameter is recorded in the generated model's `generatedBy`
provenance.

## Run

The `synth` download ships this example built and ready to install, in
the `examples` folder of the installation; see
[Running an example](https://AelasticS.github.io/Synthesis/developer-guide/examples#running-an-example).
The commands below work in a repository checkout.

```bash
npm run build   # from the repository root: rush build -t org-to-approval

synth init
synth namespace mk demo
synth transformation install .
synth model import sample/acme.tsx --as demo/acme

synth transformation run org-to-approval --in demo/acme --out demo/approval \
  --param '{"worker":"Judy","sensitivity":2}'
synth model show demo/approval
```

The generated model is an ordinary workflow model, so the suite's
chain continues from it: run `org-to-approval workflow-to-bpmn
bpmn-to-mermaid` with `--out-dir`, or `workflow-to-mermaid` on the
persisted result.

`npm test` runs `scripts/verify.mjs` directly (the generic smoke
harness cannot supply the required parameter), covering both
sensitivities, the provenance, the error paths, and the onward chain.

The derivation is explained on the suite page
[The workflow suite](https://AelasticS.github.io/Synthesis/developer-guide/examples/workflow#the-organizational-example-a-model-generates-a-process).
