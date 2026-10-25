# eer-to-relational

Configuration-based model-to-model transformation, the full-featured
example: an EER schema (`eer-metamodel`, with aggregations, weak
chains, specialization hierarchies, user-defined domains, composite
attributes, and integrity rules) becomes a rich relational schema
(`relational-metamodel`, with first-class keys, referential actions,
domains, and indexes). Every design question without a single right
answer is one of nine issues closed per run by a configuration model,
with table auditing and row history applied as higher-order
templates. The manifest's `parts` render the EER metamodel-as-model,
the decision model, and the binding model into the store before every
run.

## Run

```bash
npm run build   # from the repository root: rush build -t eer-to-relational

synth init
synth namespace mk demo
synth transformation install .
synth model import sample/library.tsx --as demo/library

# defaults: JoinedTables, JoinTable, auditing on, indexes on, snake_case
synth transformation run eer-to-relational --in demo/library --default-configs \
  --out demo/library-rel --trace demo/library-trace

# choose differently: generate a configuration, edit it, run with it
synth config init eer-to-relational --for demo/library --out demo/library-cfg
synth transformation run eer-to-relational --in demo/library \
  --config demo/library-cfg --out demo/library-rel2

# the chain: rel-to-sql-ddl consumes exactly what this produces
synth transformation run eer-to-relational rel-to-sql-ddl \
  --in demo/library --default-configs --out-dir ./generated
```

`npm test` runs the CLI smoke plus `scripts/verify.mjs`, asserting
exact tables, keys, indexes, audit columns, and trace resolutions.

The mapping rules, the design space, and the configurations drawn
side by side are explained on the suite page
[A full-featured EER database suite](https://AelasticS.github.io/Synthesis/developer-guide/examples/eer-database-suite).
