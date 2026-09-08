# eer-tutorial-advanced

Companion package of the model-to-model tutorial, Part 2: the Part 1
transformation with the entity rule turned into a specialization
point. `entityToTable` is a `@SpecPoint` returning the skeleton every
table shares, and the `@SpecOption` methods for `Kernel` and `Weak`
declare only what differs, so the source metamodel's subtype
hierarchy drives dispatch instead of a type check inside the rule.
The source is `eer-tutorial-metamodel/advanced` (the basic stage plus
the `Kernel` and `Weak` entity subtypes), the target
`rel-tutorial-metamodel`, and the relationship mapping is still
Part 1's fixed conditional.

## Run

```bash
npm run build   # from the repository root: rush build -t eer-tutorial-advanced

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library

synth transformation install .
synth transformation run eer-tutorial-advanced --in demo/library --out demo/library-rel
synth model show demo/library-rel
```

`npm test` runs the CLI smoke: install and one real run in an
isolated workspace.

This package is the finished state of
[Part 2 of the model-to-model tutorial](https://AelasticS.github.io/aelastics/developer-guide/tutorial/model-to-model/part-2-advanced),
which explains the dispatch, the option merge, and the sample output.
