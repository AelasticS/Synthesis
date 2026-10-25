# simple-relational-metamodel-variability

The simple relational metamodel of the simple-eer-to-sql-variability example suite:
schemas, tables, domains, and columns. A column carries its type, key
and foreign-key flags, an optional reference, nullability, and
autoincrement; there are no first-class keys, indexes, or referential
actions. It is the target language of the simple `eer-to-relational`
mapping.

Subpaths: the bare specifier `simple-relational-metamodel-variability` exports the
JSX components, `simple-relational-metamodel-variability/model` the type schemas, and
`simple-relational-metamodel-variability/as-model` the metamodel-as-model factory
(`RELModel`).

The richer variant, with first-class primary and foreign keys,
referential actions, indexes, and wired domains, lives in
[`eer-database-suite/metamodels/relational`](../../../eer-database-suite/metamodels/relational).
