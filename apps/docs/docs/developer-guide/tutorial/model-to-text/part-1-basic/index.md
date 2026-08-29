# Part 1: Basic

In this part you build, install, and run a complete model-to-text
transformation package: a relational schema becomes one SQL DDL file.
The logic is fixed. There are no decorators, no decision models, and no
configuration, and the shape of the output is written into the template
rather than chosen.

That is on purpose. Part 1 is where you learn what makes a
transformation produce text at all, without any variability machinery
competing for your attention. The answer turns out to be smaller than
most people expect: a different target metamodel, one manifest field,
and one flag on the run.

## What you build

A transformation that turns the Library relational schema into a single
file named `Library_rel.sql`:

- A **header comment** naming the schema the file was generated from.
- One **`CREATE TABLE` statement per table**, in the order the tables
  appear in the schema.
- One **line per column**, whose clauses each come from one property of
  the column: `PRIMARY KEY` from `isKey`, `AUTOINCREMENT` from
  `isAutoincrement`, `NOT NULL` from `isNullable`, and an inline
  `REFERENCES` clause from `references`.

The sample input is the relational schema the
[model-to-model tutorial](../../model-to-model/index.md) produces from
its Library model: three tables from three entities, a foreign key
column grafted onto `Book`, and a `categorizedAs` join table. Both
kinds of foreign key are therefore exercised by a single run.

The finished package exists in the repository as
`examples/sql-tutorial-basic`. Use it as the answer key whenever you
want to compare; every listing on the following pages is taken from it
verbatim.

## Prerequisites

- A checkout of the Synthesis repository, built once with `rush
  install` and `rush build`, and the `synth` CLI. Inside the repository
  you can run it as `node apps/cli/bin/run.js`; this tutorial writes
  `synth` for short.
- **The model-to-model tutorial's
  [Part 1](../../model-to-model/part-1-basic/index.md).** This part
  does not repeat how JSX authoring, the workspace, a transformation
  class, or the build, install, run loop work. It points at the pages
  that explain them and spends its own pages on what is different.
- Working TypeScript knowledge.

Three ideas carry the whole part:

- **Generating text is not a mode.** The class you write extends the
  same `abstractM2M` base class a model-to-model transformation
  extends, and its `template()` method returns JSX in exactly the same
  way. Only the target type is different.
- **One document is one file.** The target metamodel is a model of
  items; every `Document` item in the result becomes one file under
  `--out-dir`, and its name is the file name. The shape of the document
  tree is the shape of the output.
- **The text metamodel ships with the engine.** It is not one of the
  `@synthesis/standard-metamodels`, because it is not a domain
  language. It is imported from `@synthesis/engine`, and the manifest
  names it with the marker string `"text"`.

## In this part

Three pages, in the order the pieces have to exist.

1. **[Text as a target](./1-text-as-a-target.md)**: the text-document
   metamodel, its concepts and its tag functions, what the generator
   does with a document tree, and where the line breaks come from.
2. **[The generator](./2-the-generator.md)**: the transformation class,
   the template that builds one document, the rules that turn tables
   and columns into statements, and the model navigation an inline
   `REFERENCES` clause needs.
3. **[The manifest and the run](./3-manifest-and-run.md)**: what an
   `m2t` manifest declares, the build, the run with `--out-dir`, the
   generated file in full, and the errors you are most likely to hit.
