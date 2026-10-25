# rel-tutorial-metamodel

The simplified relational metamodel of the tutorial suite: a schema
of tables and columns, deliberately small so the transformations stay
readable. All seven tutorial companions pivot on it: the
`eer-tutorial-*` examples target it, the `sql-tutorial-*` examples
read from it, and the transformation template starts from it. Besides
the flat base it carries a `name-scopes` stage (the base plus
`declareNamespace(Table)`), the target of the tutorial's Part 4.

Subpaths: the bare specifier `rel-tutorial-metamodel` exports the JSX
components, `/model` the type schemas, and `/as-model` the
metamodel-as-model factory (`RelTutorialMetamodel`); the scoped stage
follows the same convention behind `rel-tutorial-metamodel/name-scopes`.

The metamodel is introduced in the
[developer-guide tutorial](https://AelasticS.github.io/Synthesis/developer-guide/tutorial).
