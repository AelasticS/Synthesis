# rel-to-mermaid

Model-to-text transformation rendering a relational schema
(`relational-metamodel`, the output of the suite's configuration-based
`eer-to-relational` mapping) as Mermaid `erDiagram` text: an attribute
block per table with `PK` and `FK` marks, a line per foreign key,
solid (identifying) exactly when its columns sit inside the owner's
primary key, and a dashed one-to-one line per `historyOf` link. It
chains after `eer-to-relational`, so different configurations of the
same source become visibly different diagrams. The logic is fixed:
the manifest declares no parts and the CLI runs it without
configuration flags.

## Run

The `synth` download ships this example built and ready to install, in
the `examples` folder of the installation; see
[Running an example](https://AelasticS.github.io/Synthesis/developer-guide/examples#running-an-example).
The commands below work in a repository checkout.

```bash
npm run build   # from the repository root: rush build -t rel-to-mermaid

synth init
synth namespace mk demo
synth transformation install ../eer-to-relational
synth transformation install .
synth model import ../eer-to-relational/sample/library.eer.tsx --as demo/library

synth transformation run eer-to-relational rel-to-mermaid \
  --in demo/library --default-configs --out-dir ./generated
cat generated/library_rel.mmd
```

`npm test` runs the CLI smoke plus `scripts/verify.mjs`, which runs
the chain under three configurations and asserts each generated text.

The diagram conventions, with the three configurations drawn side by
side, are explained on the suite page
[A full-featured EER database suite](https://AelasticS.github.io/Synthesis/developer-guide/examples/eer-database-suite#one-source-three-configurations).
