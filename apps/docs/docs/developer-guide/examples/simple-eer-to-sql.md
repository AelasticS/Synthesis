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
design issues. Read it first if you want to see every part of a
configuration-based transformation without the volume of the full suite.

What the suite contains:

- **Two compact metamodels**
  ([`simple-eer-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/metamodels/eer),
  [`simple-relational-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/metamodels/relational)).
  Both follow the three-facet package convention: the bare specifier
  exports the JSX components, `/model` the type schemas, and
  `/as-model` the metamodel as a model (`EERModel`, `RELModel`).
- **One transformation**,
  [`simple-eer-to-relational`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational),
  exporting `SimpleEerToRelational`. It extends `DecisionAwareM2M` and
  ships a decision model, a binding model and a sample source model.

There is no text-generating companion in this suite. The full suite's
`rel-to-sql-ddl` reads `relational-metamodel`, while this transformation
produces `simple-relational-metamodel`, so the two do not chain.

## The metamodels

The EER side
declares `EERSchema`, `Kernel`, `Entity`, `Weak`, `Attribute`, `Domain`,
`Relationship`, `Role`,
`Subtype`, `Specialization` and `Aggregation`. This transformation uses
only five of them: `EERSchema`, `Entity`, `Attribute`, `Domain` and
`Relationship`. A `Domain` is a plain name, declared inside the attribute
it types. A `Relationship` holds two `Role` elements, each with a lower
bound `lb`, an upper bound `ub` and a `domain` link to the entity it
reaches.

The relational side is `RelSchema`, `Table`, `Column` and `Domain`. A
`Column` carries `isKey`, `isAutoincrement`, `isNullable`,
`isForeignKey` and `references`, where `references` is the *name* of the
referenced table, not a link. (The tutorial's `rel-tutorial-metamodel`
makes `references` a link and has no `isForeignKey`; the two are not
interchangeable.)

## The design space

[`src/decision-model.tsx`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/src/decision-model.tsx)
declares `RelationSchemaDesignIssues`, a `DecisionModel` with three
issues:

| Issue | Tag | Options (default marked) |
| --- | --- | --- |
| `OneToManyStrategy` | `ElementLevelIssue` | `ForeignKey`, `JoinTable` (default) |
| `PrimaryKeyStrategy` | `ElementLevelIssue` | `UseAutoIncrement` (default), `UseManualIncrement` |
| `NamingConvention` | `ModelLevelIssue` | `CamelCase`, `SnakeCase` (default) |

All options are plain `<Option>` elements; none opens sub-issues. The
element-level issues are asked once per matching source element, and
`NamingConvention`, a model-level issue, is asked once per run. The
[design decisions guide](../guides/variability.md) explains the
distinction.

[`src/binding-model.tsx`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/src/binding-model.tsx)
exports `ER_Bindings` with two bindings:

- `PKStrategyBinding` attaches `PrimaryKeyStrategy` to `Attribute`.
- `OneToManyBinding` attaches `OneToManyStrategy` to `Relationship`. Its
  `condition` is a string of JavaScript source that returns a predicate,
  and it accepts only relationships with two roles in a 0..1 to many
  shape, so a many-to-many relationship never raises the issue.

`NamingConvention` needs no binding: it is a model-level issue, and
there is no element to attach it to.

## The transformation

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
rules fall into three groups.

**Fixed rules.** `Entity2Table` and `Attribute2Column` are plain `@E2E`
rules. Both route names through `applyNaming`, and `Attribute2Column`
sets `isAutoincrement` from `primaryKeyStrategy`.

**An element-level variability point.** `RelationshipMapping` is
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
the name of an option in the decision model. The foreign key option
returns a `<Table $refByName=…>` wrapping a `Column`: it refers to the
table of the other side by name and contributes the foreign key column to it.

**An attribute-level and a model-level point.** `primaryKeyStrategy`
(`@VarPoint("PrimaryKeyStrategy")`) returns `a.isKey` under
`UseAutoIncrement` and `false` under `UseManualIncrement`.
`applyNaming` (`@VarPoint("NamingConvention")`) strips underscores under
`CamelCase` and splits camel-cased words into lower-case,
underscore-separated words under `SnakeCase`. Neither is wrapped in
`@E2E`, because they return a boolean and a string, not model elements.

## The sample and the manifest

[`sample/company.eer.tsx`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/sample/company.eer.tsx)
is a model file with a `$synth` header (`kind: 'model'`,
`metamodel: 'simple-eer-metamodel'`). It declares `CompanySchema` with
two entities, `Person` and `Company`, each with a numeric key attribute
and a string attribute, and a 1:N `Employment` relationship whose
`WorksIn` role has bounds 0..1 and whose `Hires` role has bounds 0..M.

`synth.json` is the manifest. It has `kind: "m2m"`, `exportName:
"SimpleEerToRelational"`, the source and target metamodels, and a
`parts` block. The transformation is configuration-based because
`parts` names both a `decisionModel` (`RelationSchemaDesignIssues`) and a
`bindingModel` (`ER_Bindings`); the metamodel part (`EERModel` from
`simple-eer-metamodel/as-model`) is rendered first. See [Packaging
transformations](../guides/packaging-transformations.md) for the field
reference.

## Running it

Install the package, import the sample, and run:

```bash
synth transformation install ./examples/simple-eer-to-sql/eer-to-relational
synth model import ./examples/simple-eer-to-sql/eer-to-relational/sample/company.eer.tsx \
  --as com.example/company

# a default configuration for each issue
synth transformation run simple-eer-to-relational --in com.example/company \
  --default-configs --out com.example/company-rel

# or edit the choices yourself
synth config init simple-eer-to-relational --for com.example/company \
  --out com.example/company-cfg
synth config edit com.example/company-cfg
synth transformation run simple-eer-to-relational --in com.example/company \
  --config com.example/company-cfg --out com.example/company-rel
```

Add `--trace <ref>` to a single-step run to persist the trace model.
Each `RelationshipMapping` shows up as a `RuleInvocation` carrying a
`Resolution` that records the chosen option and whether it was chosen by
default. The [design decisions guide](../guides/variability.md) describes
the trace in full.

## Where to go next

- [The full-featured suite](./advanced-eer-to-sql.md) takes the same
  structure to full EER semantics and a much larger design space.
- The [model-to-model tutorial, part 3](../tutorial/model-to-model/part-3-configuration-based/index.md)
  builds a configuration-based transformation from scratch, one file at a time.
