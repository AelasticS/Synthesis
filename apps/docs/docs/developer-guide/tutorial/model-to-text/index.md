# Model-to-text transformations

A model-to-text transformation reads a model and writes files: SQL DDL,
documentation, source code, diagram sources, configuration. Synthesis
has no separate template language for that, and no second execution
model. Generating text is a transformation like any other, and the only
thing that really changes is the target metamodel.

That target metamodel describes a file system subtree: folders, the
files inside them, and the content of each file. A model written in it
holds items, where an item is either a `Directory`, which becomes a
folder and holds items of its own, or a `Document`, which becomes one
file. Inside a document, a `Section` is a named region and a
`Paragraph` is one line of text. So a model in this metamodel is a plan
of what to write to disk, from the folder structure down to the
individual lines.

The rules that build such a model are the same typed functions
returning JSX that the model-to-model tutorial taught, in a class
extending the same base class. The manifest declares `"kind": "m2t"`,
and a run takes `--out-dir` rather than `--out`. That last difference
is not an arbitrary flag name. A model-to-model transformation produces
exactly one model, which the CLI stores as one workspace model under
the name `--out` gives it. A model-to-text transformation produces a
whole tree, possibly many files in many folders, so there is nothing
single to name: you give it a directory, and the tree described by the
model is written underneath it.

The running case is SQL DDL, and the source metamodel is
`rel-tutorial-metamodel`: exactly what the
[model-to-model tutorial](../model-to-model/index.md) produces. The two
tutorials join up. The relational schema that tutorial's Part 1
generates from its Library model is the model this tutorial consumes,
so you can feed your own output straight in, and every companion
package here ships that generated schema as its sample.

## The three parts

All three parts generate DDL for the same schema. What each part
changes is how the generated text is organized, and what decides it.

### Part 1: Basic

**Available now.**
[Start here](./part-1-basic/index.md).

One file, with fixed logic and no decorators: a header comment and one
`CREATE TABLE` statement per table, each foreign key written as an
inline `REFERENCES` clause. You meet the text-document metamodel and
its components (`M2T`, `Doc`, `Sec`, `P`), the manifest fields that
make a package `m2t`, and a run that writes files. Placement is nesting
here: a rule's output ends up where the rule was written.

Answer key: `examples/tutorial/sql-tutorial-basic`.

### Part 2: Structured

**Available now.**
[Continue here](./part-2-structured/index.md).

The same content, reorganized in two ways. The documents declare empty
named sections and the rules point at the section they belong to with
`SecParent`, so a rule no longer has to be written where its output
lands. And the output becomes two documents, which is two files,
because the foreign keys move out of the `CREATE TABLE` statements into
`ALTER TABLE ... ADD CONSTRAINT` statements in a second file.

That split is not a formatting preference. References can be circular,
so no ordering of `CREATE TABLE` statements satisfies every inline
`REFERENCES` clause, and production DDL therefore creates every table
first and constrains them afterwards. The document structure is the
deployment order made structural.

Answer key: `examples/tutorial/sql-tutorial-structured`.

### Part 3: Configuration-based

**Available now.**
[Continue here](./part-3-configuration-based/index.md).

Parts 1 and 2 each committed to one layout, and both are right for some
project and wrong for another. Nothing in a relational schema says
whether its DDL should ship as one script, as tables plus constraints,
or as one file per table. Part 3 declares that as an issue with options
in a decision model, binds it to the source metamodel, and turns the
layouts into `@VarOption` methods behind a `@VarPoint`. The choice then
lives in a configuration model, is reported on every run, and changes
what files exist without touching code.

Answer key: `examples/tutorial/sql-tutorial-configuration-based`.

## At a glance

| Part | What it generates | Mechanism | Status |
| --- | --- | --- | --- |
| 1: Basic | One file: a header and one `CREATE TABLE` per table, with inline `REFERENCES` | `M2T`, `Doc`, `Sec`, `P`; nesting is placement | Available |
| 2: Structured | Two files: the tables in one, the `ALTER TABLE` constraints in the other | Named sections, `SecParent`, one `Doc` per file | Available |
| 3: Configuration-based | One file, two files, or one file per table, chosen per run | Decision model, binding model, `@VarPoint` and `@VarOption` | Available |

## Text is where a chain ends

Because the source metamodel here is the model-to-model tutorial's
target, the two halves can run as one command. The CLI type-checks the
chain from the manifests first, passes the intermediate model in
memory, and writes only the final files:

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

An `m2t` step may only be the last step of a chain, because its result
is files rather than a model, and nothing can consume it further. That
is the one asymmetry between the two kinds, and it follows from what
they produce rather than from how they are written. The User Guide
covers composing runs in
[Pipelines](../../../user-guide/guides/pipelines.md).

## Prerequisites for all parts

You need a checkout of the Synthesis repository built once with `rush
install` and `rush build`, and the `synth` CLI. Until the
`@synthesis/*` packages are published to npm, transformation packages
resolve them from the repository workspace. Inside the repository you
can run the CLI as `node apps/cli/bin/run.js`; the tutorial writes
`synth` for short.

This tutorial assumes the
[model-to-model tutorial's Part 1](../model-to-model/part-1-basic/index.md).
Metamodels, JSX authoring, the workspace, the `synth.json` manifest,
and the build, install, run loop are shared by both kinds, and they are
explained in full there rather than repeated here. Part 3 additionally
assumes the model-to-model tutorial's
[Part 3](../model-to-model/part-3-configuration-based/index.md), which
introduces decision models, binding models, and variation points.
