---
sidebar_position: 3
---

# Tutorial

Synthesis transformations come in two kinds, and this section holds one
hands-on tutorial for each. Both build complete, installable packages
that you run with the `synth` CLI. Every command and every output shown
was executed against the real tools, and every part names a
smoke-tested package from the repository's
[`examples/`](https://github.com/AelasticS/Synthesis/tree/main/examples)
catalog as its
answer key.

## The two tutorials

**[Model-to-model transformations](./model-to-model/index.md)** read a
source model and produce a target model in another metamodel. The
running case is the classic one: an Extended Entity-Relationship schema
becomes a relational schema. The tutorial has four parts. It starts
with a transformation whose logic is fixed and readable in one sitting,
then reworks that same logic twice, each time replacing hand written
branching with a Synthesis mechanism: typed rule specialization, then
configuration-based rules. The closing part changes the naming world
instead of the rules: name scopes let models carry natural names like
`id` with path references between scopes. All four parts are available
now.

**[Model-to-text transformations](./model-to-text/index.md)** read a
model and produce files: SQL DDL, documentation, source code, diagram
sources. Its running case picks up exactly where the other tutorial
leaves off, turning a relational schema into SQL DDL. Its three parts
move from a single generated file, to output structured across several
files, to a generator whose file layout is chosen by a configuration
rather than fixed in the code. All three are available now.

## How to read them

The model-to-model tutorial is the place to start, even if your goal is
text generation. Metamodels, JSX authoring, the workspace, the
`synth.json` manifest, and the build, install, run loop are shared by
both kinds, and the model-to-model tutorial is where they are explained
in full.

If you would rather read finished code before prose, open the
[Examples](../examples/index.md) section first and come back here for
the reasoning behind each piece. If you have never met the `synth` CLI,
the [User Guide's concepts page](../../user-guide/concepts.md) is a
short orientation that this tutorial assumes.
