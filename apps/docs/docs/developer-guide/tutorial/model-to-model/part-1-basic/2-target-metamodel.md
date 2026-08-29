---
sidebar_position: 2
---

# 2. The target metamodel

A transformation's signature has two halves. Page 1 covered the source
half. The target half is the relational metamodel, and this page is
short for a good reason: you do not author it. It ships in
`@synthesis/standard-metamodels` and you consume it exactly as an
application developer consumes a library.

That is the normal case in practice. Target metamodels tend to describe
stable, widely shared technical spaces (relational schemas, class
models, workflow graphs), so they are written once and reused. Source
metamodels tend to be domain-specific and are more often written by
you.

## The concepts

From
`libraries/standard-metamodels/src/relational/REL.meta.model.type.legacy.ts`:

```ts
import * as t from "@aelastics/types"

import { ModelElement, Model } from "@synthesis/metamodel-core"

export const RelModel_TypeSchema = t.schema("RelModel_TypeSchema");

export const RelSchema = t.subtype(Model, {
}, "RelSchema", RelModel_TypeSchema);

export const Domain = t.subtype(ModelElement, {
  type: t.string,
  defaultValue: t.optional(t.string)
}, "Domain", RelModel_TypeSchema);

export const Column = t.subtype(ModelElement, {
  type: t.string,
  isKey: t.boolean,
  ownerTable: t.link(RelModel_TypeSchema, 'Table'),
  isForeignKey: t.boolean,
  references: t.optional(t.string),
  isNullable: t.boolean,
  isAutoincrement: t.boolean,
}, "Column", RelModel_TypeSchema);

export const Table = t.subtype(ModelElement, {
  columns: t.arrayOf(Column),
}, "Table", RelModel_TypeSchema);

export type ITable = t.TypeOf<typeof Table>
export type IRelSchema = t.TypeOf<typeof RelSchema>
export type IDomain = t.TypeOf<typeof Domain>
export type IColumn = t.TypeOf<typeof Column>
```

The shape is the same one page 1 described: a schema, concepts declared
with `t.subtype` over `Model` and `ModelElement`, a `t.link` for the
forward reference from `Column` to `Table`, and interfaces derived with
`t.TypeOf`. Only three concepts matter for Part 1: a schema that
contains tables, tables that contain columns, and columns that carry
their SQL type and their key and nullability flags. The relational
`Domain` concept exists for schemas that name their types centrally,
and Part 1's transformation does not use it: it writes the SQL type
straight into each column.

Note what a `Column` records:

- `type` is a plain string holding the SQL type, such as `INTEGER` or
  `VARCHAR(255)`. The relational metamodel does not model SQL types
  further; the transformation produces the string.
- `isKey`, `isNullable`, `isAutoincrement` are booleans your rules set
  explicitly. There are no defaults to fall back on, so every column
  the transformation creates states all of them.
- `isForeignKey` plus `references` (an optional string naming the
  referenced table) is how a foreign key is expressed. Page 4 uses this
  pair for both the join-table columns and the single foreign key
  column.

The module is named `.legacy` because a newer relational metamodel
exists alongside it. Part 1 uses the legacy one, which is the one the
example package and the CLI fixtures use; the choice affects nothing
you learn here.

## The tag functions

From `libraries/standard-metamodels/src/relational/REL-components.legacy.ts`,
complete:

```ts
import * as r from "./REL.meta.model.type.legacy"
import { CpxTemplate, ExprNode, IStore, Template, WithRefProps } from "@synthesis/jsx-runtime"

export type IModelProps = WithRefProps<r.IRelSchema> & { store?: IStore }

export const RelSchema: CpxTemplate<IModelProps, r.IRelSchema> = (props) => {
  return new ExprNode(r.RelSchema, props, undefined)
}

export const Domain: Template<r.IDomain> = (props) => {
  return new ExprNode(r.Domain, props, "domain")
}

export const Column: Template<r.IColumn> = (props) => {
  return new ExprNode(r.Column, props, "columns")
}

export const Table: Template<r.ITable> = (props) => {
  return new ExprNode(r.Table, props, undefined)
}
```

Read it with page 1's rule in hand. `Column` passes `"columns"` as its
third argument, so a `Column` nested inside a `Table` connects into
`table.columns`. `Table` passes `undefined`, so a table is a top-level
element of the schema. `RelSchema` is the root component and takes the
store.

These are the tags your transformation's template writes. When page 4
shows

```tsx
<Table name={e.name}>
  {e.attributes.map((a) => this.attributeToColumn(a))}
</Table>
```

it is calling exactly these functions.

## Import paths

The relational metamodel is reached through two subpath exports:

```ts
import * as rmT from '@synthesis/standard-metamodels/relational/model-legacy'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/relational/components-legacy'
```

The first gives you the aelastics types and the derived interfaces
(`rmT.IRelSchema`, `rmT.ITable`, `rmT.IColumn`), which is what the
transformation class is typed against. The second gives you the JSX
tags. As on the source side, the two are kept apart because `RelSchema`
means one thing in each.

## What the manifest needs from it

The relational metamodel appears twice in Part 1's `synth.json`, and
the two entries do different jobs:

```json
"target": {
  "metamodel": "@synthesis/standard-metamodels/relational",
  "components": "@synthesis/standard-metamodels/relational/components-legacy"
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
import { Column, RelSchema, Table } from '@synthesis/standard-metamodels/relational/components-legacy'
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
