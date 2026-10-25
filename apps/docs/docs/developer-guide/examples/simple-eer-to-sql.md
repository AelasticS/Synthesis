---
sidebar_position: 2.5
title: "A compact EER to relational transformation"
---

# A compact EER to relational transformation

The
[`examples/simple-eer-to-sql`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql)
suite is the small sibling of the [full-featured suite](./advanced-eer-to-sql.md).
It has the same shape, two metamodels and one configuration-based
transformation between them, but everything is cut down to what fits on
one screen: three entity-level concepts, one relationship kind, and three
design issues. Its goal is to show every part of a configuration-based
transformation, from the decision model to the trace, without the volume
of the full suite: the same source model becomes structurally different
relational schemas under different configurations, with no change to the
transformation code.

What the suite contains:

- **Two compact metamodels**
  ([`simple-eer-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/metamodels/eer),
  [`simple-relational-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/metamodels/relational)).
  Both follow the three-facet package convention: the bare specifier
  exports the JSX components, `/model` the type schemas, and
  `/as-model` the metamodel as a model (`EERModel`, `RELModel`).
- **One transformation**,
  [`simple-eer-to-relational`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational)
  (model to model), exporting `SimpleEerToRelational`. It extends
  `DecisionAwareM2M` and ships a decision model, a binding model, a
  sample source model, and an edited configuration.
- **A trace per run**, recording which decision produced which table.

There is no text-generating companion in this suite. The full suite's
`rel-to-sql-ddl` reads `relational-metamodel`, while this transformation
produces `simple-relational-metamodel`, so the two do not chain.

This page is the canonical explanation of the example: the metamodels,
the mapping rule by rule, the design space with each decision's reason,
and the same source under two configurations. The package
[README](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/README.md)
stays short: it maps the listings of the accompanying paper to files and
gives the commands. Every output shown below is verbatim output of the
transformation, and `npm test` in the package asserts it through the real
CLI.

## The metamodels

The suite owns both metamodels
([`simple-eer-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/metamodels/eer)
and
[`simple-relational-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/metamodels/relational),
under `examples/simple-eer-to-sql/metamodels/`). They are smaller than
the [full suite's](./advanced-eer-to-sql.md#the-metamodels), and this
section is all you need to read the rest of the page.

### The EER side

The EER metamodel declares `EERSchema`, `Kernel`, `Entity`, `Weak`,
`Attribute`, `Domain`, `Relationship`, `Role`, `Subtype`,
`Specialization` and `Aggregation`. This transformation uses only five
of them: `EERSchema`, `Entity`, `Attribute`, `Domain` and
`Relationship`. A `Domain` is a plain name with no base type or check,
declared inside the attribute it types. A `Relationship` holds two
`Role` elements, each with a lower bound `lb`, an upper bound `ub` and a
`domain` link to the entity it reaches.

The sample,
[`sample/company.eer.tsx`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/sample/company.eer.tsx),
is the whole source model:

```tsx
<EERSchema name="CompanySchema" store={store}>
  <Entity name="Person">
    <Attribute name="personId" isKey={true}><Domain name="number" /></Attribute>
    <Attribute name="name" isKey={false}><Domain name="string" /></Attribute>
  </Entity>
  <Entity name="Company">
    <Attribute name="companyId" isKey={true}><Domain name="number" /></Attribute>
    <Attribute name="companyName" isKey={false}><Domain name="string" /></Attribute>
  </Entity>
  <Relationship name="Employment">
    <Role name="WorksIn" lb="0" ub="1" cnMapp="R" dcnMapp="R" domain={<Entity $refByName="Person" />} />
    <Role name="Hires" lb="0" ub="M" cnMapp="R" dcnMapp="R" domain={<Entity $refByName="Company" />} />
  </Relationship>
</EERSchema>
```

Read the roles as constraints on the entity they reach: a person works
in at most one company (`WorksIn`, upper bound 1), a company hires any
number of persons (`Hires`, upper bound M). The file also carries a
`$synth` header (`kind: 'model'`, `metamodel: 'simple-eer-metamodel'`).

### The relational side

The relational side is `RelSchema`, `Table`, `Column` and `Domain`. A
`Column` carries `isKey`, `isAutoincrement`, `isNullable`,
`isForeignKey` and `references`, where `references` is the *name* of the
referenced table, not a link. (The tutorial's `rel-tutorial-metamodel`
makes `references` a link and has no `isForeignKey`; the two are not
interchangeable.) The metamodel is deliberately flat: there are no
first-class key or foreign key elements, as in the full suite's
relational metamodel.

## The transformation, rule by rule

[`src/transformation.tsx`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/src/transformation.tsx)
defines `SimpleEerToRelational`:

```tsx
@M2M()
export class SimpleEerToRelational extends DecisionAwareM2M<
    IEERSchema, rmT.IRelSchema, {}, cm.IConfigurationModel
> {
  main(s: IEERSchema) { /* RelSchema with a Table per Entity, then the relationships */ }
  ...
}
```

`main` renders a `RelSchema` containing one table per entity, followed
by the result of `RelationshipMapping` for every relationship. The
fourth type parameter, the configuration model, is what makes the
configuration available to variability dispatch; a transformation
without variability stays an ordinary `M2M`.

### Entities and attributes

`Entity2Table` and `Attribute2Column` are plain `@E2E` rules: an entity
becomes a table, and each attribute becomes a column in it. Both route
names through `applyNaming`. The column type comes from the attribute's
domain (`number` becomes `INTEGER`, `string` becomes `VARCHAR(255)`),
`isKey` is copied, and `isAutoincrement` is set from the
`PrimaryKeyStrategy` decision, for key attributes only.

### Relationships

`RelationshipMapping` is the one genuinely open decision. It is
decorated `@E2E() @VarPoint("OneToManyStrategy")`, with `@E2E`
outermost, so the trace records the invocation after the variability
point has selected an option. Its two options are separate methods:

```tsx
@Default()
@VarOption("RelationshipMapping", Option("ForeignKey"))
relationshipAsForeignKey(rel: IRelationship) { /* a Column on the FK side's table */ }

@VarOption("RelationshipMapping", Option("JoinTable"))
relationshipAsJoinTable(rel: IRelationship) { /* a Table with two foreign key columns */ }
```

The first argument of `@VarOption` is the name of the *method* it
belongs to (`RelationshipMapping`), and `Option("ForeignKey")` matches
the name of an option in the decision model. `@Default()` marks the
option that runs when no other option's predicate holds. It should be the
option the decision model marks `isDefault`, which is `ForeignKey`.

- **ForeignKey.** The option returns a `<Table $refByName=…>` wrapping a
  `Column`: it refers by name to the table of the foreign key side (the
  entity whose role has upper bound 1, here `Person`) and contributes the
  foreign key column to it. The column is named after, and references,
  the other entity (`CompanyIdFK` referencing `Company`), and it is
  nullable when the role's lower bound is 0. No new table appears.
- **JoinTable.** The option emits a table of its own, named after the
  relationship, with two non-nullable foreign key columns, one per
  participant. The column for the role with upper bound 1 is the join
  table's key, because each person works in at most one company.

The foreign key columns are typed `VARCHAR(255)`: the example does not
resolve the referenced key's type, and the default of its type helper
applies.

### An attribute-level and a model-level point

`primaryKeyStrategy` (`@VarPoint("PrimaryKeyStrategy")`) returns
`a.isKey` under `UseAutoIncrement` and `false` under `UseManualIncrement`.
`applyNaming` (`@VarPoint("NamingConvention")`) leaves names untouched
apart from removing underscores under `CamelCase`, and splits
camel-cased words into lower-case, underscore-separated words under
`SnakeCase`. Neither is wrapped in `@E2E`, because they return a boolean
and a string, not model elements.

## Validation

The decision-framework metamodels declare their rules as constraints,
run by `synth model validate`. For a configuration model pass the
transformation that provides its context:

```bash
synth model validate com.example/company-cfg --tx simple-eer-to-relational
```

The rules that apply to this example:

- a binding references only issues of its binding model's decision
  model;
- a configuration selects only options of the binding model's decision
  model;
- an element-level choice selects an option of an element-level issue, a
  model-level choice an option of a model-level issue;
- there is at most one choice per element and issue, and at most one
  model-level choice per issue.

The binding rule is declared on the binding metamodel and covered by the
library's own tests, since the binding model ships inside the package
rather than in the workspace. Two further rules of the decision
metamodel need no check because the structure already guarantees them:
each option belongs to exactly one issue through its `parentIssue`, so no
option can be shared, and the `@Default()` option names the fallback of a
variability point.

## The design space

[`src/decision-model.tsx`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/src/decision-model.tsx)
declares `RelationSchemaDesignIssues`, a `DecisionModel` with three
issues. How issues are declared as data, bound to metamodel concepts,
and closed by configurations is the
[variability guide's](../guides/variability.md) subject; this page
records the decisions and their reasons:

- **OneToManyStrategy** (per 1:N relationship, ForeignKey default): a
  grafted foreign key is the lean idiom, and a join table leaves the
  participants' tables untouched and survives a later cardinality
  change. Genuinely open, so decided per relationship.
- **PrimaryKeyStrategy** (per key attribute, UseAutoIncrement default):
  whether keys autoincrement or are assigned by the application.
- **NamingConvention** (global, CamelCase default): identifier casing,
  camelCase or snake_case. Global because naming is a schema-wide
  convention.

At a glance:

| Issue | Tag | Granularity | Options (default first) |
| --- | --- | --- | --- |
| `OneToManyStrategy` | `ElementLevelIssue` | per relationship | `ForeignKey`, `JoinTable` |
| `PrimaryKeyStrategy` | `ElementLevelIssue` | per key attribute | `UseAutoIncrement`, `UseManualIncrement` |
| `NamingConvention` | `ModelLevelIssue` | global | `CamelCase`, `SnakeCase` |

All options are plain `<Option>` elements; none opens sub-issues. The
element-level issues are asked once per matching source element, and
`NamingConvention`, a model-level issue, is asked once per run. The
[design decisions guide](../guides/variability.md) explains the
distinction.

[`src/binding-model.tsx`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/src/binding-model.tsx)
exports `ER_Bindings` with two bindings, each with a `condition`: a
string of JavaScript source that returns a predicate over the source
element.

- `PKStrategyBinding` attaches `PrimaryKeyStrategy` to `Attribute`, only
  for key attributes (`a.isKey`).
- `OneToManyBinding` attaches `OneToManyStrategy` to `Relationship`, only
  for relationships with two roles in a 0..1 to many shape, so a
  many-to-many relationship never raises the issue.

`NamingConvention` needs no binding: it is a model-level issue, and
there is no element to attach it to.

## One source, two configurations

The configuration decides which of the structurally different schemas
the same source becomes. The default configuration is generated, not
written: `synth config init` creates one default choice per issue, global
and per element, which for the Company sample is four choices:
`NamingConvention` once, `PrimaryKeyStrategy` for `personId` and
`companyId`, and `OneToManyStrategy` for `Employment`. The
`PrimaryKeyStrategy` binding's condition excludes the non-key
attributes, and `name` and `companyName` receive no choice.

### The defaults: ForeignKey and CamelCase

Configuration values: `ForeignKey`, `UseAutoIncrement`, `CamelCase`.
The relationship adds a nullable column to `Person`, and no table of its
own appears:

```tsx
<RelSchema store={store} name="CompanySchema_Relational_Schema_with_Decision_Model">
  <Table name="Person">
    <Column name="personId" isKey={true} isAutoincrement={true} type="INTEGER" />
    <Column name="name" isKey={false} isAutoincrement={false} type="VARCHAR(255)" />
  </Table>
  <Table name="Company">
    <Column name="companyId" isKey={true} isAutoincrement={true} type="INTEGER" />
    <Column name="companyName" isKey={false} isAutoincrement={false} type="VARCHAR(255)" />
  </Table>
  <Table $refByName="Person">
    <Column name="CompanyIdFK" type="VARCHAR(255)" isForeignKey={true} isKey={false} references="Company" isNullable={true} />
  </Table>
</RelSchema>
```

### The edited configuration: JoinTable and SnakeCase

The developer reviews the generated configuration and changes two
choices: `Employment` uses a join table to avoid nulls in the `Person`
table, and the naming is snake_case. The package keeps the result as
[`config/company.edited-cm.tsx`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/config/company.edited-cm.tsx);
the changed choice also records its `assumptions`, `justification` and
`consequences`:

```tsx
<ElementLevelChoice
  name="ec_Employment_OneToManyStrategy"
  element={<Element $refByName="//www.aelastics.org/CompanySchema/Employment" />}
  selectedOption={<Option $refByName="//www.aelastics.org/RelationSchemaDesign/JoinTable" />}
  assumptions={"Join table avoids nulls; most persons in this domain are unemployed."}
  justification={"Join tables handle optional relationships cleanly without null values."}
  consequences={"Join table avoids nulls; most persons in this domain are unemployed; A new join table will manage the Person-Employment relationship."}
/>
```

The same transformation, run with it, produces:

```tsx
<RelSchema store={store} name="CompanySchema_Relational_Schema_with_Decision_Model">
  <Table name="person">
    <Column name="person_id" isKey={true} isAutoincrement={true} type="INTEGER" />
    <Column name="name" isKey={false} isAutoincrement={false} type="VARCHAR(255)" />
  </Table>
  <Table name="company">
    <Column name="company_id" isKey={true} isAutoincrement={true} type="INTEGER" />
    <Column name="company_name" isKey={false} isAutoincrement={false} type="VARCHAR(255)" />
  </Table>
  <Table name="employment">
    <Column name="person_id_fk" type="VARCHAR(255)" isForeignKey={true} references="Person" isNullable={false} isKey={true} />
    <Column name="company_id_fk" type="VARCHAR(255)" isForeignKey={true} references="Company" isNullable={false} isKey={false} />
  </Table>
</RelSchema>
```

The join table's key is the `Person` foreign key, since each person works
in at most one company. The two runs differ in three places: the
casing of every name, the extra table, and the missing nullable column
in `Person`.

### The trace

With `--trace <ref>`, each run persists a trace model. Each executed rule
is a `RuleInvocation` with its source and target elements, and the
variability point's consultation is a `Resolution` that references the
configuration choice that decided it. For the edited run:

```tsx
<RuleInvocation name="relationshipAsJoinTable_Employment" function="relationshipAsJoinTable"
    source={<SourceElement $refByName="//www.aelastics.org/CompanySchema/Employment" />}
    targets={[<TargetElement $refByName=".../employment" />]}>
  <Resolution name="r9_JoinTable" byDefault={false}
      choices={[<ChoiceRef $refByName=".../ec_Employment_OneToManyStrategy" />]} />
</RuleInvocation>
```

`function` names the executed option method, and `byDefault` is true when
the `@Default()` option ran because no condition was met, as in the
default run. The trace links the decision (`OneToManyStrategy`), through
the developer's choice (`JoinTable`), to the applied rule variant and to
the produced table. The
[design decisions guide](../guides/variability.md) describes the trace in
full.

## The manifest and running it

`synth.json` is the manifest. It has `kind: "m2m"`, `exportName:
"SimpleEerToRelational"`, the source and target metamodels, and a
`parts` block. The transformation is configuration-based because
`parts` names both a `decisionModel` (`RelationSchemaDesignIssues`) and a
`bindingModel` (`ER_Bindings`); the metamodel part (`EERModel` from
`simple-eer-metamodel/as-model`) is rendered first. See [Packaging
transformations](../guides/packaging-transformations.md) for the field
reference.

Build the package, install it, import the sample, and run:

```bash
rush build -t simple-eer-to-relational

synth transformation install ./examples/simple-eer-to-sql/eer-to-relational
synth model import ./examples/simple-eer-to-sql/eer-to-relational/sample/company.eer.tsx \
  --as com.example/company

# a default configuration for each issue
synth transformation run simple-eer-to-relational --in com.example/company \
  --default-configs --out com.example/company-rel

# or generate a configuration, edit it, and run with it
synth config init simple-eer-to-relational --for com.example/company \
  --out com.example/company-cfg
synth config edit com.example/company-cfg
synth transformation run simple-eer-to-relational --in com.example/company \
  --config com.example/company-cfg --out com.example/company-rel \
  --trace com.example/company-trace
```

### Using the saved edited configuration

The package ships the edited configuration of the previous section, so
you can run with it without generating or editing anything. A
configuration model needs the transformation that provides its render
context (`--tx`) and the source model it configures (`--dependency`), so
import it after the transformation and the sample:

```bash
synth model import ./examples/simple-eer-to-sql/eer-to-relational/config/company.edited-cm.tsx \
  --as com.example/company-edited-cfg \
  --tx simple-eer-to-relational --dependency com.example/company

# the imported choices; the changed ones lose their "(default)" mark
synth config show com.example/company-edited-cfg

synth transformation run simple-eer-to-relational --in com.example/company \
  --config com.example/company-edited-cfg --out com.example/company-rel-edited \
  --trace com.example/company-edited-trace
```

The imported model is a separate workspace model, so a configuration
generated with `config init` (`com.example/company-cfg` above) stays
untouched and both can be compared. The run prints the decisions it
applied, for example
`decision for element Employment: OneToManyStrategy -> JoinTable`.

### Verification

`npm test` in the package runs the CLI smoke and `scripts/verify.mjs`,
which executes both configurations above and asserts the exact tables
and the resolutions in the persisted traces. The package
[README](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/README.md)
walks the same loop step by step and maps the paper's Listings 1 to 11 to
the files and commands that produce them.

## Where to go next

- [The full-featured suite](./advanced-eer-to-sql.md) takes the same
  structure to full EER semantics and a much larger design space.
- The [model-to-model tutorial, part 3](../tutorial/model-to-model/part-3-configuration-based/index.md)
  builds a configuration-based transformation from scratch, one file at a time.
