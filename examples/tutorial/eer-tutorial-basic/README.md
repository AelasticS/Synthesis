# eer-tutorial-basic

Companion package of the model-to-model tutorial, Part 1: a simple
EER schema (`eer-tutorial-metamodel/basic`) becomes a relational
schema (`rel-tutorial-metamodel`) with fixed logic and no decorators.
Entities become tables, attributes become columns typed by their
domains, and relationships are mapped by one plain conditional: M:N
becomes a join table, everything else a foreign key on the N side.
Later parts dissolve exactly that conditional.

## Run

```bash
npm run build   # from the repository root: rush build -t eer-tutorial-basic

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library

synth transformation install .
synth transformation run eer-tutorial-basic --in demo/library --out demo/library-rel
synth model show demo/library-rel
```

`npm test` runs the CLI smoke: install and one real run in an
isolated workspace.

This package is the finished state of
[Part 1 of the model-to-model tutorial](https://AelasticS.github.io/aelastics/developer-guide/tutorial/model-to-model/part-1-basic),
which builds it step by step.
