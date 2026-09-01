# eer-tutorial-basic

Companion package of the model-to-model tutorial, Part 1. A simple EER
to relational transformation with fixed logic and no decorators:

- Entities become tables; attributes become columns whose SQL types are
  derived from their domains.
- Relationships are mapped by one plain conditional: M:N becomes a join
  table, everything else becomes a foreign key on the N side. Later
  tutorial parts dissolve exactly this conditional: Part 2 into
  type-dispatched specializations, Part 3 into configuration-based
  rules.

The source metamodel is the basic tutorial metamodel
(`eer-tutorial-metamodel/basic`): entities,
attributes over domains, and binary relationships with cardinality
roles. The tutorial authors this metamodel step by step; the shipped
module is the answer key.

## Try it

```bash
# Build the package (from the repository root: rush build -t eer-tutorial-basic)
npm run build

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library

synth transformation install .
synth transformation run eer-tutorial-basic --in demo/library --out demo/library-rel
synth model show demo/library-rel
```

The sample Library schema has one 1:N relationship (writtenBy) and one
M:N relationship (categorizedAs); the output contains `Book`, `Author`,
and `Category` tables, an `AuthorId_FK` foreign key column grafted onto
`Book`, and a `categorizedAs` join table with two foreign keys.

## What to look at next

[eer-tutorial-advanced](../eer-tutorial-advanced/), the Part 2
companion, adds Kernel and Weak entity subtypes and specializes the
entity rule with `@SpecPoint` and `@SpecOption`.
