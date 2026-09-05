---
sidebar_position: 3
---

# 3. The transformation

The class is Part 1's `EER2RelBasicTransformation` with a new name and
two changed naming sites. The template, `entityToTable`, the
relationship conditional, `columnType`, and `keyAttributeOf` are
byte-identical to Part 1, so this page shows only what moved. If any
of the unchanged pieces feel unfamiliar, Part 1's transformation page
is the reference.

## Rules that change by not changing

The attribute rule is the quiet winner of the scoped world:

```tsx
// Because the table scopes its columns, the attribute's natural name
// is carried over as is: every table can have its own `id`.
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

This is exactly Part 1's rule. In Part 1 it carried qualified names
(`bookId`) into the flat target because the source had to qualify
them. Now it carries natural names (`id`) into scoped tables, and the
target metamodel's `declareNamespace(Table)` is what makes that legal.
The rule did not get smarter; the naming world got saner underneath
it.

## The foreign key name

Part 1 named foreign key columns `AuthorId_FK`, a convention invented
to survive the flat pool. The scoped convention says what the column
points at:

```tsx
// The scoped foreign key naming convention: the referenced entity's
// name, lowercased at its head, prefixes its key attribute's name
// (`Author` and `id` give `authorId`), so the column name says what
// it points at and is unique inside its table by construction.
private foreignKeyName(entity: em.IEntity): string {
  const key = this.keyAttributeOf(entity)
  const head = entity.name.charAt(0).toLowerCase() + entity.name.slice(1)
  const tail = key.name.charAt(0).toUpperCase() + key.name.slice(1)
  return `${head}${tail}`
}
```

`Author` and `id` give `authorId`; `Book` and `id` give `bookId`. The
name is unique inside its table by construction, because a table holds
at most one foreign key per referenced entity in this tutorial's
world, and it is the name a database designer would have chosen by
hand.

## The reference becomes a path

Here is the foreign key rule in full, with the two changed lines in
context:

```tsx
relationshipAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> {
  const fkSide = rel.roles.find((r) => r.ub === '1') ?? rel.roles[0]
  const pkSide = rel.roles.find((r) => r !== fkSide) ?? rel.roles[1]
  const key = this.keyAttributeOf(fkSide.domain)

  return (
    <Table $refByName={pkSide.domain.name}>
      <Column
        name={this.foreignKeyName(fkSide.domain)}
        type={this.columnType(key.attrDomain)}
        isKey={false}
        isNullable={fkSide.lb === '0'}
        isAutoincrement={false}
        references={<Column $refByName={`${fkSide.domain.name}/${key.name}`} />}
      />
    </Table>
  )
}
```

Two things are worth tracing.

**The graft still works, unchanged.** `<Table $refByName="Book">`
reopens the `Book` table to add a column to it. Tables live in the
model's own scope, exactly where they always did, so a bare table name
resolves as before. Declaring `Table` a scope changed what is *inside*
tables, not where tables are.

**The column reference is now a path.** In Part 1 the rule emitted
`$refByName="authorId"`, a bare name that worked because there was
exactly one `authorId` in the whole model. The bare name `id` would
now be ambiguous three ways over, and worse than ambiguous: resolved
from inside the reopened `Book` scope, it would find `Book`'s *own*
`id`, the innermost match. The path `Author/id` says what is meant.
Resolution probes it outward like any reference: from inside `Book`,
the probe tries `Book/Author/id`, misses, moves out to the model
scope, and finds `//Library_rel/Author/id`. The join table rule
changes the same way, one path per role:

```tsx
references={<Column $refByName={`${role.domain.name}/${this.keyAttributeOf(role.domain).name}`} />}
```

## The manifest

`synth.json` differs from Part 1's only in the specifiers, all three
pointing at the scoped stages:

```json
{
  "kind": "m2m",
  "entry": "./dist/transformation.js",
  "exportName": "EER2RelNameScopesTransformation",
  "source": {
    "metamodel": "eer-tutorial-metamodel/name-scopes"
  },
  "target": {
    "metamodel": "rel-tutorial-metamodel/name-scopes",
    "components": "rel-tutorial-metamodel/name-scopes"
  }
}
```

The declared metamodels are what keep the worlds honest: this
transformation refuses a flat Part 1 model as input, and its output
declares the scoped stage so downstream tools know which naming rule
the model obeys.

## Where you are

Two naming sites changed, everything else stayed. That smallness is
the point: name scopes are a property of the metamodel, and a
transformation inherits the saner world mostly by doing nothing. The
last page runs the package and puts the two outputs side by side.
