# relational-metamodel

The full relational metamodel of the eer-to-sql example suite:
schemas, tables, domains, columns, first-class primary and foreign
keys (composite capable, with referential actions), and indexes,
where a table is a name scope for its columns. It is the target
language of the configuration-based `eer-to-relational` mapping and
the source language of `rel-to-sql-ddl` and of the `rel-to-mermaid`
diagram view.

Subpaths: the bare specifier `relational-metamodel` exports the JSX
components, `relational-metamodel/model` the type schemas, and
`relational-metamodel/as-model` the metamodel-as-model factory
(`RELModel`) that the DDL binding model references.

The metamodel is explained on the suite page
[A full-featured EER to SQL transformation](https://AelasticS.github.io/Synthesis/developer-guide/examples/advanced-eer-to-sql#the-metamodels).
