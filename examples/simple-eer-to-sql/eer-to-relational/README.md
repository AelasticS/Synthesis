# simple-eer-to-relational

Model-to-model transformation without variability, the simple example:
an EER schema (`simple-eer-metamodel`: schema, entities, attributes,
domains, and relationships with two roles) becomes a relational schema
(`simple-relational-metamodel`: schema, tables, and columns). The
mapping is fixed:

| Concern | Fixed behavior |
| --- | --- |
| Relationships | a foreign key column on the side with upper bound 1 |
| Primary keys | key attributes are auto increment |
| Names | camelCase (underscores dropped) |

For the same transformation with these three decisions left open and
closed per run by a configuration model, see
[simple-eer-to-sql-variability](../../simple-eer-to-sql-variability/).

The source model, [`sample/company.eer.tsx`](sample/company.eer.tsx),
declares `CompanySchema` with the entities `Person` and `Company` and a
1:N `Employment` relationship. The transformation is in
[`src/transformation.tsx`](src/transformation.tsx).

## Run

The `synth` download ships this example built and ready to install, in
the `examples` folder of the installation; see
[Running an example](https://AelasticS.github.io/Synthesis/developer-guide/examples#running-an-example).
The commands below work in a repository checkout.

Build, install, and run through the `synth` CLI. Run the build from the
repository root and the `synth` commands from this directory.

### 1. Build, install, import

```bash
# build: also builds the two metamodel packages it depends on
rush build -t simple-eer-to-relational

cd examples/simple-eer-to-sql/eer-to-relational
synth init
synth namespace mk demo
synth transformation install .
synth model import sample/company.eer.tsx --as demo/company
```

### 2. Run

```bash
synth transformation run simple-eer-to-relational --in demo/company \
  --out demo/company-rel --trace demo/company-trace

synth model export demo/company-rel   --to company.rel.tsx
synth model export demo/company-trace --to company.trace.tsx
```

The trace records each executed rule as a `RuleInvocation`.

`npm test` (after the build) runs the CLI smoke plus
[`scripts/verify.mjs`](scripts/verify.mjs), which asserts the exact
tables on the Company sample.

The mapping rules are explained on the page
[A simple EER to relational transformation, without variability](../../../apps/docs/docs/developer-guide/examples/simple-eer-to-sql.md).
