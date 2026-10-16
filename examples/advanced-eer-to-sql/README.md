# The eer-to-sql suite

The full-featured example suite: a configuration-based chain from EER
schemas to SQL DDL, bracketed by two diagram views, over two
suite-owned metamodels.

- [metamodels/eer](./metamodels/eer/): package `eer-metamodel`, the full EER metamodel
- [metamodels/relational](./metamodels/relational/): package `relational-metamodel`, the full relational metamodel
- [eer-to-relational](./eer-to-relational/): m2m, the configuration-based EER to relational mapping, nine design issues
- [rel-to-sql-ddl](./rel-to-sql-ddl/): m2t, SQL DDL from the relational schema, dialects as preset configurations
- [eer-to-mermaid-er](./eer-to-mermaid-er/): m2t, the ER diagram view of the EER source
- [rel-to-mermaid](./rel-to-mermaid/): m2t, the diagram of the produced relational schema

The two chain steps compose (`eer-to-relational` produces exactly
what `rel-to-sql-ddl` consumes), so an EER schema becomes DDL in one
run. The diagram views bracket the chain: `eer-to-mermaid-er` is a
sibling view over the same source, and `rel-to-mermaid` draws the
produced relational schema, so different configurations of the same
source become visibly different diagrams.

The suite is explained on the docs page
[A full-featured EER to SQL transformation](https://AelasticS.github.io/aelastics/developer-guide/examples/advanced-eer-to-sql);
each package's README holds its usage loop.
