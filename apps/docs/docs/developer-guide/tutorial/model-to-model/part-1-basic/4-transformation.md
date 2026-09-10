---
sidebar_position: 4
---

# 4. The transformation

Now the mapping itself. The whole transformation is one class in
`src/transformation.tsx`, and every listing below is taken from that
file in
[`examples/tutorial/eer-tutorial-basic`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/eer-tutorial-basic).

The file opens the way every JSX authoring file does, with the pragma
and the imports:

```tsx
/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M } from '@aelastics/synthesis/m2m'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as em from 'eer-tutorial-metamodel/basic/model'
import * as rmT from 'rel-tutorial-metamodel/model'
import { RelSchema, Table, Column } from 'rel-tutorial-metamodel'
```

Notice the asymmetry, and that it is exactly the asymmetry of a
transformation. From the **source** metamodel it imports only the
`/model` subpath: `em` gives the interfaces to type against and the
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

## `topRule()`: the whole target in one expression

```tsx
  topRule(s: em.IEERSchema): ExprNode<em.IEERSchema, rmT.IRelSchema> {
    return (
      <RelSchema name={`${s.name}_rel`} store={this.context.store}>
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

`topRule()` receives the rendered source model and returns the target
model as a single JSX expression, written with the target metamodel's
tags. This is the shape of every Synthesis transformation: the target
is described declaratively, and the source is traversed inside curly
braces with ordinary TypeScript.

Read the body as three decisions.

**The output root.** `<RelSchema>` is the target model's root, so it
receives the store from the context. Its name is derived from the
source model's name, so `Library` becomes `Library_rel`.

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
that ordering is load-bearing twice over. The relationship rule
attaches a foreign key column to a table that must already exist, and
it does so by reference. It also gives that column a `references` link
to the primary key column it points at, and page 2 explained that a
link resolves against what is in the store, so the referenced column
has to exist too. Both facts are supplied by the same ordering: every
table and every attribute column is created in the first pass, before
any relationship is looked at. Map relationships first and there would
be nothing to attach to and nothing to point at.

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
        isNullable={!a.isKey}
      />
    )
  }
```

Three of the five props encode small design decisions that Part 1
simply fixes:

- The column's SQL type comes from the attribute's domain, through
  `columnType` below.
- A key attribute becomes an auto-increment column
  (`isAutoincrement={a.isKey}`). Manual keys are the other defensible
  answer, and Part 3 turns exactly this into a decision.
- A key attribute is not nullable and a non-key attribute is
  (`isNullable={!a.isKey}`). Real schemas would want per-attribute
  control.

The metamodel gives none of those properties a default, so every column
the transformation creates states all four of `type`, `isKey`,
`isNullable` and `isAutoincrement`.

Then note what the rule does not write: there is no `references` prop
here. An attribute-derived column is never a foreign key, and because
page 2's metamodel derives that fact from the absence of a reference
rather than storing it in a flag, saying nothing is how the rule says
so. `references` is the one optional property of a `Column`, and
leaving it out is a statement rather than an omission. Foreign keys
come only from relationships.

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

A companion function answers the question the relationship rules ask
twice, once for the column's type and once for what it points at:

```tsx
  // A foreign key points at the primary key column of the entity it
  // references, so that column has to exist: an entity without a key
  // attribute cannot be referenced at all.
  private keyAttributeOf(entity: em.IEntity): em.IAttribute {
    const key = entity.attributes.find((a) => a.isKey)
    if (!key) {
      throw new Error(`Entity '${entity.name}' has no key attribute, so nothing can reference it`)
    }
    return key
  }
```

It returns the attribute itself rather than a type, because the
relationship rules need two things from it. Its domain gives the column
its SQL type, since a foreign key has to be type-compatible with the
key it references. Its name gives the column its `references` target,
since the generated primary key column carries the attribute's name.

The `throw` is the interesting line. An entity without a key attribute
cannot be referenced by anything, because there is no column to point
at, and page 2's metamodel gives the rule no way to fudge it: it cannot
write a reference to a table instead, and it cannot invent a plausible
type and leave the target unstated. Failing loudly is the only honest
answer, and it fails at the entity that is actually wrong, naming it.

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
            type={this.columnType(this.keyAttributeOf(role.domain).attrDomain)}
            isKey={false}
            isNullable={false}
            isAutoincrement={false}
            references={<Column $refByName={this.keyAttributeOf(role.domain).name} />}
          />
        ))}
      </Table>
    )
  }
```

A new table named after the relationship, with one foreign key column
per role. `role.domain` is the entity that role connects, so
`categorizedAs` produces `BookId_FK` pointing at `Book`'s key column
`bookId` and `CategoryId_FK` pointing at `Category`'s `categoryId`.
Neither column is nullable: a row in a join table that references
nothing means nothing.

The `references` prop is JSX nested inside JSX, which is worth reading
slowly the first time:

```tsx
references={<Column $refByName={this.keyAttributeOf(role.domain).name} />}
```

`keyAttributeOf(role.domain)` finds the source attribute that is the
entity's key, and `.name` is the name the attribute column was given
back in `attributeToColumn`, since that rule copies the attribute's
name straight through. So the expression resolves the already-created
`bookId` column and links this new column to it. Nothing here creates a
column; `$refByName` on the output side names one that exists.

### Everything else becomes a foreign key

```tsx
  relationshipAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const fkSide = rel.roles.find((r) => r.ub === '1') ?? rel.roles[0]
    const pkSide = rel.roles.find((r) => r !== fkSide) ?? rel.roles[1]

    return (
      <Table $refByName={pkSide.domain.name}>
        <Column
          name={`${fkSide.domain.name}Id_FK`}
          type={this.columnType(this.keyAttributeOf(fkSide.domain).attrDomain)}
          isKey={false}
          isNullable={fkSide.lb === '0'}
          isAutoincrement={false}
          references={<Column $refByName={this.keyAttributeOf(fkSide.domain).name} />}
        />
      </Table>
    )
  }
```

Two roles, two jobs. `fkSide` is the role with upper bound `1`: the
entity on that end supplies the key, so its name gives the column its
name and its key attribute gives the column its type and its
`references` target. `pkSide` is the other role, the N side, and its
entity's table is the one that receives the column. For `writtenBy`,
`fkSide` is `AuthoredBy` (an `Author`) and `pkSide` is `Wrote` (a
`Book`), so a column named `AuthorId_FK` pointing at `Author`'s
`authorId` column is added to the `Book` table. The `?? rel.roles[0]`
fallbacks keep the method total for degenerate role arrays.

Nullability follows the lower bound: `isNullable={fkSide.lb === '0'}`
means an optional end produces a nullable column, which is exactly what
`lb="0"` on `AuthoredBy` says.

This method uses `$refByName` on the output side twice, in two
different positions, and the distinction is worth naming. Inside
`references` it produced a value, the column being pointed at. In the
opening tag it produces a place:

```tsx
<Table $refByName={pkSide.domain.name}>
```

This is not a new table. It names an element the transformation already
produced (the `Book` table, created by `entityToTable`) and grafts the
column into it. A rule that adds to an existing element rather than
creating one is a normal, first-class thing to write.

Both positions need their target to exist already, which is the
ordering the template's two passes guarantee.

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
