# The simple-eer-to-sql suite

The compact example suite: one configuration-based transformation from
EER schemas to a relational schema, over two small suite-owned
metamodels. It has the same shape as the
[advanced suite](../advanced-eer-to-sql/), cut down to what fits on one
screen: three design issues, one relationship kind.

- [metamodels/eer](./metamodels/eer/): package `simple-eer-metamodel`, the compact EER metamodel
- [metamodels/relational](./metamodels/relational/): package `simple-relational-metamodel`, the compact relational metamodel
- [eer-to-relational](./eer-to-relational/): m2m, the configuration-based EER to relational mapping, three design issues

There is no text-generating companion in this suite: the advanced
suite's `rel-to-sql-ddl` reads `relational-metamodel`, while this
transformation produces `simple-relational-metamodel`, so the two do
not chain.

The suite is explained on the docs page
[A compact EER to relational transformation](../../apps/docs/docs/developer-guide/examples/simple-eer-to-sql.md);
the package README holds the usage loop and maps the paper's listings
to files.
