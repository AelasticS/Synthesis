# simple-eer-metamodel

The simple EER (Extended Entity-Relationship) metamodel of the
simple-eer-to-sql example suite: kernels, weak entities, aggregations,
subtypes with specializations, integrity rules, and the mapping
concepts that connect them. Attributes are leaves typed by a domain;
a domain is a plain name with no base type or check, and there are no
composite attributes. It is the source language of the simple
`eer-to-relational` mapping.

Subpaths: the bare specifier `simple-eer-metamodel` exports the JSX
components, `simple-eer-metamodel/model` the type schemas, and
`simple-eer-metamodel/as-model` the metamodel-as-model factory (`EERModel`),
which the transformation's manifest lists as a part.

The richer variant, with composite attributes, user-defined domains,
and optional attributes, lives in
[`eer-database-suite/metamodels/eer`](../../../eer-database-suite/metamodels/eer).
