# rel-to-mermaid

Model-to-text over the relational metamodel: the OUTPUT of the suite's
configurable `eer-to-relational` mapping, rendered as Mermaid
`erDiagram` text, so different configurations of the same source
become visibly different diagrams. It chains as `eer-to-relational`
then `rel-to-mermaid`. Every table gets an attribute block (type-first
lines with the SQL type made Mermaid-safe, `PK` and `FK` marks read
from the PrimaryKey element and the foreign key pairs, a `"nullable"`
comment on nullable columns); every foreign key gets a line, solid
(identifying) exactly when its columns sit inside the owner's primary
key; a `historyOf` link gets a dashed one-to-one line, deliberately
not a foreign key. Domains and indexes are diagram noise and are
skipped. The logic is fixed: a diagram renderer has no open design
questions at this scale, so the manifest declares no parts and the
CLI runs it without configuration flags. The conventions, with the
three configurations drawn side by side, are explained canonically in
the docs page "A full-featured EER to SQL transformation".

## The package anatomy

- [src/transformation.tsx](./src/transformation.tsx): one document per
  schema, the table blocks first, then the foreign-key lines, then the
  historyOf lines; an incomplete foreign key is a clear error.
- [sample/warehouse.tsx](./sample/warehouse.tsx): a compact warehouse,
  composite keys, a history table, a nullable DECIMAL column.
- [scripts/verify.mjs](./scripts/verify.mjs): the chain run three
  times on the suite's Library sample (defaults, TablePerClass with
  ForeignKey, SingleTable), each configuration asserted in the
  generated text, plus a direct run on the warehouse sample.

## Try it

```bash
synth init
synth namespace mk demo
synth transformation install ../eer-to-relational
synth transformation install .
synth model import ../eer-to-relational/sample/library.tsx --as demo/library
synth transformation run eer-to-relational rel-to-mermaid --in demo/library --default-configs --out-dir ./generated
cat generated/library_rel.mmd
```
