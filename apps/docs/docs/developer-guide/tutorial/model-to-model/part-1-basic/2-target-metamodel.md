---
sidebar_position: 2
---

# 2. The target metamodel

A transformation's signature has two halves. Page 1 covered the source
half. The target half is a relational metamodel, and there is one thing
to say about it before anything else: you do not author it. It ships as
the `rel-tutorial-metamodel` package and you consume it exactly as an
application developer consumes a library. What follows is a reading of
somebody else's metamodel, which is a skill of its own.

That is the normal case in practice. Target metamodels tend to describe
stable, widely shared technical spaces (relational schemas, class
models, workflow graphs), so they are written once and reused. Source
metamodels tend to be domain-specific and are more often written by
you.

The one the tutorial targets is `rel-tutorial-metamodel`, a simplified
relational metamodel that carries only what the tutorial needs. It is
the pivot of the whole tutorial suite: the model-to-model parts target
it, and the model-to-text parts read from it. Its sources live in
[`examples/tutorial/metamodels/rel-tutorial/src/`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/metamodels/rel-tutorial/src),
in the same three
files page 1 described on the source side: a types file
(`REL-tutorial.meta.model.type.ts`), a components file
(`REL-tutorial-components.ts`), and an `index.ts` tying them together.
Simplified does not mean approximate. Everything it does model, it
models correctly, and the section on what it leaves out says why each
omission is a choice rather than a shortcut.

## The concepts

From `examples/tutorial/metamodels/rel-tutorial/src/REL-tutorial.meta.model.type.ts`:

```ts
import * as t from "@aelastics/types"

import { ModelElement, Model } from "@aelastics/synthesis/metamodel"

export const RelTutorial_TypeSchema = t.schema("RelTutorialSchema")

export const RelSchema = t.subtype(Model, {}, "RelSchema", RelTutorial_TypeSchema)

export const Column = t.subtype(
  ModelElement,
  {
    type: t.string,
    isKey: t.boolean,
    isNullable: t.boolean,
    isAutoincrement: t.boolean,
    // The primary key column this column points at, when it is a
    // foreign key. One column, never several: the tutorial does not
    // model composite keys.
    references: t.optional(t.link(RelTutorial_TypeSchema, "Column")),
  },
  "Column",
  RelTutorial_TypeSchema
)

export const Table = t.subtype(
  ModelElement,
  {
    columns: t.arrayOf(Column),
  },
  "Table",
  RelTutorial_TypeSchema
)

export type IRelSchema = t.TypeOf<typeof RelSchema>
export type IColumn = t.TypeOf<typeof Column>
export type ITable = t.TypeOf<typeof Table>
```

The shape is the one page 1 described: a schema, concepts declared with
`t.subtype` over `Model` and `ModelElement`, a `t.link` for a reference
that cannot be written as a direct type because the target is the
concept being declared, and interfaces derived with `t.TypeOf`. Three
concepts, and that is the whole language: a schema that contains
tables, tables that contain columns, and columns that carry their SQL
type, their flags, and possibly a reference.

Note what a `Column` records:

- `type` is a plain string holding the SQL type, such as `INTEGER` or
  `VARCHAR(255)`. The metamodel does not model SQL types further; the
  transformation produces the string.
- `isKey`, `isNullable`, `isAutoincrement` are booleans your rules set
  explicitly. There are no defaults to fall back on, so every column
  the transformation creates states all of them.
- `references` is optional, and when present it is a link to another
  `Column`: the primary key column this column points at. Page 4 builds
  it for both the join table columns and the single foreign key column.

## A foreign key references a column, not a table

`references` pointing at a `Column` rather than at a `Table` is the one
modelling decision on this page worth dwelling on, because it is the
difference between a foreign key and a vague association.

A foreign key column holds values drawn from some other column's
values. `Book.AuthorId_FK` is not related to the `Author` table in
general; it holds `Author.authorId` values, and that is what makes a
join well defined and what makes the two columns have to agree on
type. Recording only the table name would leave the actual target
implicit, to be rediscovered by whoever consumes the model, and it
would be ambiguous the moment a table has more than one candidate key.

The link says it outright. In JSX, a foreign key column reads:

```tsx
<Column name="AuthorId_FK" type="INTEGER" isKey={false} isNullable={true} isAutoincrement={false}
        references={<Column $refByName="authorId" />} />
```

`references` is a prop like any other, and its value is a reference
expression rather than a nested definition. It is the same `$refByName`
form the sample model on page 3 uses to point an `Attribute` at an
existing `Domain`, here on the target side and inside a prop.

## No flag says a column is a foreign key

Read the `Column` declaration again and notice what is not in it. There
is no boolean property recording whether a column is a foreign key, and
the module header says why: a column is a foreign key exactly when it
references another column, so the fact is derived from the model rather
than stored beside it, where the two could disagree.

A stored flag would be a second copy of a fact the model already
contains, and two copies of one fact can fall out of step: a column
flagged as a foreign key with no reference, or one carrying a reference
while the flag denies it. Neither is a state anyone would write on
purpose, and a metamodel that cannot express them does not need a rule
forbidding them.

The practical effect on your transformation is that a rule never sets a
foreign key flag. It either gives a column a `references` link or it
does not, and any consumer of the model asks the same question by
testing whether `references` is present.

## What this metamodel leaves out, and why

Three things a production relational metamodel has are deliberately
absent here. The module header lists them:

```ts
/*
 * Deliberately excluded, because they belong to the full relational
 * metamodel rather than to a first transformation: composite foreign
 * keys (a reference here is a single column link, so composites cannot
 * even be expressed), foreign key constraints as first class elements,
 * and indexes.
 */
```

**Composite foreign keys** are excluded structurally, not by
convention. `references` is one link, not a list, so a key spanning two
columns has no representation at all. That is worth more than a comment
saying "not supported": the tutorial's rules cannot accidentally
produce half of a composite key, because there is nothing to write it
into.

**Foreign key constraints as first class elements** would make the
constraint an element in its own right, with a name of its own, the
list of columns it spans, and the table it references. Real schemas
need that, if only to be able to drop a constraint by name. A first
transformation does not, and adding it would mean every foreign key
rule creates two elements instead of one.

**Indexes** are a physical design concern rather than a logical one.
They belong to the same later stage as constraint naming, and none of
the three tutorial parts has anything to say about them.

All three are present in the full relational metamodel,
`relational-metamodel`, owned by the `eer-database-suite` example suite, where
`ForeignKey` and
`Index` are declared as concepts beside `Table` and `Column`, and a
foreign key holds a list of columns rather than a single one. That is
the metamodel the standalone `eer-to-relational` example names as its
target, and that example is the place to look once you want the
production shape of this mapping; the
[examples catalog](../../../examples/index.md) describes it. The
tutorial does not use it, because a first transformation should spend
its pages on the mechanics of transforming rather than on the breadth
of a target language.

## A link cares about order

There is a consequence of `references` being a link rather than a
string, and it is the kind of thing that is obvious once stated and
puzzling when met for the first time in an error message.

A string reference is inert. Writing `references="Author"` would be
legal at any point, whether or not anything named `Author` existed,
because nothing resolves it. A link is not inert. `$refByName` looks up
an element that is already in the store, so the referenced primary key
column has to have been created before the column that points at it.

Page 4's transformation satisfies this by construction. Its template
emits all entities before any relationship, so every table and every
attribute column exists before the relationship rules run, and the
foreign keys they build always find their targets. Part 2 adds one more
case to keep in mind: a weak entity's table references its owner's key
column, so the owner has to appear before the weak entity in the source
model. The Part 2 sample lists `Book` before `BookCopy` for exactly
that reason.

## The tag functions

From `examples/tutorial/metamodels/rel-tutorial/src/REL-tutorial-components.ts`,
complete:

```ts
import * as r from "./REL-tutorial.meta.model.type.js"
import {
  CpxTemplate,
  ExprNode,
  IStore,
  Template,
  WithRefProps,
} from "@aelastics/synthesis/jsx"

export type IModelProps = WithRefProps<r.IRelSchema> & { store?: IStore };

export const RelSchema: CpxTemplate<IModelProps, r.IRelSchema> = (props) => {
  return new ExprNode(r.RelSchema, props, undefined)
}

export const Table: Template<r.ITable> = (props) => {
  return new ExprNode(r.Table, props, undefined)
}

export const Column: Template<r.IColumn> = (props) => {
  return new ExprNode(r.Column, props, "columns")
}
```

Read it with page 1's rule in hand. `Column` passes `"columns"` as its
third argument, so a `Column` nested inside a `Table` connects into
`table.columns`. `Table` passes `undefined`, so a table is a top-level
element of the schema. `RelSchema` is the root component and takes the
store.

There is no fourth tag. `references` is a property of `Column`, not a
concept of its own, so a reference is written with the `Column` tag in
reference form inside a prop rather than with a tag named after the
relationship.

These are the tags your transformation's template writes. When page 4
shows

```tsx
<Table name={e.name}>
  {e.attributes.map((a) => this.attributeToColumn(a))}
</Table>
```

it is calling exactly these functions.

## Import paths

The metamodel is reached through the package convention page 1
described:

```ts
import * as rmT from 'rel-tutorial-metamodel/model'
import { RelSchema, Table, Column } from 'rel-tutorial-metamodel'
```

The first gives you the aelastics types and the derived interfaces
(`rmT.IRelSchema`, `rmT.ITable`, `rmT.IColumn`), which is what the
transformation class is typed against. The second gives you the JSX
tags. As on the source side, the two are kept apart because `RelSchema`
means one thing in each, and the package's `index.ts` says so:

```ts
// Simplified relational metamodel for the developer-guide tutorial.
// Package convention: the bare specifier ("rel-tutorial-metamodel") exports
// the JSX template components flat. The data-type schemas live behind
// "rel-tutorial-metamodel/model" to avoid identifier clashes (e.g.
// `RelSchema` is both an @aelastics/types Type and a JSX template), and
// "rel-tutorial-metamodel/as-model" exports the metamodel-as-model factory.
export * from "./REL-tutorial-components.js"
```

## What the manifest needs from it

The metamodel appears twice in Part 1's `synth.json`, and the two
entries do different jobs:

```json
"target": {
  "metamodel": "rel-tutorial-metamodel",
  "components": "rel-tutorial-metamodel"
}
```

`target.metamodel` is an identity. It declares what the transformation
produces, and the CLI stamps it into the generated model's `$synth`
header so that later tools (a chained transformation, a `model
validate` run) can check compatibility without loading any code.

`target.components` is a capability. An m2m run does not stop at
objects in a store: the result is written back into the workspace as a
`.tsx` model file, and that file is JSX written with the target
metamodel's tags. The CLI therefore needs the module those tags live
in, so it can emit the right import statement and the right tag names.
You can see the effect directly in the generated output on page 5,
which opens with

```tsx
import { Column, RelSchema, Table } from 'rel-tutorial-metamodel'
```

That is `target.components` showing up in the artifact. Omit it and the
CLI has no way to serialize an m2m result.

Note that the source side of the manifest declares only a `metamodel`
and no `components`. The CLI reads source models, and a model file
carries its own imports, so nothing extra is needed there.

## Next

Both metamodels are in place, so the transformation's signature is
fixed: `abstractM2M<em.IEERSchema, rmT.IRelSchema>`. Before writing it,
you need something to run it on. The
[source model](./3-source-model.md) comes next.
