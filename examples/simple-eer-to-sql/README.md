# The simple-eer-to-sql suite

The simple example suite without variability: one fixed transformation from
EER schemas to a relational schema, over two small suite-owned
metamodels. It has the same shape as the
[eer-database-suite](../eer-database-suite/), cut down to what fits on one
screen: one relationship kind, no design issues left open. The same
mapping with three open design issues is the suite
[simple-eer-to-sql-variability](../simple-eer-to-sql-variability/). The two
suites own separate copies of the metamodels.

- [metamodels/eer](./metamodels/eer/): package `simple-eer-metamodel`, the simple EER metamodel
- [metamodels/relational](./metamodels/relational/): package `simple-relational-metamodel`, the simple relational metamodel
- [eer-to-relational](./eer-to-relational/): m2m, the fixed EER to relational mapping

There is no text-generating companion in this suite: the
eer-database-suite's `rel-to-sql-ddl` reads `relational-metamodel`, while this
transformation produces `simple-relational-metamodel`, so the two do
not chain.

The suite is explained on the docs page
[A simple EER to relational transformation, without variability](../../apps/docs/docs/developer-guide/examples/simple-eer-to-sql.md);
the package README holds the usage loop.
