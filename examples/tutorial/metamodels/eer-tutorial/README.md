# eer-tutorial-metamodel

The teaching EER metamodel of the tutorial suite, in three stages:
`basic` (entities, attributes over domains, binary relationships with
cardinality roles), `advanced` (the basic stage plus the `Kernel` and
`Weak` entity subtypes), and `name-scopes` (the basic stage plus
`declareNamespace(Entity)`). The four `eer-tutorial-*` examples
transform models written in these stages: `basic` feeds Part 1,
`advanced` Parts 2 and 3, and `name-scopes` Part 4.

Subpaths: each stage specifier (`eer-tutorial-metamodel/basic`,
`/advanced`, `/name-scopes`) exports the JSX components, its `/model`
suffix the type schemas, and `/advanced/as-model` the
metamodel-as-model factory (`EERTutorialMetamodel`).

The metamodel is built step by step in the
[model-to-model tutorial](https://AelasticS.github.io/Synthesis/developer-guide/tutorial/model-to-model).
