---
sidebar_position: 2
title: "A simple EER to relational transformation, without variability"
---

# A simple EER to relational transformation, without variability

The
[`examples/simple-eer-to-sql`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql)
suite is the smallest example of an EER to relational mapping: two
metamodels and one model-to-model transformation between them, with
fixed logic and no variability. It is cut down to what fits on one
screen: three entity-level concepts and one relationship kind. Its goal
is to show the plain shape of a transformation, from the source model to
the trace, before any decision is opened. The same mapping with three of
its decisions opened as design issues is the
[simple suite with variability](./simple-eer-to-sql-variability.md); the
[full-featured suite](./eer-database-suite.md) takes the structure
to full EER semantics.

What the suite contains:

- **Two simple metamodels**
  ([`simple-eer-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/metamodels/eer),
  [`simple-relational-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/metamodels/relational)).
  Both follow the three-facet package convention: the bare specifier
  exports the JSX components, `/model` the type schemas, and
  `/as-model` the metamodel as a model (`EERModel`, `RELModel`).
- **One transformation**,
  [`simple-eer-to-relational`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational)
  (model to model), exporting `SimpleEerToRelational`. It extends
  `abstractM2M` and ships a sample source model.
- **A trace per run**, recording which rule produced which element.

There is no text-generating companion in this suite. The full
suite's `rel-to-sql-ddl` reads `relational-metamodel`, while this
transformation produces `simple-relational-metamodel`, so the two
do not chain.

The package
[README](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/eer-to-relational/README.md)
stays short: it gives the commands. Every output shown below is verbatim
output of the transformation, and `npm test` in the package asserts it
through the real CLI.

## The metamodels

The suite owns both metamodels
([`simple-eer-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/metamodels/eer)
and
[`simple-relational-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/simple-eer-to-sql/metamodels/relational),
under `examples/simple-eer-to-sql/metamodels/`). They are smaller than
the [full suite's](./eer-database-suite.md#the-metamodels), and this
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
export class SimpleEerToRelational extends abstractM2M<IEERSchema, rmT.IRelSchema> {
  main(s: IEERSchema) { /* RelSchema with a Table per Entity, then the relationships */ }
  ...
}
```

`main` renders a `RelSchema` containing one table per entity, followed
by the result of `RelationshipMapping` for every relationship.

### Entities and attributes

`Entity2Table` and `Attribute2Column` are `@E2E` rules: an entity
becomes a table, and each attribute becomes a column in it. The column
type comes from the attribute's domain (`number` becomes `INTEGER`,
`string` becomes `VARCHAR(255)`), `isKey` is copied, and key attributes
are auto increment. Both rules route names through `applyNaming`, which
removes underscores (camelCase).

### Relationships

`RelationshipMapping` is an `@E2E` rule too, and it always produces a
foreign key. It returns a `<Table $refByName=…>` wrapping a `Column`: it
refers by name to the table of the foreign key side (the entity whose
role has upper bound 1, here `Person`) and contributes the foreign key
column to it. The column is named after, and references, the other
entity (`CompanyIdFK` referencing `Company`), and it is nullable when
the role's lower bound is 0. No new table appears.

The foreign key column is typed `VARCHAR(255)`: the example does not
resolve the referenced key's type, and the default of its type helper
applies.

Auto increment keys, the foreign key mapping and camelCase names are
fixed in the code. In the
[version with variability](./simple-eer-to-sql-variability.md#the-design-space)
they are three design issues (`PrimaryKeyStrategy`, `OneToManyStrategy`
and `NamingConvention`) closed per run by a configuration.

## Running it

The example ships with `synth`; `$EX` is the
[examples folder](./index.md#running-an-example) of the installation.

```bash
EX=/usr/local/synth/examples      # Windows PowerShell: $EX = 'C:\synth\examples'

synth init
synth namespace mk com.example
synth transformation install $EX/simple-eer-to-relational
synth model import $EX/simple-eer-to-relational/sample/company.eer.tsx \
  --as com.example/company

synth transformation run simple-eer-to-relational --in com.example/company \
  --out com.example/company-rel --trace com.example/company-trace
```

In a repository checkout, build the package with
`rush build -t simple-eer-to-relational` and install it from
`./examples/simple-eer-to-sql/eer-to-relational` instead.

The relational schema produced for the Company sample:

```tsx
<RelSchema store={store} name="CompanySchema_Relational_Schema">
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

The third `Table` is a reference to `Person` that contributes the
foreign key column; it is not a new table.

## Where to go next

- [The same suite with variability](./simple-eer-to-sql-variability.md)
  opens three of these fixed choices as design issues, with a decision
  model, a binding model and configurations.
- [The full-featured suite](./eer-database-suite.md) takes the
  same structure to full EER semantics, SQL DDL and Mermaid diagrams.
- The [model-to-model tutorial](../tutorial/model-to-model/part-1-basic/index.md)
  builds a transformation from scratch, one file at a time.
