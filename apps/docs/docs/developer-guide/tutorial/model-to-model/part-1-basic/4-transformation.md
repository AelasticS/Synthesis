---
sidebar_position: 4
---

# 4. The transformation

Now the mapping itself. The whole transformation is one class in
`src/transformation.tsx`, and every listing below is taken from
`examples/eer-tutorial-basic/src/transformation.tsx`.

The file opens the way every JSX authoring file does, with the pragma
and the imports:

```tsx
/** @jsx createExprNode */

import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode } from '@synthesis/jsx-runtime'
import { abstractM2M } from '@synthesis/engine'
import type { ModelStore } from '@synthesis/engine'
import * as em from '@synthesis/standard-metamodels/eer-tutorial/basic/model'
import * as rmT from '@synthesis/standard-metamodels/relational/model-legacy'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/relational/components-legacy'
```

Notice the asymmetry, and that it is exactly the asymmetry of a
transformation. From the **source** metamodel it imports only the
`model` namespace: `em` gives the interfaces to type against and the
type objects to test elements with. From the **target** metamodel it
imports both, `rmT` for the interfaces and the tags for building. You
read the source and you write the target, so only the target needs JSX
tags.

## The class

```tsx
export class EER2RelBasicTransformation extends abstractM2M<em.IEERSchema, rmT.IRelSchema> {
  constructor(store: ModelStore) {
    super(store)
  }
```

A model-to-model transformation extends `abstractM2M<Source, Target>`,
with the two root interfaces the previous pages produced. The base
class supplies everything that is the same for every transformation:
the `transform()` entry point, the execution context, trace handling,
and the serialized result the CLI persists. You implement one method.

The constructor takes the `ModelStore` and passes it up. The store is
then reachable as `this.context.store`, which the code uses in two
places: to pass to the output root, and to test source element types.

## `template()`: the whole target in one expression

```tsx
  template(s: em.IEERSchema): ExprNode<em.IEERSchema, rmT.IRelSchema> {
    return (
      <RelSchema name={`${s.name}_rel`} content="" MDA_level="M1" store={this.context.store}>
        {s.elements
          .filter((el) => this.context.store.isTypeOf(el, em.Entity))
          .map((el) => this.entityToTable(el as em.IEntity))}
        {s.elements
          .filter((el) => this.context.store.isTypeOf(el, em.Relationship))
          .map((el) => this.relationshipToStructure(el as em.IRelationship))}
      </RelSchema>
    )
  }
```

`template()` receives the rendered source model and returns the target
model as a single JSX expression, written with the target metamodel's
tags. This is the shape of every Synthesis transformation: the target
is described declaratively, and the source is traversed inside curly
braces with ordinary TypeScript.

Read the body as three decisions.

**The output root.** `<RelSchema>` is the target model's root, so it
receives the store from the context and the `MDA_level`. Its name is
derived from the source model's name, so `Library` becomes
`Library_rel`.

**Selecting source elements by type.**
`this.context.store.isTypeOf(el, em.Entity)` asks the store whether an
element is an instance of the metamodel type `em.Entity`. This is where
page 1's point about type identity becomes concrete: the test compares
against the very type object the metamodel package exported, which is
the same object the model was rendered with only because both resolved
through the CLI's installation. The `as em.IEntity` cast afterwards is
the TypeScript side of the same fact, since `isTypeOf` is a runtime
check.

**Two passes, in order.** Entities are mapped before relationships, and
that ordering is load-bearing. The relationship rule attaches a foreign
key column to a table that must already exist, and it does so by
reference. Map relationships first and there would be nothing to attach
to.

Curly braces embed TypeScript, and an array of `ExprNode` values is a
valid set of children, so `filter` and `map` are all the traversal
machinery this transformation needs.

## Entities become tables

```tsx
  entityToTable(e: em.IEntity): ExprNode<rmT.ITable> {
    return (
      <Table name={e.name}>
        {e.attributes.map((a) => this.attributeToColumn(a))}
      </Table>
    )
  }
```

The rule is one line of structure: a table with the entity's name,
containing a column per attribute. Because the `Column` tag declares
`"columns"` as its connection info (page 2), the nested results land in
`table.columns` without the rule saying so.

Breaking rules out into methods like this is not required by the
framework in Part 1, but it is how transformations stay readable, and
it is what makes the later parts possible: in Parts 2 and 3, methods
exactly like `entityToTable` become traced, decorated rules, and the
rest of the class stays as it is.

## Attributes become columns

```tsx
  attributeToColumn(a: em.IAttribute): ExprNode<rmT.IColumn> {
    return (
      <Column
        name={a.name}
        type={this.columnType(a.attrDomain)}
        isKey={a.isKey}
        isAutoincrement={a.isKey}
        isForeignKey={false}
        isNullable={!a.isKey}
      />
    )
  }
```

Four of the six props encode small design decisions that Part 1 simply
fixes:

- The column's SQL type comes from the attribute's domain, through
  `columnType` below.
- A key attribute becomes an auto-increment column
  (`isAutoincrement={a.isKey}`). Manual keys are the other defensible
  answer, and Part 3 turns exactly this into a decision.
- A key attribute is not nullable and a non-key attribute is
  (`isNullable={!a.isKey}`). Real schemas would want per-attribute
  control.
- No attribute-derived column is ever a foreign key. Foreign keys come
  only from relationships.

Because the relational metamodel gives these properties no defaults,
every column the transformation creates states all of them.

## Domains drive the column types

```tsx
  // Domains carry the type information: a column's SQL type is derived
  // from the attribute's domain.
  private columnType(domain: em.IDomain): string {
    switch (domain.name.toLowerCase()) {
      case 'number':
        return 'INTEGER'
      case 'string':
        return 'VARCHAR(255)'
      case 'boolean':
        return 'BOOLEAN'
      default:
        return 'VARCHAR(255)'
    }
  }
```

This is the payoff of the `Domain` concept from page 1. The EER model
never says `INTEGER`; it says that `bookId` ranges over the domain
named `number`. Which SQL type that becomes is a target-side decision,
made here, in one place, by one function. Point the same source model
at a different target technology and this function is what you replace.

A companion function answers the question the relationship rule needs:
what type should a foreign key column have?

```tsx
  // A foreign key column has the type of the referenced entity's key
  // attribute.
  private keyColumnType(entity: em.IEntity): string {
    const key = entity.attributes.find((a) => a.isKey)
    return key ? this.columnType(key.attrDomain) : 'VARCHAR(255)'
  }
```

A foreign key has to be type-compatible with the key it references, so
the rule looks up the referenced entity's key attribute and maps its
domain with the same function. Entities without a key attribute fall
back to a string, which keeps the transformation total rather than
correct in a case the sample model does not contain.

## Relationships: the one deliberate conditional

Here is the place where the source model does not determine the answer,
and Part 1 answers it with a plain `if`:

```tsx
  // The fixed relationship logic of Part 1: one conditional decides the
  // mapping. Part 2 turns rule variants into type-dispatched
  // specializations, and Part 3 turns the genuinely open case into a
  // configuration-based rule.
  relationshipToStructure(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const [role1, role2] = rel.roles
    if (role1.ub === 'M' && role2.ub === 'M') {
      return this.relationshipAsJoinTable(rel)
    }
    return this.relationshipAsForeignKey(rel)
  }
```

Both role upper bounds are `M`, so the relationship is M:N and needs a
join table. Otherwise there is an N side, and the foreign key goes
there.

### M:N becomes a join table

```tsx
  relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable> {
    return (
      <Table name={rel.name}>
        {rel.roles.map((role) => (
          <Column
            name={`${role.domain.name}Id_FK`}
            type={this.keyColumnType(role.domain)}
            isForeignKey={true}
            isKey={false}
            references={role.domain.name}
            isNullable={false}
            isAutoincrement={false}
          />
        ))}
      </Table>
    )
  }
```

A new table named after the relationship, with one foreign key column
per role. `role.domain` is the entity that role connects, so
`categorizedAs` produces `BookId_FK` referencing `Book` and
`CategoryId_FK` referencing `Category`. Neither column is nullable: a
row in a join table that references nothing means nothing.

### Everything else becomes a foreign key

```tsx
  relationshipAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const fkSide = rel.roles.find((r) => r.ub === '1') ?? rel.roles[0]
    const pkSide = rel.roles.find((r) => r !== fkSide) ?? rel.roles[1]

    return (
      <Table $refByName={pkSide.domain.name}>
        <Column
          name={`${fkSide.domain.name}Id_FK`}
          type={this.keyColumnType(fkSide.domain)}
          isForeignKey={true}
          isKey={false}
          references={fkSide.domain.name}
          isNullable={fkSide.lb === '0'}
          isAutoincrement={false}
        />
      </Table>
    )
  }
```

Two roles, two jobs. `fkSide` is the role with upper bound `1`: the
entity on that end supplies the key, so its name gives the column its
name and its reference. `pkSide` is the other role, the N side, and its
entity's table is the one that receives the column. For `writtenBy`,
`fkSide` is `AuthoredBy` (an `Author`) and `pkSide` is `Wrote` (a
`Book`), so a column named `AuthorId_FK` referencing `Author` is added
to the `Book` table. The `?? rel.roles[0]` fallbacks keep the method
total for degenerate role arrays.

Nullability follows the lower bound: `isNullable={fkSide.lb === '0'}`
means an optional end produces a nullable column, which is exactly what
`lb="0"` on `AuthoredBy` says.

The one genuinely new idea here is `$refByName` in the target:

```tsx
<Table $refByName={pkSide.domain.name}>
```

This is not a new table. It is the reference form from page 3, used on
the output side: it names an element the transformation already
produced (the `Book` table, created by `entityToTable`) and grafts the
column into it. A rule that adds to an existing element rather than
creating one is a normal, first-class thing to write, and it is why
entities had to be mapped before relationships.

## What that conditional is doing there

Everything else in this class is a mechanical consequence of the two
metamodels. The `if` in `relationshipToStructure` is different: it
encodes a judgement about database design that the source model does
not contain. Written this way, that judgement is invisible to
everything outside the method body. It cannot be inspected, cannot be
overridden per relationship, and cannot be reported in a trace.

The rest of the tutorial dissolves it, in two different ways, because
there are two different kinds of variability hiding in this one
statement.

- **Part 2** deals with variants that the source model does determine.
  When the metamodel gains the `Kernel` and `Weak` entity subtypes, the
  entity rule stops inspecting its argument and becomes a
  specialization point (`@SpecPoint`) with one specialized
  implementation (`@SpecOption`) per subtype. The engine dispatches on
  the runtime type of the source element. A weak entity is a weak
  entity, and nothing should be able to decide otherwise.
- **Part 3** deals with what remains: the genuinely open choice. Should
  a 1:N relationship become a foreign key or a join table? Both are
  defensible, and the right answer depends on the project, sometimes on
  the individual relationship. Part 3 declares that as an issue with
  options in a decision model, binds it to the `Relationship` concept,
  and turns the two branches into `@VarOption` methods behind a
  `@VarPoint`. The choice then lives in a configuration model, is
  reported per element on every run, and can be changed without
  touching code.

Both rewrites start from the two methods you already have.
`relationshipAsJoinTable` and `relationshipAsForeignKey` survive
essentially unchanged; only the thing that picks between them is
replaced. That is why Part 1 splits them out rather than writing one
method with a branch inside.

## Next

The code is complete. The
[manifest and the run](./5-manifest-and-run.md) turn it into an
installable package and put it to work.
