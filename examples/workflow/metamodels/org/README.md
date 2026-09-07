# org-metamodel

Organizational metamodel: an `Organization` is a hierarchy of
`OrgUnit`s (the parent/subUnits inverse) with `Worker`s as members
(the worksIn/members inverse). `Department` is a unit run by a
manager, `Board` a unit governed by its members collectively. The
`org-to-approval` transformation reads this hierarchy upward to derive
a block-structured workflow model, as explained on the docs page "The
workflow suite: block-structured workflows to BPMN to diagrams".

Subpaths: the bare package exports the JSX components; `/model` exports
the type schemas.
