# Part I: your first transformation

In this part you build, install, and run a complete Synthesis
transformation package. The transformation itself is deliberately
minimal: it copies a relational schema to an identical relational
schema. With no mapping logic to distract, everything you learn is the
mechanics that every transformation package shares: the package layout,
the `synth.json` manifest, the transformation class, and the CLI loop
of build, install, and run.

The finished package exists in the repository as
[examples/rel-copy](../examples/rel-copy/); use it as the answer key
whenever you want to compare.

## Prerequisites

- A checkout of the Synthesis repository, built once (`rush install`
  and `rush build`). Until the `@synthesis/*` packages are published to
  npm, transformation packages resolve them from the repository
  workspace.
- The `synth` CLI. Inside the repository you can run it as
  `node apps/cli/bin/run.js`; this tutorial writes `synth` for short.

Two concepts carry the whole tutorial:

- The **workspace** is where your models live (by default under
  `~/.synth`). Models are `.tsx` files with a tool-maintained `$synth`
  header; you address them by reference like `demo/library-db`, never
  by file path.
- A **transformation package** is an npm package with one extra file:
  the `synth.json` manifest, which declares everything the CLI needs to
  install and run the transformation without loading its code.

## Step 1: scaffold the package

```bash
synth transformation init rel-copy
```

The CLI creates a directory with the smallest viable layout:

```
rel-copy/
├── package.json
├── synth.json
├── tsconfig.json
└── src/
    └── index.ts
```

- `package.json` carries plain npm metadata: name, version, a `build`
  script that runs `tsc`, and a `files` list that ships `dist` and
  `synth.json`. It contains no manifest data.
- `synth.json` is the transformation manifest, and the package root is
  its only supported location.
- `src/index.ts` is a placeholder class you will replace.

## Step 2: declare the interface in synth.json

The manifest tells the CLI what the package is before any code loads.
Replace the scaffolded placeholders so it reads:

```json
{
  "kind": "m2m",
  "entry": "./dist/index.js",
  "exportName": "RelCopyTransformation",
  "source": {
    "metamodel": "@synthesis/standard-metamodels/relational"
  },
  "target": {
    "metamodel": "@synthesis/standard-metamodels/relational",
    "components": "@synthesis/standard-metamodels/relational/components-legacy"
  }
}
```

Field by field:

- `kind` is `m2m` (model to model) or `m2t` (model to text).
- `entry` and `exportName` name the compiled module and the export that
  holds your transformation class. `transformation run` loads exactly
  that export.
- `source.metamodel` and `target.metamodel` declare what the
  transformation consumes and produces. The CLI checks the input
  model's metamodel against `source.metamodel` before running, and
  stamps `target.metamodel` into the output model's header.
- `target.components` names the JSX component module of the target
  metamodel. The CLI needs it to wrap m2m output into a workspace model
  file: the generated `.tsx` imports these components.

The package name and version are not repeated here; they come from
`package.json`.

## Step 3: implement the transformation class

Add the runtime dependencies to `package.json`:

```json
"dependencies": {
  "@synthesis/jsx-runtime": "workspace:*",
  "@synthesis/engine": "workspace:*",
  "@synthesis/standard-metamodels": "workspace:*"
}
```

Then replace `src/index.ts` with the transformation:

```ts
import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode } from '@synthesis/jsx-runtime'
import { abstractM2M } from '@synthesis/engine'
import type { ModelStore } from '@synthesis/engine'
import * as rmT from '@synthesis/standard-metamodels/relational/model-legacy'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/relational/components-legacy'

export class RelCopyTransformation extends abstractM2M<rmT.IRelSchema, rmT.IRelSchema> {
  constructor(store: ModelStore) {
    super(store)
  }

  template(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, rmT.IRelSchema> {
    const tables = s.elements
      .filter((el) => this.context.store.isTypeOf(el, rmT.Table))
      .map((el) => {
        const tab = el as rmT.ITable
        return createExprNode(
          Table,
          { name: tab.name },
          ...(tab.columns ?? []).map((c) =>
            createExprNode(Column, {
              name: c.name,
              type: c.type,
              isKey: c.isKey,
              isAutoincrement: c.isAutoincrement,
              isForeignKey: c.isForeignKey,
              isNullable: c.isNullable,
              ...(c.references ? { references: c.references } : {})
            })
          )
        )
      })
    return createExprNode(
      RelSchema,
      { name: `${s.name}_copy`, content: '', MDA_level: 'M1', store: this.context.store },
      ...tables
    )
  }
}
```

How to read it:

- A transformation extends `abstractM2M<Source, Target>`. The base
  class provides `transform()`, trace handling, and the serialized
  output the CLI persists; you implement only `template()`.
- `template()` receives the rendered source model and returns an
  expression tree built from the target metamodel's components.
  `createExprNode(Component, props, ...children)` is the JSX factory
  called directly; a metamodel's components (`RelSchema`, `Table`,
  `Column`) are ordinary functions, so no JSX syntax or decorators are
  required for a simple transformation.
- `this.context.store.isTypeOf(el, rmT.Table)` filters source elements
  by metamodel type.
- The output root gets a new name (`${s.name}_copy`) and the store from
  the context.

Build it:

```bash
npm run build
```

(`synth transformation build` does the same: it prefers the package's
`build` script and falls back to `tsc`.)

## Step 4: a workspace and a source model

The transformation needs an input. Create a workspace and a namespace:

```bash
synth init
synth namespace mk demo
```

Now author a small relational model as `sample/library-db.tsx` in the
package (any location works; the example keeps samples in `sample/`):

```tsx
/** @jsx createExprNode */

import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode } from '@synthesis/jsx-runtime'
import type { ModelStore } from '@synthesis/engine'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/relational/components-legacy'
import type * as rmT from '@synthesis/standard-metamodels/relational/model-legacy'

export const $synth = {
  kind: 'model',
  metamodel: '@synthesis/standard-metamodels/relational',
  author: 'Your Name',
  version: '0.1.0',
  description: 'Sample relational schema'
} as const

export default (store: ModelStore): ExprNode<rmT.IRelSchema> => (
  <RelSchema name="LibraryDb" content="" MDA_level="M1" store={store}>
    <Table name="book">
      <Column name="book_id" type="INTEGER" isKey={true} isForeignKey={false} isNullable={false} isAutoincrement={true} />
      <Column name="book_title" type="VARCHAR(255)" isKey={false} isForeignKey={false} isNullable={false} isAutoincrement={false} />
    </Table>
    <Table name="author">
      <Column name="author_id" type="INTEGER" isKey={true} isForeignKey={false} isNullable={false} isAutoincrement={true} />
      <Column name="author_name" type="VARCHAR(255)" isKey={false} isForeignKey={false} isNullable={false} isAutoincrement={false} />
    </Table>
  </RelSchema>
)
```

Two things to notice:

- The `$synth` header declares what the file is (kind, metamodel,
  authorship). The CLI maintains this header; `model import` validates
  it and stamps what is missing.
- Element names are unique across the whole model, not per table, so
  columns carry table-qualified names (`book_id`, `author_id`). This is
  the store's naming scheme, and it is also the convention generated
  transformations follow.

Import it:

```bash
synth model import sample/library-db.tsx --as demo/library-db
```

Import is a validation gate: the CLI transpiles the file, renders the
model, checks every reference, and only then copies it into the
workspace. What is in the workspace was loadable when it entered.

## Step 5: install and run

```bash
synth transformation install .
```

```
Installed transformation 'rel-copy@0.1.0' (m2m) to ~/.synth/transformations/rel-copy
```

Install validates the manifest and registers the package under the
workspace. Now run it:

```bash
synth transformation run rel-copy --in demo/library-db --out demo/library-db-copy
```

```
Running rel-copy@0.1.0 (m2m) on demo/library-db
Wrote demo/library-db-copy (~/.synth/models/demo/library-db-copy.tsx)
```

Inspect the result:

```bash
synth model show demo/library-db-copy
```

The header records provenance: the model was generated by
`rel-copy@0.1.0` from `demo/library-db`, with dates and the target
metamodel. Open the file itself and you will find the same tables and
columns under the schema name `LibraryDb_copy`, as ordinary JSX that
would pass `model import` again.

## What can go wrong

- `No transformation manifest found`: the package has no `synth.json`
  at its root. That is the only manifest location.
- Exit code 2 with a metamodel mismatch: the input model's metamodel
  does not equal `source.metamodel`. `transformation run` checks this
  before any engine work.
- `Duplicate name`: two elements in one model share a name. Recall that
  element names are unique per model; qualify them.

## Where you are

You have the full authoring loop: manifest, class, build, import,
install, run, provenance. Everything else in Synthesis builds on this
loop. In [Part II](./02-decision-based-transformations.md) the
transformation stops hard-coding its design decisions and turns them
into a declared, configurable design space.
