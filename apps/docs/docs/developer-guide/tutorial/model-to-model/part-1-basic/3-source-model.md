---
sidebar_position: 3
---

# 3. The source model

A transformation needs an input. This page authors one: a small Library
schema in the basic tutorial EER metamodel, with three entities, one
1:N relationship, and one M:N relationship, so that both branches of
the relationship rule are exercised by a single run.

Models in Synthesis are code. A model is a `.tsx` file written with the
metamodel's JSX tags, and it goes through the same compiler your
transformation does. That is the reason the metamodel had to exist
first, and it is also why a mistyped property name or a reference to a
nonexistent element is caught rather than tolerated.

## Authoring the file

Create `sample/library.tsx` in your package. Any location works; the
examples keep sample inputs under `sample/`. Here is the file complete,
from `examples/tutorial/eer-tutorial-basic/sample/library.tsx`:

```tsx
/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { EERSchema, Entity, Attribute, Domain, Relationship, Role } from 'eer-tutorial-metamodel/basic'
import type * as em from 'eer-tutorial-metamodel/basic/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-tutorial-metamodel/basic',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Sample EER schema for tutorial Part 1: one 1:N and one M:N relationship'
} as const

export default (store: ModelStore): ExprNode<em.IEERSchema> => (
  <EERSchema name="Library" store={store}>
    <Entity name="Book">
      <Attribute name="bookId" isKey={true}>
        <Domain name="number" />
      </Attribute>
      <Attribute name="bookTitle" isKey={false}>
        <Domain name="string" />
      </Attribute>
    </Entity>
    <Entity name="Author">
      <Attribute name="authorId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="authorName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Entity name="Category">
      <Attribute name="categoryId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="categoryName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    {/* 1:N: a book has at most one author. Part 1 maps this with a
        foreign key on the N side. */}
    <Relationship name="writtenBy">
      <Role name="AuthoredBy" lb="0" ub="1" domain={<Entity $refByName="Author"></Entity>} />
      <Role name="Wrote" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
    </Relationship>
    {/* M:N: books carry any number of categories and vice versa. Part 1
        maps this with a join table. */}
    <Relationship name="categorizedAs">
      <Role name="Categorized" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
      <Role name="Categorizes" lb="0" ub="M" domain={<Entity $refByName="Category"></Entity>} />
    </Relationship>
  </EERSchema>
)
```

### The anatomy of a model file

**The pragma.** `/** @jsx createExprNode */` on the first line tells
TypeScript to compile JSX through `createExprNode` instead of React's
`createElement`. Page 5 adds the matching `tsconfig.json` options. Miss
either and the compiler will complain about `React` not being defined.

**The imports.** The tags come flat from the metamodel package's
`basic` subpath; the interfaces come from `basic/model` and are
imported with `import type`, since they exist only at compile time.

**The `$synth` header.** This exported constant declares what the file
is: its kind (`model`), the metamodel it is written in, and its
authorship metadata. The CLI maintains this header. `model import`
validates it, fills in what is missing, and derives the metamodel from
the file's imports when the header does not state it. When a
transformation writes a model, the CLI generates the header itself and
adds provenance to it, as page 5 shows.

**The default export.** A model file exports a function of the store,
returning the JSX expression. The store is threaded in by the caller
(the CLI, or your own code) and handed to the root tag as
`store={store}`. Nothing below the root mentions the store again.

### Definition form and reference form

Look at how `number` is written. Its first occurrence defines it:

```tsx
<Domain name="number" />
```

Every later occurrence refers to that same element:

```tsx
<Domain $refByName="number" />
```

`$refByName` is what `WithRefProps` on page 1 was for: any tag can be
written in reference form, which resolves to an existing element by
name instead of creating a new one. Since `Domain`'s connection info is
`"attrDomain"`, both forms connect the domain to the attribute; only
one of them creates it.

The same mechanism appears in a prop rather than as a child:

```tsx
<Role name="AuthoredBy" lb="0" ub="1" domain={<Entity $refByName="Author"></Entity>} />
```

A role's `domain` property points at the entity that end of the
relationship connects. The entity already exists a few lines above, so
the role refers to it. References inside props are resolved when the
model is rendered, which is why forward references work: `writtenBy`
could just as well have been written before the entities.

### Element names are unique per model

This is the rule that most often surprises newcomers. The store
addresses every element by a model-wide path, so a name may be used
only once in the whole model, not once per container.

That is exactly why the three `number` and `string` domains are written
as references instead of being declared three times. Declare them
again and the render fails:

```text
Error: Import rejected: Failed to render model .../library.tsx:
newModelElement: Duplicate name "//www.aelastics.org/Library/number"
```

The path in the message shows the naming scheme. Attributes escape the
problem here only because `bookId`, `authorId`, and `categoryId` are
already distinct; had they all been called `id`, the model would need
qualified names. Generated models follow the same convention, which is
why the transformation on page 4 builds foreign key names like
`AuthorId_FK` rather than a bare `id_fk`.

## Creating a workspace

The CLI keeps models in a workspace, by default `~/.synth`. Create it
once:

```bash
synth init
```

```text
Creating workspace at ~/.synth
Created:
  ~/.synth/
  ├── config.json
  ├── models/
  ├── transformations/
  └── pipelines/

Workspace initialized successfully.
```

Models are organized into namespaces, which are just the first segment
of a model reference. Create one for the tutorial:

```bash
synth namespace mk demo
```

```text
Created namespace: demo
```

From now on the model is addressed as `demo/library`, never by file
path. That indirection is what lets a transformation, a pipeline, or a
teammate name the same model without agreeing on a directory layout.

## Importing is a validation gate

```bash
synth model import sample/library.tsx --as demo/library
```

```text
Imported demo/library
```

The single line of output hides real work. Import does not copy the
file and hope for the best. It transpiles the `.tsx`, resolves its
imports against the CLI installation (the mechanism page 1 explained),
renders the model into a store, resolves every `$refByName`, checks the
`$synth` header against the metamodel derived from the imports, and
only then writes the file into the workspace.

The consequence is an invariant worth relying on: **everything in the
workspace was loadable when it entered.** A transformation run never
has to defend itself against a model that does not parse, and failures
surface at import time, next to the file you just edited, with the line
that caused them.

Failures exit with code 2 and say what went wrong, as the duplicate
name above shows. Nothing is written to the workspace when import
fails.

## Next

You have a metamodel, a target metamodel, and a validated input model.
Now write the code that turns one into the other: the
[transformation](./4-transformation.md).
