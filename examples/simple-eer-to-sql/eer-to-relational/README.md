# simple-eer-to-relational

Configuration-based model-to-model transformation, the compact example:
an EER schema (`simple-eer-metamodel`: schema, entities, attributes,
domains, and relationships with two roles) becomes a relational schema
(`simple-relational-metamodel`: schema, tables, and columns). Three
design issues are closed per run by a configuration model:

| Issue | Level | Options (default marked) |
| --- | --- | --- |
| `OneToManyStrategy` | element | `ForeignKey`, `JoinTable` (default) |
| `PrimaryKeyStrategy` | element | `UseAutoIncrement` (default), `UseManualIncrement` |
| `NamingConvention` | model | `CamelCase`, `SnakeCase` (default) |

The manifest's `parts` render the EER metamodel-as-model, the decision
model, and the binding model into the store before every run.

## Listings

<!-- Listing 1-11 from the paper: filled in from the paper's Word document. -->

| Listing | Description | File |
| --- | --- | --- |
| | | |

## Run

Build, install, and run through the `synth` CLI.

```bash
# build: from the repository root (also builds the two metamodel packages)
rush build -t simple-eer-to-relational

# install: from this directory
cd examples/simple-eer-to-sql/eer-to-relational
synth init
synth namespace mk demo
synth transformation install .
synth model import sample/company.eer.tsx --as demo/company

# run with the default option of every issue
synth transformation run simple-eer-to-relational --in demo/company \
  --default-configs --out demo/company-rel --trace demo/company-trace

# or choose differently: generate a configuration, edit it, run with it
synth config init simple-eer-to-relational --for demo/company --out demo/company-cfg
synth config edit demo/company-cfg
synth transformation run simple-eer-to-relational --in demo/company \
  --config demo/company-cfg --out demo/company-rel2
```

The sample, [`sample/company.eer.tsx`](sample/company.eer.tsx), declares
`CompanySchema` with the entities `Person` and `Company` and a 1:N
`Employment` relationship. Each `RelationshipMapping` shows up in the
trace as a `RuleInvocation` whose `Resolution` records the chosen option
and whether it was chosen by default.

The mapping rules and the design space are explained on the page
[A compact EER to relational transformation](https://AelasticS.github.io/aelastics/developer-guide/examples/simple-eer-to-sql).
