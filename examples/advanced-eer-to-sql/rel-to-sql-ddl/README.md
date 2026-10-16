# rel-to-sql-ddl

Configuration-based model-to-text transformation: a relational schema
(`relational-metamodel`) becomes SQL DDL, with `CREATE TABLE`
statements, named foreign-key constraints in their own section,
`CREATE INDEX` statements, and trigger stubs in a separate document.
Five issues are on offer: IdentifierQuoting, ReferentialActions,
DomainHandling, SqlDialect, and the per-table Clustering. A dialect
is a configuration, not code: the presets under [presets/](./presets/)
are authored by extension over the compiled `rel-to-sql-ddl/presets`
vocabulary and fit any input schema.

## Run

```bash
npm run build   # from the repository root: rush build -t rel-to-sql-ddl

synth init
synth namespace mk demo
synth transformation install .
synth model import sample/library-db.tsx --as demo/library-db

synth transformation run rel-to-sql-ddl --in demo/library-db \
  --default-configs --out-dir ./generated
cat generated/LibraryDb.sql

# run with a dialect preset
synth model import presets/postgres.tsx --as demo/cfg-pg --tx rel-to-sql-ddl
synth transformation run rel-to-sql-ddl --in demo/library-db \
  --config demo/cfg-pg --out-dir ./generated
```

`npm test` runs the CLI smoke plus `scripts/verify.mjs`, the suite's
end-to-end proof over the chain from `eer-to-relational`.

The DDL conventions and the dialect mechanism are explained on the
suite page
[A full-featured EER to SQL transformation](https://AelasticS.github.io/aelastics/developer-guide/examples/advanced-eer-to-sql#dialects-are-configurations-not-code).
