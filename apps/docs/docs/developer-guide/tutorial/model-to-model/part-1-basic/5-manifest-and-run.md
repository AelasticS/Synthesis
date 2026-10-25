---
sidebar_position: 5
---

# 5. The manifest and the run

The transformation class is finished. What remains is turning the
directory it lives in into something the CLI can install and execute:
a manifest that describes the package, a build that compiles the JSX,
and the three commands that install it, run it, and show the result.

## The package layout

A transformation package is an npm package with one extra file. The
finished one looks like this:

```text
eer-tutorial-basic/
├── package.json
├── synth.json
├── tsconfig.json
├── src/
│   └── transformation.tsx
└── sample/
    └── library.tsx
```

If you are starting from nothing rather than reading the example, the
CLI scaffolds that shape:

```bash
synth transformation init my-tx
```

```text
Creating transformation project: my-tx
Created:
  my-tx/
  ├── package.json
  ├── synth.json
  ├── tsconfig.json
  └── src/
      └── index.ts

Next steps:
  cd my-tx
  npm install
  # Edit src/index.ts to implement your transformation
  synth transformation build
```

The scaffolded `src/index.ts` is a placeholder. Part 1's implementation
lives in `src/transformation.tsx`, which is why the manifest's `entry`
below points at `./dist/transformation.js`.

## `synth.json`, field by field

The manifest tells the CLI what the package is before any of its code
is loaded. Here it is complete:

```json
{
  "kind": "m2m",
  "entry": "./dist/transformation.js",
  "exportName": "EER2RelBasicTransformation",
  "source": {
    "metamodel": "eer-tutorial-metamodel/basic"
  },
  "target": {
    "metamodel": "rel-tutorial-metamodel",
    "components": "rel-tutorial-metamodel"
  }
}
```

**`kind`** is `m2m` for a model-to-model transformation or `m2t` for a
model-to-text one. It decides how a run is invoked and what it
produces: an `m2m` run writes a model back into the workspace with
`--out`, an `m2t` run writes files with `--out-dir`.

**`entry`** names the compiled module, package-relative, pointing into
the `tsc` output. It is `./dist/transformation.js` and not
`./src/transformation.tsx`, because the CLI loads compiled JavaScript.
Forgetting to build is therefore the most common first failure.

**`exportName`** names the export inside that module holding the
transformation class. `transformation run` loads exactly that export,
so it must match the class name in the source file
(`EER2RelBasicTransformation`).

**`source.metamodel`** declares what the transformation consumes, as
the metamodel package's specifier. The CLI compares it against the
input model's declared metamodel before doing any engine work, and
refuses a mismatch.

**`target.metamodel`** declares what the transformation produces. The
CLI stamps it into the generated model's `$synth` header, which is what
makes chaining and later validation possible.

**`target.components`** names the module holding the target metamodel's
JSX tag functions. As page 2 explained, an m2m result is written back
as a `.tsx` model file written in those tags, so the CLI needs the
module to emit the right import and the right tag names.

Two things are deliberately *not* in the manifest. The package's name
and version are not repeated here; they come from `package.json`, and
the CLI reads them from there when it installs. And there is no flag
saying the transformation is configuration-based: in Part 3 that
follows from the presence of a `parts` block declaring a decision model
and a binding model.

The package root is the only supported location for `synth.json`.

## `package.json`

Ordinary npm metadata, with nothing Synthesis-specific except the
dependencies:

```json
{
  "name": "eer-tutorial-basic",
  "version": "0.1.0",
  "private": true,
  "description": "Tutorial Part 1 companion: simple EER to relational transformation with fixed logic",
  "author": "Sinisa Neskovic",
  "license": "Apache-2.0",
  "type": "module",
  "main": "dist/transformation.js",
  "files": [
    "dist",
    "synth.json"
  ],
  "scripts": {
    "build": "tsc",
    "test": "node ../../smoke.mjs"
  },
  "dependencies": {
    "@aelastics/synthesis": "workspace:*",
    "eer-tutorial-metamodel": "workspace:*",
    "rel-tutorial-metamodel": "workspace:*"
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "@aelastics/synthesis-cli": "workspace:*"
  }
}
```

The three runtime dependencies are the three things the transformation
imports: the `@aelastics/synthesis` library, which supplies the JSX
factory and the engine base class, and the two metamodel packages.
Declaring the metamodels as ordinary dependencies is the whole
distribution story: installing the transformation brings them along,
and the CLI's resolver finds them there (the rule page 1 explained).
`files` ships `dist` and `synth.json`, which is everything an installed
package needs. The `build` script runs plain `tsc`, with no bundler and
no monorepo tooling, so the package can be lifted out of the repository
and built anywhere.

The `workspace:*` ranges are a repository detail: until the packages
are published to npm, they resolve through the workspace. In a
standalone package these become ordinary version ranges.

## Wiring up JSX

Three small pieces make a package a JSX package, and all three must
agree.

**In `tsconfig.json`**, name the factory:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "jsx": "react",
    "jsxFactory": "createExprNode"
  },
  "include": ["src"]
}
```

`"jsx": "react"` selects classic JSX compilation, and
`"jsxFactory": "createExprNode"` replaces `React.createElement` with
the Synthesis factory. `outDir` and `rootDir` are what make `entry`
resolve to `./dist/transformation.js`, and `include` covers `src` only,
so the sample model under `sample/` is not compiled into the package.

**In every `.tsx` file**, the matching pragma on the first line:

```tsx
/** @jsx createExprNode */
```

**In every `.tsx` file**, an import that actually brings the factory
into scope:

```tsx
import { createExprNode } from '@aelastics/synthesis/jsx'
```

The pragma names an identifier; the import provides it. A file with the
pragma but no import compiles to a call to something that does not
exist.

`createExprNode` is the factory the compiler emits calls to. You never
call it yourself: JSX notation is the authoring style, and the factory
is what the pragma makes the compiler do behind it.

## Build

```bash
npm run build
```

`synth transformation build` does the same thing: it prefers the
package's own `build` script and falls back to `tsc`. Either way the
result is `dist/transformation.js` plus its declarations and source
maps, which is what `entry` points at.

## Install

```bash
synth transformation install .
```

```text
Installed transformation 'eer-tutorial-basic@0.1.0' (m2m) to ~/.synth/transformations/eer-tutorial-basic
```

Install reads `package.json` for the name and version, validates the
manifest, and registers the package under the workspace. From here on
the transformation is addressed by name, exactly as models are
addressed by reference.

## Run

```bash
synth transformation run eer-tutorial-basic --in demo/library --out demo/library-rel
```

```text
Running eer-tutorial-basic@0.1.0 (m2m) on demo/library
Wrote demo/library-rel (~/.synth/models/demo/library-rel.tsx)
```

The run loads the manifest, checks that `demo/library`'s metamodel
equals `source.metamodel`, imports the entry module, instantiates the
exported class with a store, renders the source model into it, calls
`main()`, and serializes the resulting model back into the
workspace as a new `.tsx` file.

## Inspect

```bash
synth model show demo/library-rel
```

```text
Ref:         demo/library-rel
Path:        ~/.synth/models/demo/library-rel.tsx
Size:        2071 bytes
Kind:        model
Metamodel:   rel-tutorial-metamodel
Version:     0.1.0
Author:      unknown
Description: Generated by eer-tutorial-basic from demo/library
Tags:        (none)
License:     (none)
Created:     2026-08-29T00:31:11.859Z
Modified:    2026-08-29T00:31:11.859Z
Generated:   by eer-tutorial-basic@0.1.0 on 2026-08-29T00:31:11.859Z
```

The metamodel is the one the manifest declared as the target, and the
provenance records which transformation produced this model, at which
version, from which source. That last line is what makes a generated
model traceable rather than merely present.

## The output

Open `~/.synth/models/demo/library-rel.tsx`. The generated file is
ordinary JSX written in the target metamodel's tags, with a header the
CLI wrote:

```tsx
/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import { Column, RelSchema, Table } from 'rel-tutorial-metamodel'

export const $synth = {
  kind: 'model',
  metamodel: 'rel-tutorial-metamodel',
  references: {},
  generatedBy: {
    tx: 'eer-tutorial-basic',
    txVersion: '0.1.0',
    config: 'defaults',
    date: '2026-08-29T00:31:11.859Z'
  },
  createdAt: '2026-08-29T00:31:11.859Z',
  modifiedAt: '2026-08-29T00:31:11.859Z',
  author: 'unknown',
  version: '0.1.0',
  description: 'Generated by eer-tutorial-basic from demo/library',
  tags: [],
  license: null,
  custom: {}
} as const

export default (store) => (
<RelSchema store={store} name="Library_rel">
  <Table name="Book">
    <Column name="bookId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="bookTitle" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
  </Table>
  <Table name="Author">
    <Column name="authorId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="authorName" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
  </Table>
  <Table name="Category">
    <Column name="categoryId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="categoryName" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
  </Table>
  <Table $refByName="Book">
    <Column name="AuthorId_FK" type="INTEGER" isKey={false} isNullable={true} isAutoincrement={false} references={<Column $refByName="authorId" />} />
  </Table>
  <Table name="categorizedAs">
    <Column name="BookId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="bookId" />} />
    <Column name="CategoryId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="categoryId" />} />
  </Table>
</RelSchema>
)
```

Every rule from page 4 is visible in it:

- Three entities became three tables, each with a column per attribute.
  Key attributes are auto-increment and not nullable; the others are
  nullable. Domains became SQL types: `number` is `INTEGER`, `string`
  is `VARCHAR(255)`. None of these columns has a `references` prop,
  which is exactly how the model says they are not foreign keys.
- The 1:N relationship `writtenBy` produced no table of its own. It
  produced `<Table $refByName="Book">`, a reference that grafts an
  `AuthorId_FK` column into the `Book` table declared above. The column
  is nullable because the `AuthoredBy` role has `lb="0"`, and it points
  at `<Column $refByName="authorId" />`, the primary key column of
  `Author` created four lines earlier. Its `INTEGER` type is the type
  of that same column, which is what makes the two comparable.
- The M:N relationship `categorizedAs` produced a table of its own,
  named after the relationship, with one non-nullable foreign key
  column per role, each pointing at its entity's key column.

Read the file top to bottom and every `references` target has already
been declared above the line that points at it. That is not a
coincidence of layout: page 4's two passes produced it, and a `.tsx`
model file is re-rendered in written order when it is imported again,
so a file in which a reference preceded its target would not load.

The output is a workspace model like any other. Nothing distinguishes
it from a hand-written one except its header, and it would pass `model
import` unchanged, which is what makes chaining transformations
possible.

## What can go wrong

**The manifest is missing or the directory is not a package.** Install
needs both files at the package root:

```text
Error: No package.json found in '<dir>': a transformation package
needs one for its name and version.
```

A directory with a `package.json` but no `synth.json` fails the same
way, naming the manifest. The package root is the only location the
CLI looks in.

**The input model is in the wrong metamodel.** Checked before any
engine work, with exit code 2:

```text
Error: Type mismatch: source model demo/library-rel declares metamodel
'rel-tutorial-metamodel' but transformation 'eer-tutorial-basic'
expects 'eer-tutorial-metamodel/basic'.
```

Running the transformation on its own output is the easiest way to
provoke this, and the message is worth recognizing.

**Compile errors mentioning `React` or an unknown JSX factory.** The
`/** @jsx createExprNode */` pragma is missing from the file, or
`jsx` and `jsxFactory` are missing from `tsconfig.json`, or the file
does not import `createExprNode`. All three have to agree.

**`entry` does not resolve.** The manifest points into `dist/`, so a
package that has not been built has nothing to load. Run the build
before the install, and rebuild after every source change.

**`exportName` does not match.** The CLI loads exactly the named export
from the entry module. Renaming the class without updating the manifest
produces a load failure rather than a compile error, so check both.

**A duplicate element name.** Element names are unique across a whole
model, not per container:

```text
newModelElement: Duplicate name "//www.aelastics.org/Library/number"
```

Page 3 covers the naming scheme. In generated models the same rule
applies, which is why the foreign key columns carry entity-qualified
names.

**A reference that comes before the thing it references.** Reorder the
generated file so the `categorizedAs` join table sits above the `Book`
table, and importing it back fails:

```text
Error: Import rejected: missing dependency 'bookId'; Failed to render
model <file>: Not existing object referenced with name "bookId" by
element '/DefaultSchema/RelTutorialSchema/Column'
```

`$refByName` resolves against what is already in the store, so a
reference can only name something declared before it. Page 4's two
passes are what keep the transformation on the right side of this rule,
and it is worth recognizing the message if you ever hand-edit a
generated model.

**An import the CLI cannot resolve.** Package imports in models and in
manifests must be resolvable, from the CLI installation or from an
installed transformation package's dependencies:

```text
Cannot resolve import '<specifier>'. Package imports must be resolvable
from the Synthesis CLI installation or from an installed transformation package.
```

The usual cause is a metamodel package the transformation forgot to
declare as a dependency. Page 1 explains why the restriction exists and
why relaxing it would break metamodel type identity.

## Where you are

You have gone the whole way: a source metamodel declared as aelastics
types with JSX tags, a target metamodel consumed as a library, a model
authored in JSX and admitted through the import gate, a transformation
class whose template maps one to the other, a manifest that describes
the package, and a build, install, run loop that produced a traceable
generated model.

Everything else in Synthesis is built on this loop. What Part 1 leaves
open is the `if` statement in `relationshipToStructure`, the single
place where the transformation made a design decision and hid it. Part
2 opens it up, starting with the variants the source model already
determines, and Part 3 takes on the ones it does not. Part 4 then
leaves the rules alone and makes the names natural. The
[tutorial overview](../index.md) describes what each part adds.
