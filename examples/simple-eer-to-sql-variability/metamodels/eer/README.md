# simple-eer-metamodel-variability

The simple EER (Extended Entity-Relationship) metamodel of the
simple-eer-to-sql-variability example suite: kernels, weak entities, aggregations,
subtypes with specializations, integrity rules, and the mapping
concepts that connect them. Attributes are leaves typed by a domain;
a domain is a plain name with no base type or check, and there are no
composite attributes. It is the source language of the simple
`eer-to-relational` mapping.

Subpaths: the bare specifier `simple-eer-metamodel-variability` exports the JSX
components, `simple-eer-metamodel-variability/model` the type schemas, and
`simple-eer-metamodel-variability/as-model` the metamodel-as-model factory (`EERModel`)
that the transformation's binding model references.

The richer variant, with composite attributes, user-defined domains,
and optional attributes, lives in
[`eer-database-suite/metamodels/eer`](../../../eer-database-suite/metamodels/eer).
