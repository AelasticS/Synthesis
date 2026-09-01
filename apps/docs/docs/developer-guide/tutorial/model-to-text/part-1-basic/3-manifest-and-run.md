---
sidebar_position: 3
---

# 3. The manifest and the run

The generator is finished. What remains is turning the directory it
lives in into something the CLI can install and execute, and then
looking at the file it produces.

## The package layout

A model-to-text package is an npm package with the same one extra file
a model-to-model package has:

```text
sql-tutorial-basic/
├── package.json
├── synth.json
├── tsconfig.json
├── src/
│   └── transformation.tsx
└── sample/
    └── library-rel.tsx
```

The sample is the relational schema the model-to-model tutorial's Part
1 generates. It is reproduced in the package verbatim rather than
rewritten by hand, so the two halves of the tutorial really do join up.

## `synth.json`, field by field

```json
{
  "kind": "m2t",
  "entry": "./dist/transformation.js",
  "exportName": "RelToSqlBasicTransformation",
  "source": {
    "metamodel": "rel-tutorial-metamodel"
  },
  "target": {
    "metamodel": "text"
  }
}
```

Three of the five entries are the same as in a model-to-model manifest,
and the
[model-to-model tutorial's page on it](../../model-to-model/part-1-basic/5-manifest-and-run.md)
covers them in full. `entry` names the compiled module, package
relative, so the package has to be built before it is installed.
`exportName` names the export holding the class, and it has to match
the class name in the source. `source.metamodel` declares what the
transformation consumes, and the CLI checks an input model against it
before doing any engine work.

Two entries are what make this a text generator.

**`kind` is `"m2t"`.** This is the single declaration that changes the
shape of a run. An `m2m` run serializes its result back into the
workspace as a model, addressed with `--out`; an `m2t` run hands its
result to the engine's text generation and writes files, addressed with
`--out-dir`. The CLI never guesses this from the class or the command;
it reads it here, before loading any code.

**`target.metamodel` is `"text"`.** Not a package specifier, a marker.
The text-document metamodel is part of the engine, so there is nothing
to resolve, and the string exists to say what the result is. It also
means an `m2t` step can never be followed by another step in a chain:
no transformation declares `"text"` as its source.

**There is no `target.components`.** A model-to-model manifest names
the module holding the target metamodel's tag functions, because the
CLI has to write the result out as a `.tsx` model file in those tags.
An `m2t` result is never written as a model, so there is nothing for
the CLI to serialize and nothing to name.

## `package.json`

Ordinary npm metadata, with nothing Synthesis-specific except the
dependencies:

```json
{
  "name": "sql-tutorial-basic",
  "version": "0.1.0",
  "private": true,
  "description": "Model-to-text tutorial Part 1 companion: relational schema to a single SQL DDL file",
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
    "rel-tutorial-metamodel": "workspace:*"
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "@aelastics/synthesis-cli": "workspace:*"
  }
}
```

The two runtime dependencies are the two things the transformation
imports. Note that `@aelastics/synthesis` earns its place twice here:
it supplies the base class, as it does for every transformation, and
it supplies the target metamodel and its tags, which is particular to
model-to-text work. The source metamodel is the only separate package,
shipped as a dependency so the CLI can resolve it.

## `tsconfig.json`

Identical to the model-to-model package's, because the JSX wiring is
identical:

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

The `/** @jsx createExprNode */` pragma at the top of the `.tsx` file
and the matching `import { createExprNode }` are the other two thirds
of that wiring, and all three have to agree. Nothing about text
generation changes any of it.

## Build, import, install

```bash
npm run build
```

```bash
synth init
synth namespace mk demo
synth model import sample/library-rel.tsx --as demo/library-rel
```

```text
Imported demo/library-rel
```

```bash
synth transformation install .
```

```text
Installed transformation 'sql-tutorial-basic@0.1.0' (m2t) to ~/.synth/transformations/sql-tutorial-basic
```

The install line reports the kind it read from the manifest, which is
the first place a mistyped `kind` shows up.

## Run

```bash
synth transformation run sql-tutorial-basic --in demo/library-rel --out-dir ./generated
```

```text
Running sql-tutorial-basic@0.1.0 (m2t) on demo/library-rel
Wrote /home/you/work/generated/Library_rel.sql
```

`--out-dir` is a directory in the file system, not a workspace
reference, and the CLI resolves it against the directory you invoked
the command from and reports the absolute path of every file it writes.
The directory is created if it does not exist.

There is one `Wrote` line per document in the result. Part 1 emits one
document, so there is one line; Part 2 emits two, and gets two.

## The output

```bash
cat generated/Library_rel.sql
```

```text
-- SQL DDL generated by Synthesis from Library_rel
 
CREATE TABLE Book (
  bookId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  bookTitle VARCHAR(255),
  AuthorId_FK INTEGER REFERENCES Author(authorId)
);
 
CREATE TABLE Author (
  authorId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  authorName VARCHAR(255)
);
 
CREATE TABLE Category (
  categoryId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  categoryName VARCHAR(255)
);
 
CREATE TABLE categorizedAs (
  BookId_FK INTEGER NOT NULL REFERENCES Book(bookId),
  CategoryId_FK INTEGER NOT NULL REFERENCES Category(categoryId)
);
 
```

Every rule from page 2 is visible in it.

- The header line came from the first section of the document, and the
  schema name in it is the source model's own name.
- Four tables became four `CREATE TABLE` statements, in the order the
  tables appear in the schema. The `categorizedAs` join table is a
  table like any other to this generator; nothing in the text
  metamodel or in the rules knows it came from a relationship.
- `bookId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL` is the clause
  order of `columnLine`, with one clause per property. `bookTitle
  VARCHAR(255)` shows the same function saying nothing when there is
  nothing to say: the column is not a key, not auto-increment, and
  nullable, so only the name and the type are emitted.
- The three foreign keys are inline `REFERENCES` clauses, and each one
  names a table that the column itself does not know. `AuthorId_FK`
  references `authorId`, and `tableOwning` found `Author` by searching
  the schema for the table that owns that column.
- The separator lines contain a single space, because a blank line is
  written as `<P>{' '}</P>`. Page 1 explains why an empty string is not
  an option.

The file ends with a separator line, since every statement's section
emits one. Trailing whitespace at the end of a generated file is worth
noticing rather than being surprised by: nothing trims the output, and
what the model says is what the file contains.

## Running the whole tutorial as one chain

Because the source metamodel of this package is the target metamodel of
`eer-tutorial-basic`, the two can run as one command, with the
relational schema passed between them in memory and never written to
disk:

```bash
synth transformation run eer-tutorial-basic sql-tutorial-basic \
  --in demo/library --out-dir ./generated
```

```text
Running 2 steps on demo/library: eer-tutorial-basic -> sql-tutorial-basic
[step 1/2 eer-tutorial-basic] Running eer-tutorial-basic@0.1.0 (m2m)
[step 2/2 sql-tutorial-basic] Running sql-tutorial-basic@0.1.0 (m2t)
Wrote /home/you/work/generated/Library_rel.sql
```

The generated file is identical to the one above, which is the
practical proof that the sample model shipped with this package really
is the model the other tutorial produces. The chain is type-checked
from the manifests before anything executes: step 1's `target.metamodel`
has to equal step 2's `source.metamodel`.

## What can go wrong

**`--out` instead of `--out-dir`.** The two flags are not
interchangeable, and the CLI says which one this transformation needs:

```text
Error: --out is only valid when the transformation is m2m;
'sql-tutorial-basic' is m2t. Use --out-dir <dir>.
```

**Neither flag.** In a terminal session the CLI asks for the missing
directory. Piped, scripted, or in CI it fails instead of guessing:

```text
Error: --out-dir is required for m2t transformation 'sql-tutorial-basic'.
```

**The input model is in the wrong metamodel.** Checked before any
engine work, with exit code 2. Feeding this transformation the EER
model the model-to-model tutorial starts from, rather than the
relational schema it produces, is the easy way to provoke it:

```text
Error: Type mismatch: source model demo/library declares metamodel
'eer-tutorial-metamodel/basic' but transformation 'sql-tutorial-basic'
expects 'rel-tutorial-metamodel'.
```

**A paragraph with an empty string in it.** Page 1's idiom exists for
this reason:

```text
Error: Transformation 'sql-tutorial-basic' failed: childElement undefined for
parent "undefined" of type "/DefaultSchema/M2T_Schema/Paragraph"
```

**Nothing is written, and the run still succeeds.** Text generation
walks the result model's `items`, so only elements that ended up there
become files. A document that is not nested in the `<M2T>` root, or
content that is not connected into a document, is a perfectly valid
part of the model that simply produces no output. Part 2 meets this
properly, because that is where content stops being placed by nesting.

**The usual packaging failures.** `entry` pointing into a `dist/` that
has not been built, an `exportName` that no longer matches the class,
and a missing JSX pragma behave exactly as they do for a
model-to-model package, and the
[model-to-model tutorial's page](../../model-to-model/part-1-basic/5-manifest-and-run.md)
lists the messages.

## Where you are

You have built a complete model-to-text transformation, and the
surprising part is how little of it was about text. A class extending
the same base class, a template returning JSX, rules returning nodes,
one manifest field, and one flag on the run.

What Part 1 leaves open is structure. There is one file because the
template contains one `<Doc>`, and every statement lands where its rule
was written. Both are decisions, made silently, in the shape of the
template. [Part 2](../part-2-structured/index.md) makes them explicit:
content is placed into named sections rather than nested where it is
produced, and the output becomes two documents because two files are
what correct DDL deployment actually needs.
