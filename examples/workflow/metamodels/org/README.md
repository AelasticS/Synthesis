# org-metamodel

Organizational metamodel: an `Organization` is a hierarchy of
`OrgUnit`s (the parent/subUnits inverse) with `Worker`s as members
(the worksIn/members inverse), where a `Department` is a unit run by
a manager and a `Board` a unit governed by its members collectively.
It is the source language of `org-to-approval`, which reads the
hierarchy upward to derive a block-structured workflow model (a
process tree).

Subpaths: the bare specifier `org-metamodel` exports the JSX
components; `org-metamodel/model` exports the type schemas.

The metamodel is explained on the suite page
[The workflow suite](https://AelasticS.github.io/Synthesis/developer-guide/examples/workflow#the-metamodels).
