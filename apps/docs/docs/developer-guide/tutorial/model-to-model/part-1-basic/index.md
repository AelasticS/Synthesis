# Part 1: Basic

In this part you build, install, and run a complete model-to-model
transformation package: a simple EER to relational mapping whose logic
is fixed. There are no decorators, no decision models, and no
configuration. Every rule is an ordinary method, and the one place
where the mapping has a genuine choice is settled by a plain `if`
statement.

That is on purpose. Part 1 is where you learn the mechanics that every
Synthesis transformation shares, without any of the variability
machinery competing for your attention. When Parts 2 and 3 introduce
that machinery, they will do it by rewriting code you already
understand.

## What you build

A transformation that maps a Library schema onto a relational schema:

- Each **entity** becomes a table.
- Each **attribute** becomes a column, whose SQL type is derived from
  the attribute's domain.
- Each **relationship** becomes either a join table or a foreign key
  column, decided by cardinality: M:N becomes a join table, everything
  else becomes a foreign key on the N side.

The sample input has three entities (`Book`, `Author`, `Category`), one
1:N relationship (`writtenBy`), and one M:N relationship
(`categorizedAs`), so both branches of the relationship rule are
exercised by a single run.

The finished package exists in the repository as
[`examples/tutorial/eer-tutorial-basic`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/eer-tutorial-basic).
Use it as the answer key whenever you
want to compare; every listing on the following pages is taken from it
verbatim.

## Prerequisites

- A checkout of the Synthesis repository, built once with `rush
  install` and `rush build`. Until the `@synthesis/*` packages are
  published to npm, transformation packages resolve them from the
  repository workspace.
- The `synth` CLI. Inside the repository you can run it as `node
  apps/cli/bin/run.js`; this tutorial writes `synth` for short.
- Working TypeScript knowledge. You do not need to know React, but if
  you do, the JSX in these pages will look familiar and behave
  differently in exactly one respect: the tags build model elements in
  a store, not DOM nodes.

Three ideas carry the whole part:

- The **workspace** is where your models live, by default under
  `~/.synth`. Models are `.tsx` files with a tool-maintained `$synth`
  header, and you address them by reference like `demo/library`, never
  by file path.
- A **transformation package** is an npm package with one extra file:
  the `synth.json` manifest, which declares everything the CLI needs in
  order to install and run the transformation without loading its code.
- **JSX notation is the authoring language.** Models and transformation
  templates are both JSX expressions whose tags come from a metamodel.
  A metamodel declares its concepts as aelastics types and exposes one
  tag function per concept.

## In this part

The five pages follow the order in which the pieces actually have to
exist. Metamodels come first because nothing can be written without
them, the source model second because the transformation needs an
input, the transformation third, and the packaging and the run last.

1. **[The source metamodel](./1-source-metamodel.md)**: the basic
   tutorial EER metamodel, its concepts as aelastics types, its JSX tag
   functions, and why a metamodel has to be an importable package.
2. **[The target metamodel](./2-target-metamodel.md)**: the tutorial's
   simplified relational metamodel, which you reuse rather than author,
   how it models a foreign key, and what the manifest needs from it.
3. **[The source model](./3-source-model.md)**: authoring the sample
   Library schema in JSX, creating a workspace, and importing the model
   through the CLI's validation gate.
4. **[The transformation](./4-transformation.md)**: the class, the JSX
   template, the entity and attribute rules, and the deliberate
   conditional in the relationship rule.
5. **[The manifest and the run](./5-manifest-and-run.md)**:
   `synth.json` field by field, the JSX build wiring, and the loop of
   build, install, run, and inspect.

When you finish, the last page shows the exact relational model the
transformation produces, and lists the errors you are most likely to
hit along the way.
