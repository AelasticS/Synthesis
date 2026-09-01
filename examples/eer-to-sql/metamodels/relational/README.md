# relational-metamodel

The full relational metamodel of the eer-to-sql example suite: schemas, tables, domains, and columns with key, foreign-key, nullability, and autoincrement facets. It is the target language of the eer-to-relational example and the source language of the rel-to-sql-ddl example.

Subpath convention: the bare specifier `relational-metamodel` exports the JSX template components flat, `relational-metamodel/model` exports the data-type schemas, and `relational-metamodel/as-model` exports the metamodel-as-model factory (`RELModel`) that the DDL binding model references.
