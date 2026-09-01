# Part 2: Structured

Part 1 produced correct DDL, and it produced it in the only arrangement
its template could express. There was one file, because the template
contained one `<Doc>`. Every statement landed where its rule was
called, because nesting is placement. Neither of those is wrong, and
both stop working as soon as the output has more than one shape of
content.

Part 2 changes the arrangement and nothing else. The same schema
produces the same statements, reorganized in two ways that are
independent of each other and easy to confuse, so it is worth
separating them at the start.

## What changes

**Content is placed, not nested.** The documents declare empty named
sections, and the rules that produce statements sit at the top level of
the `<M2T>` model, each naming the section it belongs to with
`<SecParent $refByName="..." />`. A rule no longer has to be written
where its output ends up.

**There are two documents, so there are two files.** Every `<Doc>` in
the result becomes one file, so a second document is the entire
mechanism. The foreign keys move out of the `CREATE TABLE` statements
and become `ALTER TABLE ... ADD CONSTRAINT` statements in a second
file.

The second change is the one with a reason behind it that is not about
tidiness. Foreign keys can be circular: two tables can reference each
other, and a table can reference itself. No ordering of `CREATE TABLE`
statements satisfies every inline `REFERENCES` clause, so production
DDL creates every table first and constrains them afterwards. The
document structure here is that deployment order made structural.

## What does not change

Everything else. The source metamodel is the same relational schema,
the sample model is the same file, the manifest differs only in
`exportName`, and the build, install, run loop is the one Part 1
finished with. The transformation still extends `abstractM2M`, still
returns JSX from `template()`, and still assembles the content of each
line as an ordinary string.

The `columnLine` helper loses exactly one branch, the one that emitted
the inline `REFERENCES` clause, and gains nothing.

The finished package exists in the repository as
`examples/model-to-text/sql-tutorial-structured`. Use it as the answer key; every
listing on the following pages is taken from it verbatim.

## Prerequisites

- **Part 1, finished.** This part is a reorganization of the generator
  Part 1 built, and it does not repeat how the text metamodel, the
  manifest, or the run work.
- The same repository checkout and the same `synth` CLI. There is no
  new build setting and no new dependency: unlike the model-to-model
  tutorial's Part 2, this part introduces no decorators.

## In this part

1. **[Sections](./1-sections.md)**: named sections as addresses,
   `SecParent` and the inverse property it writes, what happens when a
   rule forgets to place its output, and what decides the order inside
   a section.
2. **[Multiple documents](./2-multiple-documents.md)**: why the foreign
   keys move to a second file, the rules that produce the `ALTER TABLE`
   statements, the finished template and the two lines that fill both
   documents, and how file names and folders work.
3. **[Run and compare](./3-run-and-compare.md)**: the run, both
   generated files in full, a comparison against Part 1's single file,
   and what remains open for Part 3.
