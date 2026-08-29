# Model-to-text transformations

A model-to-text transformation reads a model and writes files: SQL DDL,
documentation, source code, diagram sources, configuration. The CLI
treats it as a first-class transformation kind (`"kind": "m2t"` in the
manifest, `--out-dir` instead of `--out` on a run), but the authoring
experience differs enough from model-to-model work to deserve its own
tutorial.

## Status: in preparation

This tutorial is being designed. Its structure is not settled yet,
because the questions it has to answer are genuinely different from the
model-to-model ones: how text templates are written and composed, how
generated files are named and laid out, how whitespace and indentation
are controlled, and how a generator stays readable once it carries real
formatting concerns.

Rather than publish a thin page now, we would rather publish a tutorial
that is as complete and as executable as the model-to-model one, where
every listing comes from a smoke-tested package.

## What to read in the meantime

- The **[model-to-model tutorial](../model-to-model/index.md)** covers
  everything the two kinds share: metamodels, JSX authoring, the
  workspace, the `synth.json` manifest, and the build, install, run
  loop. Working through its Part 1 is the fastest way to be ready for
  this tutorial when it lands.
- The **`examples/rel-to-sql-ddl`** package is a complete, working
  model-to-text transformation: a relational schema becomes a SQL DDL
  file, with one global decision controlling identifier quoting. It is
  smoke tested in CI like every other example, so it is executable
  truth rather than prose. The
  [Examples](../../examples/index.md) section describes it and how to
  run it.
- The **[Packaging Transformations](../../guides/packaging-transformations.md)**
  guide documents the manifest fields that are specific to `m2t`
  packages.
