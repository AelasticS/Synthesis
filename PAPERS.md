# Papers

This file maps the code listings in papers about Synthesis to the files in
this repository that they come from.

## Supporting Design Decisions in Rule-Based Model Transformations

The listings come from the example
[examples/simple-eer-to-sql-variability/eer-to-relational](examples/simple-eer-to-sql-variability/eer-to-relational).
The File column gives paths inside that folder.

### Listings 1 to 7: source files

| Listing | Description | File | Export or method |
| --- | --- | --- | --- |
| 1 | Source model: `CompanySchema` | [sample/company.eer.tsx](examples/simple-eer-to-sql-variability/eer-to-relational/sample/company.eer.tsx) | default export, the `EERSchema` named `CompanySchema` |
| 2 | Decision Model: `RelationSchemaDesignIssues` | [src/decision-model.tsx](examples/simple-eer-to-sql-variability/eer-to-relational/src/decision-model.tsx) | `RelationSchemaDesignIssues` |
| 3 | Binding Model: `ER_Bindings` | [src/binding-model.tsx](examples/simple-eer-to-sql-variability/eer-to-relational/src/binding-model.tsx) | `ER_Bindings` |
| 4 | Transformation class declaration | [src/transformation.tsx](examples/simple-eer-to-sql-variability/eer-to-relational/src/transformation.tsx) | class `SimpleEerToRelational` (with `@M2M()`) |
| 5 | Regular rule: Entity to Table transformation | [src/transformation.tsx](examples/simple-eer-to-sql-variability/eer-to-relational/src/transformation.tsx) | method `Entity2Table` |
| 6 | Variability point rule for relationship mapping | [src/transformation.tsx](examples/simple-eer-to-sql-variability/eer-to-relational/src/transformation.tsx) | method `RelationshipMapping` (`@VarPoint("OneToManyStrategy")`) |
| 7 | Variability option rules: foreign key and join table strategies | [src/transformation.tsx](examples/simple-eer-to-sql-variability/eer-to-relational/src/transformation.tsx) | methods `relationshipAsForeignKey` (`Option("ForeignKey")`, the default) and `relationshipAsJoinTable` (`Option("JoinTable")`) |

### Listings 8 to 11: generated

These listings are produced by the `synth` CLI. The commands come from the
example's [README](examples/simple-eer-to-sql-variability/eer-to-relational/README.md).
Run the build from the repository root and the `synth` commands from the
example folder.

Setup:

```bash
rush build -t simple-eer-to-relational-variability

cd examples/simple-eer-to-sql-variability/eer-to-relational
synth init
synth namespace mk demo
synth transformation install .
synth model import sample/company.eer.tsx --as demo/company
```

Listing 8, the default Configuration Model:

```bash
synth config init simple-eer-to-relational-variability --for demo/company --out demo/company-cfg
synth config show demo/company-cfg
```

Listing 9, the edited configuration. It is saved as
[config/company.edited-cm.tsx](examples/simple-eer-to-sql-variability/eer-to-relational/config/company.edited-cm.tsx).
Import it with:

```bash
synth model import config/company.edited-cm.tsx --as demo/company-edited-cfg \
  --tx simple-eer-to-relational-variability --dependency demo/company
synth config show demo/company-edited-cfg
```

Listing 10, the target relational schema, and Listing 11, the Trace Model:

```bash
synth transformation run simple-eer-to-relational-variability --in demo/company \
  --config demo/company-edited-cfg --out demo/company-rel --trace demo/company-trace

synth model export demo/company-rel   --to company.rel.tsx         # Listing 10
synth model export demo/company-trace --to company.trace.tsx       # Listing 11
```

### Larger version

A larger version of the transformation is
[examples/eer-database-suite/eer-to-relational](examples/eer-database-suite/eer-to-relational).

## Models as Values in a Model Expression Algebra

The running example is
[examples/workflow/org-to-approval](examples/workflow/org-to-approval)
with the workflow metamodel. Listing numbers are fixed in the paper; the
tables below list the quoted files.

### Engine and metamodels

| Quoted code | File |
| --- | --- |
| `createExprNode`, the JSX factory | [libraries/synthesis/src/jsx-runtime/handle.ts](libraries/synthesis/src/jsx-runtime/handle.ts) |
| Abstract metamodel (`ModelElement`, `Model`) | [libraries/synthesis/src/metamodel-core/models.type.ts](libraries/synthesis/src/metamodel-core/models.type.ts) |
| Workflow metamodel | [examples/workflow/metamodels/workflow/src/workflow.meta.model.type.ts](examples/workflow/metamodels/workflow/src/workflow.meta.model.type.ts) |
| Elementary templates of the workflow metamodel (`Task`, `Process`, `Sequence`, `Parallel`, `Step`, `SubProcess`, ...) | [examples/workflow/metamodels/workflow/src/workflow-components.ts](examples/workflow/metamodels/workflow/src/workflow-components.ts) |
| Organization metamodel | [examples/workflow/metamodels/org/src/org.meta.model.type.ts](examples/workflow/metamodels/org/src/org.meta.model.type.ts) |

### Model expressions and templates

| Quoted code | File |
| --- | --- |
| A model literal with all four operators: model creation, element creation, computation and reference | [examples/workflow/workflow-to-bpmn/sample/model-expression.tsx](examples/workflow/workflow-to-bpmn/sample/model-expression.tsx) |
| A model template, `ConfigurableApproval` | [examples/workflow/workflow-to-bpmn/sample/configurable-approval.tsx](examples/workflow/workflow-to-bpmn/sample/configurable-approval.tsx) |
| A higher-order model template, `GenericApproval` and `TwoStepApproval` | [examples/workflow/workflow-to-bpmn/sample/generic-approval.tsx](examples/workflow/workflow-to-bpmn/sample/generic-approval.tsx) |

### Transformation

| Quoted code | File |
| --- | --- |
| Source model: the organization `AcmeCorp` | [examples/workflow/org-to-approval/sample/acme.tsx](examples/workflow/org-to-approval/sample/acme.tsx) |
| The transformation `OrgToApprovalTransformation`, with the specialization point `OrgUnit2Approval` and its options `Department2Approval` and `Board2Approval` | [examples/workflow/org-to-approval/src/transformation.tsx](examples/workflow/org-to-approval/src/transformation.tsx) |

### Generated target model and trace

Run the build from the repository root and the `synth` commands from
`examples/workflow/org-to-approval`:

```bash
rush build -t org-to-approval

cd examples/workflow/org-to-approval
synth init
synth namespace mk demo
synth transformation install .
synth model import sample/acme.tsx --as demo/acme

synth transformation run org-to-approval --in demo/acme --out demo/approval \
  --param '{"worker":"Judy","sensitivity":3}' --trace demo/approval-trace

synth model export demo/approval       --to approval.tsx          # the target model
synth model export demo/approval-trace --to approval.trace.tsx    # the trace
```
