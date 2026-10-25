# The tutorial suite

The companion packages of the developer-guide tutorials. Each part of
both tutorials has its own complete package, the finished state of
that part, so it doubles as the answer key while you follow along.

- [metamodels/eer-tutorial](./metamodels/eer-tutorial/): package `eer-tutorial-metamodel`, the teaching EER stages (basic, advanced, name-scopes)
- [metamodels/rel-tutorial](./metamodels/rel-tutorial/): package `rel-tutorial-metamodel`, the simple relational metamodel, the suite's pivot
- [eer-tutorial-basic](./eer-tutorial-basic/): m2m, Part 1, fixed logic
- [eer-tutorial-advanced](./eer-tutorial-advanced/): m2m, Part 2, the entity rule specialized with `@SpecPoint` and `@SpecOption`
- [eer-tutorial-configuration-based](./eer-tutorial-configuration-based/): m2m, Part 3, the relationship mapping decided by a configuration model
- [eer-tutorial-name-scopes](./eer-tutorial-name-scopes/): m2m, Part 4, natural names and path references on name-scoped stages
- [sql-tutorial-basic](./sql-tutorial-basic/): m2t, Part 1, one SQL DDL file
- [sql-tutorial-structured](./sql-tutorial-structured/): m2t, Part 2, named sections and multiple files
- [sql-tutorial-configuration-based](./sql-tutorial-configuration-based/): m2t, Part 3, output layout and quoting decided by a configuration model

The model-to-text tutorial picks up where the model-to-model one
leaves off: its sample model is what `eer-tutorial-basic` generates,
and all seven companions pivot on `rel-tutorial-metamodel`.

The tutorials themselves live on the docs site:
[the tutorial index](https://AelasticS.github.io/Synthesis/developer-guide/tutorial);
each package's README holds its usage loop.
