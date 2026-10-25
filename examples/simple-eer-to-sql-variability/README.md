# The simple-eer-to-sql-variability suite

The simple example suite with variability: one configuration-based transformation from
EER schemas to a relational schema, over two small suite-owned
metamodels. It has the same shape as the
[eer-database-suite](../eer-database-suite/), cut down to what fits on one
screen: three design issues, one relationship kind.

- [metamodels/eer](./metamodels/eer/): package `simple-eer-metamodel-variability`, the simple EER metamodel
- [metamodels/relational](./metamodels/relational/): package `simple-relational-metamodel-variability`, the simple relational metamodel
- [eer-to-relational](./eer-to-relational/): m2m, the configuration-based EER to relational mapping, three design issues

There is no text-generating companion in this suite: the
eer-database-suite's `rel-to-sql-ddl` reads `relational-metamodel`, while this
transformation produces `simple-relational-metamodel-variability`, so the two do
not chain.

The same mapping without variability is the suite
[simple-eer-to-sql](../simple-eer-to-sql/). The two suites own separate
copies of the metamodels.

The suite is explained on the docs page
[A simple EER to relational transformation, with variability](../../apps/docs/docs/developer-guide/examples/simple-eer-to-sql-variability.md);
the package README holds the usage loop and maps the paper's listings
to files.
