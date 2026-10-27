# eer-tutorial-configuration-based

Companion package of the model-to-model tutorial, Part 3: the Part 2
transformation with the relationship mapping no longer decided by the
transformation at all. The 1:N mapping is a `@VarPoint` with two
`@VarOption` methods (a foreign key on the N side, the default, or a
join table), closed per run by a configuration model; M:N stays plain
code because a join table is structurally forced. The manifest's
`parts` list the decision model, the binding model, and the source
metamodel-as-model, rendered into the store before every run. The
source is `eer-tutorial-metamodel/advanced`, the target
`rel-tutorial-metamodel`.

## Run

The `synth` download ships this example built and ready to install, in
the `examples` folder of the installation; see
[Running an example](https://AelasticS.github.io/Synthesis/developer-guide/examples#running-an-example).
The commands below work in a repository checkout.

```bash
npm run build   # from the repository root: rush build -t eer-tutorial-configuration-based

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library
synth transformation install .

# the default run: ForeignKey
synth transformation run eer-tutorial-configuration-based \
  --in demo/library --default-configs --out demo/library-rel

# choose differently: generate a configuration, select JoinTable in it, run again
synth config init eer-tutorial-configuration-based \
  --for demo/library --out demo/library-cfg
synth transformation run eer-tutorial-configuration-based \
  --in demo/library --config demo/library-cfg --out demo/library-rel-jt
```

`npm test` runs the CLI smoke: install and one real run with default
configurations in an isolated workspace.

This package is the finished state of
[Part 3 of the model-to-model tutorial](https://AelasticS.github.io/Synthesis/developer-guide/tutorial/model-to-model/part-3-configuration-based),
which explains the design space, the three models beside the
transformation, and both runs' outputs.
