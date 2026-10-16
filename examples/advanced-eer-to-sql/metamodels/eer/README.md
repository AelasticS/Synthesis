# eer-metamodel

The full EER (Extended Entity-Relationship) metamodel of the
eer-to-sql example suite: kernels, weak entities, aggregations,
subtypes with specializations, composite attributes, user-defined
domains with checks, integrity rules, and the mapping concepts that
connect them. It is the source language of the configuration-based
`eer-to-relational` mapping and of the `eer-to-mermaid-er` diagram
view.

Subpaths: the bare specifier `eer-metamodel` exports the JSX
components, `eer-metamodel/model` the type schemas, and
`eer-metamodel/as-model` the metamodel-as-model factory (`EERModel`)
that the transformation's binding model references.

The metamodel is explained on the suite page
[A full-featured EER to SQL transformation](https://AelasticS.github.io/aelastics/developer-guide/examples/advanced-eer-to-sql#the-metamodels).
