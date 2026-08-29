# Part 3: Configuration-based

Part 1 wrote one file. Part 2 wrote two. Neither of them was wrong.

That is the uncomfortable thing about the two parts you have finished.
A single script is what you want when you are demonstrating a
generator, or reading its output by eye, or piping it into a scratch
database. Tables and constraints apart is what a deployment wants,
because foreign keys can be circular and no ordering of `CREATE TABLE`
statements satisfies every inline `REFERENCES` clause. One file per
table is what a repository wants, where each table is reviewed on its
own and its history is readable in isolation.

Now look at the source schema and try to work out which of the three it
is asking for. It is not asking for any of them. `Library_rel` is four
tables and three foreign keys, and it is exactly the same four tables
and three foreign keys whether the DDL ships as one file, as two, or as
five. The layout is a property of the project the script is deployed
into. The schema has no opinion about it, and cannot acquire one
without being told something that is not about data.

A question the source model cannot answer is precisely what a variation
point is for. So Part 3 hands the file layout over to a configuration,
adds a second and much smaller decision about identifier quoting, and
runs the same transformation on the same schema five different ways.

## Decided once, not once per element

The mechanism is the one the model-to-model tutorial's
[Part 3](../../model-to-model/part-3-configuration-based/index.md)
introduced: a decision model declaring the design space, a binding
model attaching it to a source language, `@VarPoint` and `@VarOption`
in the transformation, and a configuration model closing the space for
one run. This part does not repeat those explanations. It uses them at
a different scale.

There, the issue was raised **once per relationship**. Each 1:N link in
the schema got its own answer, because each one could honestly be
implemented differently from its neighbour. Here, both issues are
raised **once per run**:

- **`OutputLayout`**, with the options `SingleFile`,
  `TablesAndConstraints` (the default) and `FilePerTable`.
- **`IdentifierQuoting`**, with the options `Unquoted` (the default)
  and `DoubleQuoted`.

"Put `Book` in its own file but keep `Author` in the shared one" is not
a layout, it is a mess, and "quote this table's name but not that one"
is not a house style. Both questions have exactly one answer per run,
so both are declared as `GlobalIssue` rather than `ElementIssue`, and
four things follow from that single word:

- The binding model has **no bindings in it**. There is no element to
  attach the issue to, so its body is empty.
- A configuration model holds **exactly two choices**, for this
  four-table schema and for a four-hundred-table schema alike.
- The run announces `decision OutputLayout -> FilePerTable`, with no
  element named in the line.
- The layout decision is taken **before anything is generated**, which
  is what lets it decide how many documents exist at all.

## What changes

Relative to Part 2's package, four things:

- **The transformation class.** It extends `DecisionAwareM2M` instead
  of `abstractM2M` and takes the run's configuration model as a third
  constructor argument.
- **The template.** It stops building documents and hands straight over
  to a variation point whose three options each return a complete
  `<M2T>` expression. A second, three-line variation point wraps
  identifier emission.
- **Three new modules in the package.** A decision model declaring the
  two issues, a binding model naming the two ends the decision
  machinery works across, and the tutorial relational metamodel
  expressed as a model.
- **The manifest.** A `parts` block naming those three modules. Its
  presence is what makes the package configuration-based; there is no
  flag saying so.

## What does not change

The rules that build a `CREATE TABLE` statement or an `ALTER TABLE`
statement. `tableToCreate`, `foreignKeyToAlter` and `columnLine` are
still ordinary methods with no decorators on them, because the decision
is about **which documents exist and what goes in them**, not about how
a statement is spelled. Page 2 is largely about keeping that line
clean.

The source model does not change either, and neither does the build,
install, run loop, beyond the run gaining a configuration.

The finished package is in the repository as
`examples/sql-tutorial-configuration-based`. Use it as the answer key;
every listing on the following pages is taken from it verbatim, and
every command output was produced by running it.

## Prerequisites

- **Parts 1 and 2, finished.** This part rebuilds their two layouts as
  options of one transformation, and it does not repeat how an `<M2T>`
  document tree, a manifest, or the `--out-dir` run works.
- **The model-to-model tutorial's Part 3, read.** The decorators, the
  role of a binding model, the ordering of the manifest's `parts`, and
  the reason a run refuses to apply defaults silently are all explained
  there in full, and referenced rather than restated here.
- The same repository checkout, built once with `rush install` and
  `rush build`, and the `synth` CLI.
- One new dependency in the package, `@synthesis/decision-framework`.
- `"experimentalDecorators": true` in `tsconfig.json`, which Parts 1
  and 2 did not need.

## The arc

Three pages. The design space has to be declared before anything can be
bound to it, the transformation reads it, and the run closes it.

1. **[The design space](./1-the-design-space.md)**: the decision model,
   two global issues, why a global issue needs no binding, and what the
   binding model and the metamodel part are still there for.
2. **[Variation points](./2-variation-points.md)**: `DecisionAwareM2M`,
   the layout point whose options each return a whole `<M2T>` model,
   the quoting point nested inside them, and the manifest's `parts`
   block.
3. **[Running the layouts](./3-running-the-layouts.md)**: the run
   announcements, `--default-configs`, the two-line edit that switches
   an option, and the same schema generated five ways.
